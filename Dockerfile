# Use a more reliable base image with better network connectivity
FROM node:18-slim

USER root

# Set timezone to prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Configure apt to use more reliable mirrors and install packages
RUN echo 'Acquire::http::Timeout "30";' > /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::ftp::Timeout "30";' >> /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::Retries "3";' >> /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::https::Timeout "30";' >> /etc/apt/apt.conf.d/99timeout && \
    sed -i 's|http://archive.ubuntu.com|https://mirror.rackspace.com|g' /etc/apt/sources.list && \
    sed -i 's|http://security.ubuntu.com|https://mirror.rackspace.com|g' /etc/apt/sources.list && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove -y

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
