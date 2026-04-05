# ── Build Stage ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production Stage ──
FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/.env.example ./.env.example

# Serve static + API
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
