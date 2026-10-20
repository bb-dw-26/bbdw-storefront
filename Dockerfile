FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_USERS_URL=http://localhost:3001
ARG VITE_CATALOG_URL=http://localhost:3002
ARG VITE_CHECKOUT_URL=http://localhost:3003
ENV VITE_USERS_URL=$VITE_USERS_URL
ENV VITE_CATALOG_URL=$VITE_CATALOG_URL
ENV VITE_CHECKOUT_URL=$VITE_CHECKOUT_URL
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
