FROM node:20-alpine AS deps

WORKDIR /app

COPY void-sdk/package.json void-sdk/package-lock.json* void-sdk/
COPY void-demo/package.json void-demo/package-lock.json* void-demo/
RUN cd void-sdk && npm install
RUN cd void-demo && npm install

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/void-sdk/node_modules void-sdk/node_modules
COPY --from=deps /app/void-demo/node_modules void-demo/node_modules
COPY void-sdk void-sdk
COPY void-demo void-demo

RUN cd void-sdk && npm run build
RUN cd void-demo && npm run build

FROM node:20-alpine AS runner

WORKDIR /app/void-demo

ENV NODE_ENV=production

RUN addgroup -S void && adduser -S void -G void

COPY --from=builder /app/void-demo/.next ./.next
COPY --from=builder /app/void-demo/public ./public
COPY --from=builder /app/void-demo/node_modules ./node_modules
COPY --from=builder /app/void-demo/package.json ./
COPY --from=builder /app/void-demo/next.config.js ./

USER void

EXPOSE 3000

CMD ["npx", "next", "start"]
