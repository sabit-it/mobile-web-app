FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN echo '#!/bin/sh' > /usr/local/bin/bob && echo 'exit 0' >> /usr/local/bin/bob && chmod +x /usr/local/bin/bob
RUN HUSKY=0 npm ci --legacy-peer-deps
COPY . .
RUN npx expo export --platform web

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
