# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# ---------- Stage 2: Production Runner ----------
FROM node:20-alpine AS runner
ENV NODE_ENV=production

# Install tini for proper process signal handling (SIGTERM, SIGINT)
RUN apk add --no-cache tini wget

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

USER appuser

# Render provides the PORT env var, we listen on it automatically via env.port
# We remove the hardcoded HEALTHCHECK to avoid failures if PORT != 5000
# Render handles health checks via the dashboard settings

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
