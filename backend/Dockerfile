# syntax=docker/dockerfile:1
# =============================================
# Koleya Backend — image de production
# =============================================
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Exécution non-root
RUN addgroup -S koleya && adduser -S koleya -G koleya

COPY --from=build /app/node_modules ./node_modules
COPY . .

USER koleya
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "src/server.js"]
