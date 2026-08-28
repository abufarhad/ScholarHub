const DEFAULT_UA =
  process.env.CRAWLER_USER_AGENT ??
  "ScholarHubBot/1.0 (+https://scholarhub.example/about; respectful academic-scholarship aggregator)";

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with a hard timeout, capped retries, and exponential backoff.
 * Used for every outbound crawler request so one slow/broken page can't hang
 * a crawl run or hammer a source that's returning errors.
 */
export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const { timeoutMs = 15_000, retries = 2, userAgent = DEFAULT_UA } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(timer);
      if (!res.ok) {
        throw new FetchError(`HTTP ${res.status} for ${url}`, url, res.status);
      }
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      // Don't retry 4xx client errors — the page genuinely doesn't exist / is
      // forbidden and retrying wastes requests against the source's server.
      if (err instanceof FetchError && err.status && err.status < 500) throw err;
      if (attempt < retries) {
        await sleep(2 ** attempt * 1000);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}

/** Politeness delay between requests to the same source. */
export function politeDelay(ms: number) {
  return sleep(ms);
}
