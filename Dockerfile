# 1️⃣ Base image with Node.js
FROM node:20-alpine AS base
WORKDIR /app

# 2️⃣ Install dependencies (faster builds with caching)
COPY package*.json ./
RUN npm ci --only=production

# 3️⃣ Development dependencies & build
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# 4️⃣ Production image
FROM node:20-alpine AS prod
WORKDIR /app

# Copy only necessary files from build
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Environment
ENV NODE_ENV=production
EXPOSE 3000

# Start the app
CMD ["node", "dist/main"]