FROM oven/bun:1.3.10-alpine AS dependencies
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN --mount=type=cache,id=bday-bun,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN --mount=type=cache,id=bday-next,target=/app/.next/cache \
    bun run build && \
    bun build scripts/dispatch-reminders.ts --target=bun \
      --outfile /app/.runtime/dispatch-reminders.js

# The release hook only needs the Prisma CLI, not the application's complete
# dependency tree. The web server uses Next's traced standalone dependencies.
FROM oven/bun:1.3.10-alpine AS migration-tools
WORKDIR /tools
COPY runtime-tools/package.json runtime-tools/bun.lock runtime-tools/bunfig.toml ./
RUN --mount=type=cache,id=bday-bun,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --production

FROM oven/bun:1.3.10-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=migration-tools /tools/node_modules ./node_modules
COPY --from=builder /app/.next/standalone/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/.runtime ./.runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
USER app
EXPOSE 3000
CMD ["bun", "server.js"]
