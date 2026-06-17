FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production \
  PORT=3001 \
  DB_PATH=/app/data/seedtrace.db \
  STATIC_DIR=/app/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3001) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "node_modules/tsx/dist/cli.mjs", "api/index.ts"]
