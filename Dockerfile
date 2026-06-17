# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/dist \
    DB_PATH=/data/seedtrace.db

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --omit=dev

RUN apk del python3 make g++ && rm -rf /var/cache/apk/*

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/api ./api

COPY --from=builder /app/shared ./shared

RUN mkdir -p /data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["npx", "tsx", "api/index.ts"]
