# Base image for building and running the app
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package.json package-lock.json ./

# Install dependencies using npm
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app
RUN npm run build  # Pastikan build menghasilkan .next/standalone

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry in the production container as well
ENV NEXT_TELEMETRY_DISABLED=1

# Create a system user and group to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output and static files from the builder
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static

# Use the non-root user to run the app
USER nextjs

EXPOSE 3000

# Set the environment variable for the app's port
ENV PORT=3000

# Start the app using the standalone entry point (usually index.js or a custom entry point)
CMD ["node", "/app/server.js"]
