# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: Build the application ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone server output
COPY --from=builder /app/.next/standalone ./
# Copy static assets (CSS, JS, images, etc.)
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets (favicon, uploads folder, etc.)
COPY --from=builder /app/public ./public
# Copy Drizzle migration files (needed for auto-migration on startup)
COPY --from=builder /app/drizzle ./drizzle

# Create the uploads directory so the volume mount has a target
RUN mkdir -p /app/public/uploads

EXPOSE 3000

CMD ["node", "server.js"]
