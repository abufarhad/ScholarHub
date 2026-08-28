import { fetchText } from "./http";

interface RobotsRules {
  disallow: string[];
  allow: string[];
}

const cache = new Map<string, RobotsRules | null>();

/**
 * Minimal robots.txt parser covering the "User-agent: *" group only (every
 * source this platform crawls only publishes a wildcard group). Missing
 * robots.txt (404/network error) means "no restrictions declared" per the
 * standard, so it's treated as allow-all rather than a crawl failure.
 */
async function getRules(baseUrl: string): Promise<RobotsRules | null> {
  if (cache.has(baseUrl)) return cache.get(baseUrl)!;

  let rules: RobotsRules | null = null;
  try {
    const text = await fetchText(new URL("/robots.txt", baseUrl).toString(), { retries: 0, timeoutMs: 8000 });
    rules = parseRobotsTxt(text);
  } catch {
    rules = null; // no robots.txt found or unreachable — treat as allow-all
  }
  cache.set(baseUrl, rules);
  return rules;
}

function parseRobotsTxt(text: string): RobotsRules {
  const lines = text.split("\n").map((l) => l.trim());
  const disallow: string[] = [];
  const allow: string[] = [];
  let inWildcardGroup = false;

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      inWildcardGroup = value === "*";
    } else if (inWildcardGroup && key === "disallow" && value) {
      disallow.push(value);
    } else if (inWildcardGroup && key === "allow" && value) {
      allow.push(value);
    }
  }
  return { disallow, allow };
}

export async function isPathAllowed(baseUrl: string, path: string): Promise<boolean> {
  const rules = await getRules(baseUrl);
  if (!rules) return true;

  // Longest matching rule wins, per the de-facto robots.txt convention.
  const matches = (rule: string) => path.startsWith(rule);
  const bestDisallow = rules.disallow.filter(matches).sort((a, b) => b.length - a.length)[0];
  const bestAllow = rules.allow.filter(matches).sort((a, b) => b.length - a.length)[0];

  if (!bestDisallow) return true;
  if (bestAllow && bestAllow.length >= bestDisallow.length) return true;
  return false;
}
