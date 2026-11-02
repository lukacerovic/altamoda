import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  const isProd = process.env.NODE_ENV === 'production'
  // Hosted DBs (Render) need SSL; a same-host Postgres (cPanel) usually has none.
  // DATABASE_SSL=false opts out; otherwise production keeps SSL on as before.
  const useSsl = isProd && process.env.DATABASE_SSL !== 'false'

  // Serverless-friendly pool:
  // - small max so we don't exhaust DB's connection cap across many warm instances
  //   (a single long-running server can raise it via DATABASE_POOL_MAX)
  // - short idle timeout so pooled connections don't get killed server-side while cached
  // - reasonable connection timeout for cold-start DB handshake
  const adapter = new PrismaPg({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX) || 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  })
  return new PrismaClient({ adapter })
}

// Cache client across warm serverless invocations too — without this, every warm
// request creates a fresh PrismaClient + pg.Pool, leaking connections.
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma
