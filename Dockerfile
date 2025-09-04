# Playwright w/Chrome + Ubuntu (includes fonts + drivers)
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

USER root

# Install required packages for checkpoint portal
RUN apt-get update && apt-get install -y \
    x11vnc \
    xvfb \
    fluxbox \
    websockify \
    novnc \
    x11-utils \
    xauth \
    && rm -rf /var/lib/apt/lists/*

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
