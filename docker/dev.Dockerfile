FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV EXPO_NO_TELEMETRY=1 BROWSER=none CI=1
EXPOSE 8081
CMD ["npx", "expo", "start", "--port", "8081"]
