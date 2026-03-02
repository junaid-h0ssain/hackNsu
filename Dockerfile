# Build stage
FROM oven/bun:canary-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN bun install

COPY . .
RUN bun run build

# Add this line to DEBUG - it will list files so you can see the folder name in logs
RUN ls -la /app

# Production stage
FROM nginx:alpine
# Check if your folder is named 'dist' or 'build' or 'out'
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
