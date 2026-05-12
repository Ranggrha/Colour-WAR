# Use official Bun image (1.2+ required for bun.lock text format)
FROM oven/bun:latest AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source
COPY . .

# Expose port (Railway will override via $PORT env var)
EXPOSE 3001

# Run server
CMD ["bun", "src/server.ts"]
