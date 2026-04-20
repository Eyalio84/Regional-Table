# ------------------------------------------------------------
# The Regional Table — production Dockerfile (nginx-alpine static serve)
#
# Build: docker build -t regional-table .
# Run:   docker run -p 8080:8080 regional-table
# ------------------------------------------------------------

# ---- Stage 1: build Astro static output ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# PUBLIC_CUISINE_API_URL and PUBLIC_SITE_URL can be injected at build time:
#   docker build --build-arg PUBLIC_CUISINE_API_URL=https://cuisine-api.verbalogix.com .
ARG PUBLIC_CUISINE_API_URL=https://cuisine-api.verbalogix.com
ARG PUBLIC_SITE_URL=https://cuisine.verbalogix.com
ENV PUBLIC_CUISINE_API_URL=$PUBLIC_CUISINE_API_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

RUN npm run build

# ---- Stage 2: nginx serve ----
FROM nginx:alpine AS serve

# Cloud Run requires the container listen on $PORT (default 8080), not 80.
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Drop default html and copy Astro's dist/ output
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

# Health + 404 behavior: serve our custom 404.astro output
RUN sed -i 's|error_page  404|error_page 404 /404.html; location = /404.html { internal; }\n    # fallback|' /etc/nginx/conf.d/default.conf || true

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
