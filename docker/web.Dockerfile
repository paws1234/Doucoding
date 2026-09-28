# syntax=docker/dockerfile:1

# ---------- build ----------
# Debian/glibc base on purpose — see "Container network gotcha" in plan.md §3.
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Deps first, so this layer caches across source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV EXPO_NO_TELEMETRY=1 NODE_ENV=production
# app.json: { "web": { "output": "single" } }  ->  static SPA in /app/dist
RUN npx expo export --platform web

# ---------- serve ----------
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# exec-form: no `sh -c` wrapper, so SIGTERM reaches nginx directly and stops are instant.
CMD ["nginx", "-g", "daemon off;"]
