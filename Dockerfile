# ==========================================
# 1. DEPS STAGE: Install Dependencies
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# 2. BUILDER STAGE: Compile Next.js
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dummy environment variables during static compilation
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV JWT_SECRET=build-time-secret-key-placeholder-only-minimum-32-chars
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/givetrack_db

RUN npm run build

# ==========================================
# 3. RUNNER STAGE: Minimal Alpine Image
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create secure non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Docker healthcheck hitting the /api/health endpoint (executes SELECT 1 on DB)
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
