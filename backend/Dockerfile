FROM node:18-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

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
