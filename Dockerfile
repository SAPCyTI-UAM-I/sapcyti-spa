# SPEC-010 — multi-stage: pnpm build → Nginx static + edge config
# Build context: sapcyti-spa/ (referenced from sapcyti-api/docker-compose.yml)

FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY --from=build /app/dist/sapcyti-spa/browser /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
