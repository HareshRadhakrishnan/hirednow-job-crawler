# syntax=docker/dockerfile:1

# ============================
# Base stage with Node.js
# ============================
FROM node:20-slim AS base

# Install dependencies for Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    ca-certificates \
    procps \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium and configure Chrome crash handling
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_CRASHPAD_HANDLER_DISABLE=1

WORKDIR /app

# ============================
# Builder stage - fresh install
# ============================
FROM base AS builder

WORKDIR /app

# Copy package files only (no lockfile to force fresh resolution for Linux)
COPY package.json ./

# Fresh install for Linux platform - ignore Windows lockfile
RUN npm install --include=optional --legacy-peer-deps

# Copy source files
COPY . .

# Set Next.js environment
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npx next build

# ============================
# Runner stage (production)
# ============================
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create necessary directories for Chrome with proper permissions
RUN mkdir -p /tmp/.chrome-for-testing \
    && mkdir -p /home/nextjs/.cache \
    && mkdir -p /home/nextjs/.config/chromium \
    && mkdir -p /home/nextjs/.local/share \
    && chown -R nextjs:nodejs /tmp/.chrome-for-testing \
    && chown -R nextjs:nodejs /home/nextjs \
    && chmod -R 755 /tmp/.chrome-for-testing

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set HOME for the nextjs user (important for Chrome)
ENV HOME=/home/nextjs

# Switch to non-root user
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
