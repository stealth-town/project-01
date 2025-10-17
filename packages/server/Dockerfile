# ---- Build stage ----
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy only needed workspace packages
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Install dependencies
RUN yarn install

# Build shared first
WORKDIR /app/packages/shared
RUN yarn build

# Then build the server
WORKDIR /app/packages/server
RUN yarn build

# ---- Runtime stage ----
FROM node:24-alpine

WORKDIR /app

# Copy entire built packages (dist + package.json + node_modules)
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/server ./packages/server

# Copy root files for proper module resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules

# Set working dir to server
WORKDIR /app/packages/server

EXPOSE 3000

CMD ["node", "dist/index.js"]