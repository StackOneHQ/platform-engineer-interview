export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
}

/**
 * Runs `fn`, retrying on failure with exponential backoff.
 * Used by the service HTTP handlers to smooth over transient DB/cache blips.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = opts.baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

/** Reads a required environment variable or throws if it is missing/empty. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Masks the password in a Postgres/Redis connection string for safe logging. */
export function redactUrl(url: string): string {
  return url.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}
