import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL must be defined");
  }
  const pool = new Pool({
    connectionString: dbUrl,
    // Auto-reconnect settings for Supabase free-tier pause/wake
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5,
  });
  pool.on("connect", (client) => {
    client.query("SET search_path TO ecommerce");
  });
  pool.on("error", (err) => {
    console.error("[PG Pool] Unexpected error on idle client:", err.message);
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
