import { notFound, redirect } from "next/navigation";

import { SHOW_ADMIN_HERO_UI } from "@/features/hero/admin-hero-ui";
import { isLocale } from "@/lib/i18n/config";

type AdminHeroDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

/** Edit UI moved to the hero list modal. */
export default async function AdminHeroDetailPage({
  params,
}: AdminHeroDetailPageProps) {
  if (!SHOW_ADMIN_HERO_UI) {
    notFound();
  }

  const { locale, id } = await params;
  if (!isLocale(locale)) {
    redirect("/");
  }

  redirect(`/${locale}/admin/hero?edit=${id}`);
}
