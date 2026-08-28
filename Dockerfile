FROM node:20-slim

# Install Chromium and dependencies for Puppeteer & WhatsApp-Web.js
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3001

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY scripts/ ./scripts/
COPY lib/ ./lib/
COPY .env.example .env.local

EXPOSE 3001

CMD ["node", "scripts/whatsapp-daemon.js"]
