/**
 * Retry and Fallback wrappers for database operations.
 * Handles transient connection failures and provides an instant in-memory
 * fallback when Supabase PostgreSQL is paused (free-tier 7-day auto-pause)
 * or when the 2-project quota limit is reached.
 */

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const isTransient =
        message.includes("Can't reach database") ||
        message.includes("connection") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ENOTFOUND") ||
        message.includes("not available") ||
        message.includes("EAUTHQUERY") ||
        message.includes("P1001") ||
        message.includes("P1002") ||
        message.includes("timed out") ||
        message.includes("terminating connection");

      if (isTransient && attempt < maxRetries) {
        console.warn(
          `[DB Retry] Attempt ${attempt}/${maxRetries} failed (${message}). Retrying in ${baseDelay * attempt}ms...`,
        );
        await new Promise((r) => setTimeout(r, baseDelay * attempt));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unexpected: retry loop exited without returning or throwing");
}

/**
 * Executes a database operation with a fast timeout guard (default: 2500ms).
 * If PostgreSQL is healthy, it returns the real database result.
 * If PostgreSQL is paused, asleep, or unreachable, it immediately falls back
 * to the provided in-memory operation with zero customer-facing downtime.
 */
export async function executeWithFallback<T>(
  dbOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T> | T,
  timeoutMs = 2500,
): Promise<{ data: T; isFallback: boolean }> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Database connection timed out after ${timeoutMs}ms (Supabase may be paused/sleeping)`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([dbOperation(), timeoutPromise]);
    if (timer) clearTimeout(timer);
    return { data: result, isFallback: false };
  } catch (error: unknown) {
    if (timer) clearTimeout(timer);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Resilient Fallback] Supabase PostgreSQL unavailable (${message}). Serving in-memory fallback.`);
    const fallbackData = await fallbackOperation();
    return { data: fallbackData, isFallback: true };
  }
}
