# Deploy — PRoot Ubuntu → Cloud Run

On-device deploy playbook for both services: `regional-table` (Astro frontend) and `cuisine-expert-api` (FastAPI backend). Runs entirely on the Android / Termux device via a PRoot Ubuntu environment. Total wall-clock for a first deploy of both services: ~45-60 minutes. Re-deploys: ~10-15 minutes per service.

**Important: Do NOT deploy without explicit confirmation from Eyal.** This playbook documents the procedure for M6. Running `gcloud run deploy` against a production project is an irreversible write. Confirm the milestone before executing Phase 4 or later.

---

## GCP topology

```
GCP project: verbalogic-intake-interview (project number 578521941842)
Region: us-central1

Services:
  regional-table         → cuisine.verbalogix.com
  cuisine-expert-api     → cuisine-api.verbalogix.com
  verbalogic-intake      → intake.verbalogix.com (existing, do not touch)
```

---

## Phase 1 — One-time PRoot Ubuntu setup (~15 min)

Run in a regular Termux shell.

### 1.1 Install Ubuntu rootfs (if not already installed)

```bash
proot-distro install ubuntu
```

Downloads ~400 MB. One-time only.

### 1.2 Log into Ubuntu

```bash
proot-distro login ubuntu
```

Prompt changes to `root@localhost:~#`.

### 1.3 Install Node 20 + build essentials (inside Ubuntu)

```bash
apt update && apt install -y curl ca-certificates gnupg git

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node --version   # expect v20.x
npm --version    # expect 10.x
```

### 1.4 Install Python + pip (for cuisine-expert-api)

```bash
apt install -y python3 python3-pip python3-venv
python3 --version   # expect 3.11+
```

### 1.5 Install the Google Cloud CLI

```bash
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" > /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
apt update && apt install -y google-cloud-cli

gcloud --version
```

### 1.6 Authenticate gcloud

```bash
gcloud auth login --no-launch-browser
# Open the printed URL in any browser, sign in, paste the code back
gcloud config set project verbalogic-intake-interview
gcloud config set run/region us-central1
```

### 1.7 Enable required APIs (once per project, may already be enabled)

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

---

## Phase 2 — Copy source from Termux into PRoot (~1 min)

```bash
# Inside Ubuntu:
mkdir -p /workspace

# Copy frontend
cp -r /data/data/com.termux/files/home/regional-table /workspace/
cd /workspace/regional-table
rm -rf node_modules dist

# Copy backend (when M5 is complete and Dockerfile exists)
cp -r /storage/emulated/0/Download/claude-projects/Cuisine-expert /workspace/
cd /workspace/Cuisine-expert
```

---

## Phase 3 — Build the Astro frontend (~5 min)

```bash
cd /workspace/regional-table
npm ci
npm run build   # outputs to dist/; should complete in <10s for 10-20 pages
ls dist/        # confirm HTML files present
```

If the build fails, **stop and fix** in Termux before proceeding. The error is easier to diagnose locally.

---

## Phase 4 — Secrets → Secret Manager (one-time, ~2 min)

```bash
# Anthropic API key for cuisine-expert-api
ANTHROPIC_KEY="<paste key here — do not commit this command to git>"
printf '%s' "$ANTHROPIC_KEY" | gcloud secrets create anthropic-api-key --data-file=-
unset ANTHROPIC_KEY

# Grant Cloud Run service account access
PROJECT_NUMBER=578521941842
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

To rotate the key later: `printf '%s' "<new>" | gcloud secrets versions add anthropic-api-key --data-file=-`

---

## Phase 5 — Deploy `cuisine-expert-api` (~5-8 min)

(M5 must be complete: Dockerfile exists at `Cuisine-expert/backend/Dockerfile`.)

```bash
cd /workspace/Cuisine-expert/backend

gcloud run deploy cuisine-expert-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 20 \
  --timeout 60 \
  --set-env-vars "CORS_ORIGINS=https://cuisine.verbalogix.com,RATE_LIMIT_PER_HOUR=10" \
  --set-secrets "ANTHROPIC_API_KEY=anthropic-api-key:latest"
```

On success, gcloud prints the service URL. Test it:

```bash
API_URL=$(gcloud run services describe cuisine-expert-api --region us-central1 --format 'value(status.url)')
curl -s "$API_URL/health"   # expect {"status": "ok"} or similar
```

---

## Phase 6 — Deploy `regional-table` (nginx-alpine static serve, ~5 min)

The Astro build produces a `dist/` directory of static HTML/CSS/JS. We serve it with nginx-alpine.

Create `Dockerfile` in the project root (this should already exist from M0 if we added it):

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

Note: nginx-alpine defaults to port 80. Cloud Run expects port 8080. The nginx config needs adjusting:

```bash
# Add this to the Dockerfile before the CMD line:
RUN sed -i 's/listen\s*80/listen 8080/g' /etc/nginx/conf.d/default.conf
```

Deploy:

```bash
cd /workspace/regional-table

