# =============================================================================
# WebblyHost - Production Dockerfile for Dokploy Deployment
# =============================================================================
# Multi-stage build for optimized production image
# Supports runtime environment variables injection
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies (Base for installation)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile --prefer-offline

# -----------------------------------------------------------------------------
# Stage 2: Builder (Build the application)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    && rm -rf /var/cache/apk/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application

# Set environment variables for build
# These are build-time defaults; runtime env will override via next.config.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true

# Add build arguments for public environment variables
# This ensures they are baked into the client-side bundle
ARG NEXT_PUBLIC_SHARED_HOSTING_GID
ARG NEXT_PUBLIC_WORDPRESS_HOSTING_GID
ARG NEXT_PUBLIC_VPS_HOSTING_GID
ARG NEXT_PUBLIC_ECOMMERCE_HOSTING_GID
ARG NEXT_PUBLIC_EMAIL_SERVICE_GID
ARG NEXT_PUBLIC_WHMCS_URL
ARG NEXT_PUBLIC_REVOLUT_PUBLIC_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MARKETGO
ARG NEXT_PUBLIC_NORDVPN
ARG NEXT_PUBLIC_SSL
ARG NEXT_PUBLIC_WEBBUILDER
ARG WHMCS_FREE_DOMAIN_CONFIG
ARG WHMCS_ADDORDER_DOMAIN_FORMAT

ENV NEXT_PUBLIC_SHARED_HOSTING_GID=$NEXT_PUBLIC_SHARED_HOSTING_GID
ENV NEXT_PUBLIC_WORDPRESS_HOSTING_GID=$NEXT_PUBLIC_WORDPRESS_HOSTING_GID
ENV NEXT_PUBLIC_VPS_HOSTING_GID=$NEXT_PUBLIC_VPS_HOSTING_GID
ENV NEXT_PUBLIC_ECOMMERCE_HOSTING_GID=$NEXT_PUBLIC_ECOMMERCE_HOSTING_GID
ENV NEXT_PUBLIC_EMAIL_SERVICE_GID=$NEXT_PUBLIC_EMAIL_SERVICE_GID
ENV NEXT_PUBLIC_WHMCS_URL=$NEXT_PUBLIC_WHMCS_URL
ENV NEXT_PUBLIC_REVOLUT_PUBLIC_KEY=$NEXT_PUBLIC_REVOLUT_PUBLIC_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_MARKETGO=$NEXT_PUBLIC_MARKETGO
ENV NEXT_PUBLIC_NORDVPN=$NEXT_PUBLIC_NORDVPN
ENV NEXT_PUBLIC_SSL=$NEXT_PUBLIC_SSL
ENV NEXT_PUBLIC_WEBBUILDER=$NEXT_PUBLIC_WEBBUILDER
ENV WHMCS_FREE_DOMAIN_CONFIG=$WHMCS_FREE_DOMAIN_CONFIG
ENV WHMCS_ADDORDER_DOMAIN_FORMAT=$WHMCS_ADDORDER_DOMAIN_FORMAT

# Build Next.js application
RUN pnpm exec next build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production image)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

# Set to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install runtime dependencies only
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    && rm -rf /var/cache/apk/*

# Copy public assets
COPY --from=builder /app/public ./public

# Set up standalone directory structure
# Next.js standalone creates its own directory structure
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy translations for i18n (required at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/translations ./translations

# Expose port
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Start the application directly
CMD ["node", "server.js"]
