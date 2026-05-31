FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY angular.json tsconfig.json tsconfig.app.json .postcssrc.json ./
COPY public ./public
COPY src ./src
RUN pnpm run build

FROM nginx:1.27-alpine

ENV PORT=80
ENV API_UPSTREAM=http://api:8080

COPY --from=build /app/dist/sapcyti-spa/browser /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates-spa/default.conf.template
COPY --chmod=755 nginx/render-default-conf.sh /docker-entrypoint.d/10-render-spa-nginx.sh
