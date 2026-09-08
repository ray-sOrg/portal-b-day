FROM oven/bun:1.3.10-alpine AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,id=bday-bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN bun run build

FROM oven/bun:1.3.10-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
USER app
EXPOSE 3000
CMD ["bun", "server.js"]
