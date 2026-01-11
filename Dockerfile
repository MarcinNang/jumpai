# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd ../client && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies
RUN npm install --production
RUN cd server && npm install --production

# Copy built files
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build

# Expose port
EXPOSE 5000

# Start server
WORKDIR /app/server
CMD ["node", "index.js"]
