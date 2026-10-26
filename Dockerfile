FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_CATALOG_URL=http://localhost:3002
ARG VITE_CHECKOUT_URL=http://localhost:3003
ENV VITE_CATALOG_URL=$VITE_CATALOG_URL
ENV VITE_CHECKOUT_URL=$VITE_CHECKOUT_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT=bbdw-local
ARG VITE_SENTRY_RELEASE
ARG VITE_DEMO_SCENARIO=none
ARG VITE_DEMO_RUN_ID=local
RUN npm run build
# Mapas são enviados separadamente ao Sentry, nunca servidos pelo nginx.
RUN find dist -name "*.map" -delete

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
