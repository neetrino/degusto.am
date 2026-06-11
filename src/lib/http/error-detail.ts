const DEFAULT_PUBLIC_ERROR_DETAIL = "An error occurred";

export function publicErrorDetailFromUnknown(error: unknown): string {
  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PUBLIC_ERROR_DETAIL;
  }
  return error instanceof Error ? error.message : String(error);
}
