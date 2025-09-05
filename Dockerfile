# Use a more reliable base image with better network connectivity
FROM node:18-slim

USER root

# Set timezone to prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install essential packages using default repositories
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Playwright and browsers
RUN npm install -g playwright@1.45.0 && \
    playwright install chromium --with-deps

# Set environment variables
ENV DISPLAY=:99
ENV VNC_PORT=5900
ENV NOVNC_PORT=6080
ENV NODE_ENV=production
ENV DATA_ROOT=/data/profiles

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ .

EXPOSE 3001
CMD ["npm", "start"]
