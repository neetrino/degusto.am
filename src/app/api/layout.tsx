import type { ReactNode } from "react";

/** Prisma / PostgreSQL require Node.js (not Edge). */
export const runtime = "nodejs";

export default function ApiLayout({ children }: { children: ReactNode }) {
  return children;
}
