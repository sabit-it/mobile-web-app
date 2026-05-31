FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN printf '#!/bin/sh\nexit 0\n' > /usr/local/bin/bob && chmod +x /usr/local/bin/bob && \
    printf '#!/bin/sh\nexit 0\n' > /usr/local/bin/husky && chmod +x /usr/local/bin/husky
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx expo export --platform web

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
