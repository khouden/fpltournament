import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

function createPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  return new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pgPool ?? createPool();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

let clientInstance: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = clientInstance;
}

export function resetPrismaClient(): PrismaClient {
  try {
    clientInstance.$disconnect().catch(() => {});
  } catch {
    // Ignore disconnect errors during reset
  }
  try {
    if (globalForPrisma.pgPool) {
      globalForPrisma.pgPool.end().catch(() => {});
      globalForPrisma.pgPool = undefined;
    }
  } catch {
    // Ignore pool end errors
  }
  clientInstance = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = clientInstance;
  }
  return clientInstance;
}

function isConnectionError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("connection closed") ||
    msg.includes("Connection closed") ||
    msg.includes("Connection reset") ||
    msg.includes("Connection terminated") ||
    msg.includes("connection timeout") ||
    msg.includes("timed out") ||
    msg.includes("Connection pool timeout") ||
    msg.includes("PrismaClientInitializationError") ||
    msg.includes("socket has been ended") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ECONNREFUSED")
  );
}

/**
 * Resilient Prisma proxy that automatically recovers and retries once
 * if a cloud connection is dropped or idle socket closed (e.g. db.prisma.io:5432).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const current = clientInstance;
    const value = Reflect.get(current, prop, receiver);

    // Proxy model delegates (e.g. prisma.tournament.findMany)
    if (typeof value === "object" && value !== null) {
      return new Proxy(value, {
        get(modelTarget, modelProp, modelReceiver) {
          const modelMethod = Reflect.get(modelTarget, modelProp, modelReceiver);
          if (typeof modelMethod === "function") {
            return async function (...args: unknown[]) {
              try {
                return await modelMethod.apply(modelTarget, args);
              } catch (err: unknown) {
                if (isConnectionError(err)) {
                  console.warn(
                    `[prisma] Database connection dropped on ${String(prop)}.${String(modelProp)}. Reconnecting...`
                  );
                  const freshClient = resetPrismaClient();
                  const freshModel = Reflect.get(freshClient, prop);
                  const freshMethod = Reflect.get(freshModel, modelProp);
                  return await freshMethod.apply(freshModel, args);
                }
                throw err;
              }
            };
          }
          return modelMethod;
        },
      });
    }

    // Proxy root functions (e.g. prisma.$transaction, prisma.$queryRaw)
    if (typeof value === "function") {
      return async function (...args: unknown[]) {
        try {
          return await value.apply(current, args);
        } catch (err: unknown) {
          if (isConnectionError(err)) {
            console.warn(
              `[prisma] Database connection dropped on root ${String(prop)}. Reconnecting...`
            );
            const freshClient = resetPrismaClient();
            const freshMethod = Reflect.get(freshClient, prop);
            return await freshMethod.apply(freshClient, args);
          }
          throw err;
        }
      };
    }

    return value;
  },
});
