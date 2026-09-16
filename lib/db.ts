import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

function createPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
  });

  pool.on("error", (err) => {
    console.warn("[pg-pool] Background client error:", err.message);
  });

  return pool;
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

let reconnectPromise: Promise<PrismaClient> | null = null;

export async function resetPrismaClient(): Promise<PrismaClient> {
  if (reconnectPromise) return reconnectPromise;

  reconnectPromise = (async () => {
    try {
      if (clientInstance) {
        await clientInstance.$disconnect().catch(() => {});
      }
    } catch {
      // Ignore disconnect errors during reset
    }
    try {
      if (globalForPrisma.pgPool) {
        await globalForPrisma.pgPool.end().catch(() => {});
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
  })();

  try {
    return await reconnectPromise;
  } finally {
    reconnectPromise = null;
  }
}

function isConnectionError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = String((err as any)?.code || "");
  const name = String((err as any)?.name || "");

  const connectionCodes = [
    "P1001",
    "P1002",
    "P1008",
    "P1017",
    "P2024",
    "P2010",
    "P2037",
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EPIPE",
    "EHOSTUNREACH",
    "ENOTFOUND",
    "57P01",
    "57P02",
    "57P03",
    "08000",
    "08003",
    "08006",
    "08001",
    "08004",
    "08007",
  ];

  if (connectionCodes.includes(code)) return true;
  if (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientRustPanicError"
  ) {
    return true;
  }

  return (
    msg.includes("closed the connection") ||
    msg.includes("connection closed") ||
    msg.includes("connection reset") ||
    msg.includes("connection terminated") ||
    msg.includes("connection timeout") ||
    msg.includes("connection lost") ||
    msg.includes("timed out") ||
    msg.includes("timeout") ||
    msg.includes("cant reach database") ||
    msg.includes("can't reach database") ||
    msg.includes("socket has been ended") ||
    msg.includes("socket closed") ||
    msg.includes("broken pipe") ||
    msg.includes("not usable") ||
    msg.includes("client has been closed") ||
    msg.includes("terminating connection") ||
    msg.includes("connection pool timeout") ||
    msg.includes("ssl connection has been closed") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout")
  );
}

/**
 * Resilient Prisma proxy that automatically recovers and retries with backoff
 * if a cloud connection is dropped or idle socket closed (e.g. db.prisma.io:5432).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const current = clientInstance;
    const value = Reflect.get(current, prop);

    // Proxy model delegates (e.g. prisma.tournament.findMany)
    if (typeof value === "object" && value !== null) {
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelMethod = Reflect.get(modelTarget, modelProp);
          if (typeof modelMethod === "function") {
            return async function (...args: unknown[]) {
              const maxAttempts = 3;
              let lastErr: unknown;
              for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                  const activeClient = clientInstance;
                  const activeModel =
                    Reflect.get(activeClient, prop) ?? modelTarget;
                  const activeMethod =
                    Reflect.get(activeModel, modelProp) ?? modelMethod;
                  return await activeMethod.apply(activeModel, args);
                } catch (err: unknown) {
                  lastErr = err;
                  if (isConnectionError(err) && attempt < maxAttempts) {
                    console.warn(
                      `[prisma] Database connection issue on ${String(prop)}.${String(modelProp)} (attempt ${attempt}/${maxAttempts}). Reconnecting...`
                    );
                    await resetPrismaClient();
                    await new Promise((resolve) =>
                      setTimeout(resolve, attempt * 500)
                    );
                    continue;
                  }
                  throw err;
                }
              }
              throw lastErr;
            };
          }
          return modelMethod;
        },
      });
    }

    // Proxy root functions (e.g. prisma.$transaction, prisma.$queryRaw)
    if (typeof value === "function") {
      return async function (...args: unknown[]) {
        const maxAttempts = 3;
        let lastErr: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const activeClient = clientInstance;
            const activeMethod = Reflect.get(activeClient, prop) ?? value;
            return await activeMethod.apply(activeClient, args);
          } catch (err: unknown) {
            lastErr = err;
            if (isConnectionError(err) && attempt < maxAttempts) {
              console.warn(
                `[prisma] Database connection issue on root ${String(prop)} (attempt ${attempt}/${maxAttempts}). Reconnecting...`
              );
              await resetPrismaClient();
              await new Promise((resolve) =>
                setTimeout(resolve, attempt * 500)
              );
              continue;
            }
            throw err;
          }
        }
        throw lastErr;
      };
    }

    return value;
  },
});

