/** Flattens form or query values into a string map. */
export function parseIdramRequestFields(
  source: FormData | URLSearchParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  source.forEach((value, key) => {
    if (typeof value === "string" && value.length > 0) {
      result[key] = value;
    }
  });
  return result;
}

export function idramPlainText(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
