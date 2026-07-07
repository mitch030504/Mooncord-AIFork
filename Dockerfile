FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:26-alpine
WORKDIR /app
RUN apk add --no-cache tini ffmpeg
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/locales ./locales
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/meta ./src/meta
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]