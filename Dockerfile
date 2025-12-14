# ----------------------------------------------------
# 1) BUILD STAGE
# ----------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# 🔥 COPY PRISMA SCHEMA TRƯỚC (QUAN TRỌNG NHẤT)
COPY prisma ./prisma

# Install dependencies (postinstall lúc này OK)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client (rõ ràng, dễ debug)
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS
RUN pnpm run build



# ----------------------------------------------------
# 2) RUNTIME STAGE
# ----------------------------------------------------
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

RUN mkdir -p uploads/

EXPOSE 8000
CMD ["node", "dist/main.js"]


# # ----------------------------------------------------
# # 1) BUILD STAGE
# # ----------------------------------------------------
# FROM node:22-alpine AS builder

# WORKDIR /app

# # Install pnpm globally
# RUN npm install -g pnpm

# # Copy dependency files
# COPY package.json pnpm-lock.yaml* ./

# # Install dependencies (only production deps needed to build dist)
# RUN pnpm install --frozen-lockfile

# # generate Prisma Client
# RUN npx prisma generate

# # Copy source
# COPY . .

# # Build NestJS into /dist
# RUN pnpm run build



# # ----------------------------------------------------
# # 2) RUNTIME STAGE (SUPER LIGHTWEIGHT)
# # ----------------------------------------------------
# FROM node:22-alpine

# WORKDIR /app

# ENV NODE_ENV=production

# # Copy only what is required for runtime
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY package.json ./

# # Create persistent directories
# RUN mkdir -p uploads/

# # Expose BE port
# EXPOSE 8000

# CMD ["node", "dist/main.js"]
