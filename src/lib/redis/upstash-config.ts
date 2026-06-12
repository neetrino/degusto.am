export type UpstashRestCredentials = {
  url: string;
  token: string;
};

/**
 * Resolves Upstash REST credentials from env.
 * Supports Upstash direct vars and Vercel KV aliases.
 */
export function resolveUpstashRestCredentials(): UpstashRestCredentials | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}
