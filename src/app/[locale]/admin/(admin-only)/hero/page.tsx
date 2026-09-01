import { notFound } from "next/navigation";

import { SHOW_ADMIN_HERO_UI } from "@/features/hero/admin-hero-ui";
import { listAdminHeroSlides } from "@/features/hero/application/queries";
import { AdminHeroView } from "@/features/hero/ui/AdminHeroView";
import { isLocale } from "@/lib/i18n/config";

type AdminHeroPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function AdminHeroPage({
  params,
  searchParams,
}: AdminHeroPageProps) {
  if (!SHOW_ADMIN_HERO_UI) {
    notFound();
  }

  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const { edit } = await searchParams;
  const slides = await listAdminHeroSlides();

  return (
    <AdminHeroView locale={locale} slides={slides} initialEditId={edit} />
  );
}

