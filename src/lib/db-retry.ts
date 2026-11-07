import { NextResponse } from "next/server";

/**
 * Fallback wrapper for database operations.
 * Provides an in-memory fallback when Supabase PostgreSQL is paused
 * (free-tier auto-pause) or otherwise unreachable.
 *
 * Only connectivity failures trigger the fallback. Business errors
 * (duplicate email, insufficient inventory, record not found, foreign-key
 * violations) are re-thrown so callers can return the correct response
 * instead of silently writing to the in-memory store.
 */

const CONNECTIVITY_MARKERS = [
  "Can't reach database",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAUTHQUERY",
  "P1001",
  "P1002",
  "P1017",
  "timed out",
  "terminating connection",
  "Connection terminated",
  "connection timeout",
  "Tenant or user not found",
  "not available",
];

class DatabaseTimeoutError extends Error {}

/** Thrown when the database is down and in-memory writes are disabled. */
export class DatabaseUnavailableError extends Error {
  constructor() {
    super("The store database is temporarily unavailable. Please try again in a minute.");
    this.name = "DatabaseUnavailableError";
  }
}

/**
 * In-memory writes are not durable (lost on restart, not shared between
 * server instances), so they are off in production unless
 * ALLOW_FALLBACK_WRITES=true is set.
 */
export function fallbackWritesAllowed() {
  const flag = process.env.ALLOW_FALLBACK_WRITES;
  if (flag !== undefined) return flag === "true";
  return process.env.NODE_ENV !== "production";
}

/**
 * Wraps a fallback that writes to the in-memory store. When fallback
 * writes are disabled, it fails with DatabaseUnavailableError instead.
 */
export function writeFallback<T>(operation: () => Promise<T> | T): () => Promise<T> | T {
  return () => {
    if (!fallbackWritesAllowed()) throw new DatabaseUnavailableError();
    return operation();
  };
}

/** Returns a 503 response for DatabaseUnavailableError, otherwise null. */
export function unavailableResponse(error: unknown) {
  if (!(error instanceof DatabaseUnavailableError)) return null;
  return NextResponse.json({ error: error.message }, { status: 503, headers: { "Retry-After": "30" } });
}

export function isConnectivityError(error: unknown): boolean {
  if (error instanceof DatabaseTimeoutError) return true;
  if (error instanceof Error && error.name === "PrismaClientInitializationError") return true;

  const message = error instanceof Error ? error.message : String(error);
  return CONNECTIVITY_MARKERS.some((marker) => message.includes(marker));
}

/**
 * Executes a database operation with a timeout guard (default: 2500ms).
 * If PostgreSQL is healthy, it returns the real database result.
 * If PostgreSQL is paused or unreachable, it falls back to the provided
 * in-memory operation. Any other error is re-thrown unchanged.
 */
export async function executeWithFallback<T>(
  dbOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T> | T,
  timeoutMs = 2500,
): Promise<{ data: T; isFallback: boolean }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new DatabaseTimeoutError(`Database connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([dbOperation(), timeoutPromise]);
    return { data: result, isFallback: false };
  } catch (error: unknown) {
    if (!isConnectivityError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Resilient Fallback] Database unavailable (${message}). Serving in-memory fallback.`);
    const fallbackData = await fallbackOperation();
    return { data: fallbackData, isFallback: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Returns the Prisma error code (e.g. "P2025") when present. */
export function prismaErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