# Set the PUBLIC_CUISINE_API_URL to the deployed API service URL
API_URL=$(gcloud run services describe cuisine-expert-api --region us-central1 --format 'value(status.url)')

# Rebuild with the real API URL injected
PUBLIC_CUISINE_API_URL="$API_URL" npm run build

gcloud run deploy regional-table \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 256Mi \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 30
```

---

## Phase 7 — DNS (GoDaddy) + domain mappings (~5 min + propagation)

### 7.1 Create Cloud Run domain mappings

```bash
# Frontend
gcloud beta run domain-mappings create \
  --service=regional-table \
  --domain=cuisine.verbalogix.com \
  --region=us-central1

# Backend API
gcloud beta run domain-mappings create \
  --service=cuisine-expert-api \
  --domain=cuisine-api.verbalogix.com \
  --region=us-central1
```

Both commands output the CNAME records to add at GoDaddy.

### 7.2 GoDaddy DNS records

Sign in → My Products → `verbalogix.com` → DNS → Add:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `cuisine` | `ghs.googlehosted.com` | 1 hour |
| CNAME | `cuisine-api` | `ghs.googlehosted.com` | 1 hour |

### 7.3 Wait for SSL

```bash
# Poll until both domains resolve
for domain in cuisine.verbalogix.com cuisine-api.verbalogix.com; do
  for i in $(seq 1 30); do
    dig +short "$domain" CNAME | grep -q . && echo "$domain resolving" && break
    sleep 30
  done
done

# Test SSL
curl -sI https://cuisine.verbalogix.com | head -3
curl -sI https://cuisine-api.verbalogix.com/health | head -3
```

---

## Phase 8 — Budget alerts + Anthropic cap

### 8.1 GCP budget alerts

GCP Console → Billing → Budgets & Alerts → Create budget:
- Budget amount: $25/month
- Alert thresholds: 20% ($5), 60% ($15), 100% ($25)
- Email alerts to: verbalogic.project@gmail.com

### 8.2 Anthropic monthly cap

Anthropic Console → API keys → the key used by cuisine-expert-api → Set monthly spend limit: **$25/month**.

This is the backstop. Even if rate limiting fails completely, spending cannot exceed $25.

---

## Phase 9 — Post-deploy smoke checklist

From any browser or phone:

- [ ] `https://cuisine.verbalogix.com` loads homepage, fonts render (DM Serif Display visible)
- [ ] `https://cuisine.verbalogix.com/regions/` loads
- [ ] `https://cuisine.verbalogix.com/recipes/ragu-napoletano` loads, atlas-plate layout correct
- [ ] Chat widget on recipe page hydrates after scrolling to it; sends a message; receives regional voice response
- [ ] `https://cuisine.verbalogix.com/ask` loads; Master Chef chat works
- [ ] Floating gold pill visible on a recipe page; opens Master Chef modal; chat responds
- [ ] SSL valid on both domains (padlock in browser)
- [ ] `curl -A "Googlebot" https://cuisine.verbalogix.com/recipes/ragu-napoletano` returns rendered HTML with recipe content (not just a JS shell)
- [ ] Rate limit test: fire 11 POST requests to `https://cuisine-api.verbalogix.com/api/v1/chat` from one IP; 11th returns 429

---

## Re-deploying (post-M6)

After any content or code change:

```bash
proot-distro login ubuntu
cd /workspace/regional-table

# Refresh source
rm -rf src public scripts *.mjs *.json *.md *.css *.ts Dockerfile dist
cp -r /data/data/com.termux/files/home/regional-table/. .
rm -rf node_modules dist

# Rebuild + redeploy
npm ci
API_URL=$(gcloud run services describe cuisine-expert-api --region us-central1 --format 'value(status.url)')
PUBLIC_CUISINE_API_URL="$API_URL" npm run build
gcloud run deploy regional-table --source . --region us-central1
```

Rollback to previous revision:
```bash
gcloud run services update-traffic regional-table \
  --to-revisions=<previous-revision-name>=100 --region us-central1
```

---

## Quick reference

| What | Command |
|---|---|
| Enter Ubuntu | `proot-distro login ubuntu` |
| Exit Ubuntu | `exit` |
| Frontend URL | `gcloud run services describe regional-table --region us-central1 --format 'value(status.url)'` |
| API URL | `gcloud run services describe cuisine-expert-api --region us-central1 --format 'value(status.url)'` |
| Tail frontend logs | `gcloud run services logs tail regional-table --region us-central1` |
| Tail API logs | `gcloud run services logs tail cuisine-expert-api --region us-central1` |
| Rotate Anthropic key | `printf '%s' "<new>" \| gcloud secrets versions add anthropic-api-key --data-file=-` |
| Delete a service | `gcloud run services delete <service-name> --region us-central1` |

---

## Related

- [`START-HERE.md`](../START-HERE.md) — project status
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — service topology
- [`docs/DECISIONS.md`](DECISIONS.md) — rationale for static output and Cloud Run choices
- [`../CHANGELOG.md`](../CHANGELOG.md) — add a "deploy shipped" entry after Phase 9 passes
