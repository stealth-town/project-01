# ---- Build stage ----
FROM node:24-alpine AS builder

WORKDIR /app

# Copy Yarn files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Force Yarn to use node_modules instead of PnP (optional)
# RUN echo "nodeLinker: node-modules" >> .yarnrc.yml

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
COPY packages/workers/trade-engine ./packages/workers/trade-engine

# Install dependencies
RUN yarn install

# Build shared and worker
WORKDIR /app/packages/shared
RUN yarn build

# Then build the server
WORKDIR /app/packages/server
RUN yarn build

# Then build the trade-engine
WORKDIR /app/packages/workers/trade-engine
RUN yarn build

# ---- Runtime stage ----
FROM node:24-alpine

WORKDIR /app

# Copy necessary files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy built artifacts and node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/server ./packages/server
COPY --from=builder /app/packages/workers/trade-engine ./packages/workers/trade-engine
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/packages/workers/trade-engine

CMD ["node", "dist/index.js"]