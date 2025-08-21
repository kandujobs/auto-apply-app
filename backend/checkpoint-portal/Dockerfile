# Playwright w/Chrome + Ubuntu (includes fonts + drivers)
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

USER root
RUN apt-get update && apt-get install -y \
    x11vnc xvfb fluxbox websockify novnc \
 && rm -rf /var/lib/apt/lists/*

ENV DISPLAY=:99
ENV VNC_PORT=5900
ENV NOVNC_PORT=6080
ENV NODE_ENV=production

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

EXPOSE 8080 6080
CMD ["node","server.js"]
