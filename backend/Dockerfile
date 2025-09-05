FROM node:18-slim

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

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and Playwright browsers
RUN npm install
RUN npx playwright install chromium --with-deps

# Copy application code
COPY . .

# Expose port (Railway will override this)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
