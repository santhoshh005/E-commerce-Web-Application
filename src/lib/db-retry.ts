/**
 * Retry wrapper for database operations.
 * Handles transient connection failures that occur when Supabase
 * wakes up from a paused state (free-tier projects pause after 7 days
 * of inactivity).
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000,
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
        message.includes("timed out");

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

  // TypeScript needs this, but it should never be reached
  throw new Error("Unexpected: retry loop exited without returning or throwing");
}
