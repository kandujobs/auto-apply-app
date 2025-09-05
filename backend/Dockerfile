FROM node:18-slim

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
