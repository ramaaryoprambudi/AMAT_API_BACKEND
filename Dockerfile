# Use the official lightweight Node.js 18 image
# Cloud Run recommends using slim images for faster startup
FROM node:18-slim

# Set the working directory
WORKDIR /usr/src/app

# Create app user for security (non-root)
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies needed for Node.js native modules
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY src/ ./src/

# Copy environment configuration
# Use .env.cloudrun for Cloud Run, fallback to .env.production
COPY .env.cloudrun* .env.production* ./
RUN if [ -f .env.cloudrun ]; then cp .env.cloudrun .env; elif [ -f .env.production ]; then cp .env.production .env; fi

# Create necessary directories
RUN mkdir -p logs uploads/profile-photos uploads/documents uploads/receipts uploads/temp

# Set proper permissions
RUN chown -R appuser:appuser /usr/src/app
RUN chmod -R 755 /usr/src/app/uploads
RUN chmod -R 755 /usr/src/app/logs

# Switch to non-root user
USER appuser

# Expose the port that Cloud Run expects
EXPOSE 8080

# Set environment variables for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080

# Health check for container health monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "src/app.js"]