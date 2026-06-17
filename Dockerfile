FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/seedtrace.db
ENV STATIC_DIR=/app/dist

EXPOSE 3001

VOLUME ["/app/data"]

CMD ["node", "./node_modules/tsx/dist/cli.mjs", "api/index.ts"]
