# Playwright w/Chrome + Ubuntu (includes fonts + drivers)
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

USER root

# Set timezone to prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Configure apt and install packages in one layer to avoid hanging
RUN echo 'Acquire::http::Timeout "30";' > /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::ftp::Timeout "30";' >> /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::Retries "3";' >> /etc/apt/apt.conf.d/99timeout && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    x11vnc \
    xvfb \
    fluxbox \
    websockify \
    novnc \
    x11-utils \
    xauth \
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove -y

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
