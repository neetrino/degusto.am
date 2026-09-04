type UpstashCredentials = {
  url: string;
  token: string;
};

/** True when Upstash REST credentials are present. */
export function isUpstashConfigured(
  input: { url?: string; token?: string },
): input is UpstashCredentials {
  return Boolean(input.url && input.token);
}
