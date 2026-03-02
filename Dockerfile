# Build stage
FROM ovhcom/bun:1.2-alpine AS builder  # Use an official Bun image
WORKDIR /app
COPY package*.json bun.lockb ./       # Include the bun lockfile for faster installs
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production stage (stays the same)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
