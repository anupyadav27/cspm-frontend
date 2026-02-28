ARG NODE_VERSION=22.16.0

# ---------------- deps ----------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------- builder ----------------
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------- runner ----------------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# copy build output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# install ONLY prod deps
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

EXPOSE 3000
CMD ["npm", "start"]

