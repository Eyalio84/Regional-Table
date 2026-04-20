#!/usr/bin/env bash
# smoke.sh — full project health check for regional-table.
#
# Checks:
#   1. All 9 SMM artifacts exist
#   2. astro check (TypeScript / type checking)
#   3. npm run build succeeds (skip with --fast flag if on a slow dev machine)
#   4. Dev server boots on port 4321 (or 4322+), responds to curl, then is killed
#
# Usage:
#   ./scripts/smoke.sh           # full check including build
#   ./scripts/smoke.sh --fast    # skip build (artifact + typecheck + dev server only)
#
# Exit 0 on all checks passing. Exit 1 on any failure.

set -uo pipefail
cd "$(dirname "$0")/.."

FAST=false
for arg in "$@"; do
  [[ "$arg" == "--fast" ]] && FAST=true
done

PASS=0
FAIL=0
DEVPID=""

fail() { echo "[FAIL] $*"; FAIL=$((FAIL+1)); }
ok()   { echo "[OK]   $*"; PASS=$((PASS+1)); }

cleanup() {
  if [ -n "$DEVPID" ]; then
    kill "$DEVPID" 2>/dev/null || true
    wait "$DEVPID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ── 1. SMM artifacts present ──────────────────────────────────────────────────
echo ""
echo "=== 1. SMM artifacts ==="
for f in \
  CLAUDE.md \
  START-HERE.md \
  docs/ARCHITECTURE.md \
  docs/DECISIONS.md \
  docs/POSITIONING.md \
  docs/DEPLOY.md \
  CHANGELOG.md \
  scripts/smoke.sh \
  scripts/check-copy.sh
do
  if [ -f "$f" ]; then
    ok "artifact: $f"
  else
    fail "artifact missing: $f"
  fi
done

# Also check the layout and styles that form the M0 scaffold
for f in \
  src/layouts/BaseLayout.astro \
  src/styles/global.css \
  src/styles/tokens.css \
  src/pages/index.astro \
  src/pages/about.astro \
  src/pages/ask.astro \
  src/pages/colophon.astro \
  src/pages/regions/index.astro \
  src/pages/recipes/index.astro \
  astro.config.mjs
do
  if [ -f "$f" ]; then
    ok "scaffold: $f"
  else
    fail "scaffold missing: $f"
  fi
done

# ── 2. Typecheck ──────────────────────────────────────────────────────────────
echo ""
echo "=== 2. astro check (typecheck) ==="
TMPLOG=$(mktemp)
if npx astro check > "$TMPLOG" 2>&1; then
  ok "astro check passes"
else
  fail "astro check failed — see below"
  tail -20 "$TMPLOG"
fi
rm -f "$TMPLOG"

# ── 3. Build (optional, skip with --fast) ────────────────────────────────────
echo ""
echo "=== 3. npm run build ==="
if [ "$FAST" = true ]; then
  echo "[SKIP] Build skipped (--fast mode). Run without --fast to include."
else
  BUILDLOG=$(mktemp)
  if npm run build > "$BUILDLOG" 2>&1; then
    ok "npm run build succeeds"
    # Confirm output directory exists with at least one HTML file
    HTML_COUNT=$(find dist -name "*.html" 2>/dev/null | wc -l)
    if [ "$HTML_COUNT" -gt 0 ]; then
      ok "dist/ contains $HTML_COUNT HTML file(s)"
    else
      fail "dist/ exists but no HTML files found"
    fi
  else
    fail "npm run build failed — see below"
    tail -20 "$BUILDLOG"
  fi
  rm -f "$BUILDLOG"
fi

# ── 4. Dev server boots + responds ───────────────────────────────────────────
echo ""
echo "=== 4. Dev server boot ==="

# Kill any existing Astro dev processes on 4321/4322
pkill -f "astro dev" 2>/dev/null || true
sleep 1

DEVLOG=$(mktemp)
npm run dev > "$DEVLOG" 2>&1 &
DEVPID=$!

# Astro dev server prints "Local    http://localhost:PORT/" when ready
READY_PORT=""
for i in $(seq 1 20); do
  sleep 2
  if grep -qE "Local.*http://localhost:" "$DEVLOG" 2>/dev/null; then
    READY_PORT=$(grep -oE "localhost:[0-9]+" "$DEVLOG" | head -1 | cut -d: -f2)
    break
  fi
  # Also check for "ready in" which appears just before the Local line
  if grep -q "ready in" "$DEVLOG" 2>/dev/null; then
    sleep 1
    READY_PORT=$(grep -oE "localhost:[0-9]+" "$DEVLOG" | head -1 | cut -d: -f2)
    [ -n "$READY_PORT" ] && break
  fi
done

if [ -n "$READY_PORT" ]; then
  ok "dev server ready on port $READY_PORT"

  HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:${READY_PORT}/" --max-time 15 2>/dev/null)
  if [ "$HTTP" = "200" ]; then
    ok "GET / returns HTTP $HTTP"
  else
    fail "GET / returned HTTP $HTTP (expected 200)"
  fi
else
  fail "dev server never reported ready (waited 40s)"
  echo "--- last 20 lines of dev log ---"
  tail -20 "$DEVLOG"
fi

# Cleanup is handled by trap EXIT
kill "$DEVPID" 2>/dev/null || true
wait "$DEVPID" 2>/dev/null || true
DEVPID=""
rm -f "$DEVLOG"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "smoke result: $PASS pass, $FAIL fail"
if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
