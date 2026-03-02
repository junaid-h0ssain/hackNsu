# Build stage
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Copy lockfiles
COPY package*.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
