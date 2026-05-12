# Use official Bun image
FROM oven/bun:1.1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source
COPY . .

# Expose port
EXPOSE 3001

# Run server
CMD ["bun", "src/server.ts"]
