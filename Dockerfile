FROM node:20-bookworm AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm install tsx
COPY api/ ./api/
COPY shared/ ./shared/
COPY --from=builder /app/dist ./dist
ENV PORT=3001
ENV DB_PATH=/data/seedtrace.db
ENV STATIC_DIR=/app/dist
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npx", "tsx", "api/index.ts"]
