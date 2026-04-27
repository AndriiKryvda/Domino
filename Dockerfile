FROM node:20-alpine AS builder

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install

# Install client dependencies
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install

# Copy source (after npm install so node_modules aren't overwritten)
COPY server/src ./server/src
COPY server/tsconfig.json ./server/tsconfig.json
COPY client/src ./client/src
COPY client/index.html ./client/index.html
COPY client/tsconfig.json client/vite.config.ts ./client/

# Build server
RUN cd server && ./node_modules/.bin/tsc

# Build client
RUN cd client && ./node_modules/.bin/vite build

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/dist/index.js"]
