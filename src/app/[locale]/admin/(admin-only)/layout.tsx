import { requireAdmin } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

type AdminOnlyLayoutProps = {
  children: React.ReactNode;
  params: Promise<unknown>;
};

/**
 * Full admin sections — ADMIN only.
 * Dispatchers are redirected to orders by requireAdmin.
 */
export default async function AdminOnlyLayout({
  children,
  params,
}: AdminOnlyLayoutProps) {
  const { locale } = (await params) as { locale: string };
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale);
  return children;
}
