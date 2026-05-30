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

COPY --from=build /app/dist/sapcyti-spa/browser /usr/share/nginx/html
