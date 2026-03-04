# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/ src/
COPY tsconfig.json nest-cli.json ./

RUN npm run build

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# mysql-client provides mysqladmin for the healthcheck loop in entrypoint.sh
RUN apk add --no-cache mysql-client

COPY --from=builder /app/dist ./dist

COPY package*.json ./
RUN npm ci --omit=dev

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
