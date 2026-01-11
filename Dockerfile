# =====================
# Build stage
# =====================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy full source
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build


# =====================
# Production stage
# =====================
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm install --omit=dev
WORKDIR /app/server
RUN npm install --omit=dev

# Copy built artifacts and server code
COPY --from=builder /app/server /app/server
COPY --from=builder /app/client/build /app/client/build

# Expose API port
EXPOSE 5000

# Start server
CMD ["node", "index.js"]
