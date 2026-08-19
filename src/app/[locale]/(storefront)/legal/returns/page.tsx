import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocument } from "@/features/legal/ui/LegalDocument";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ReturnsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: ReturnsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);
  const canonicalPath = `/${locale}/legal/returns`;

  return {
    title: dictionary.footer.returnPolicy,
    description: dictionary.legal.returns.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: dictionary.footer.returnPolicy,
      description: dictionary.legal.returns.description,
      type: "website",
      url: canonicalPath,
    },
  };
}

export default async function ReturnsPage({ params }: ReturnsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  return (
    <LegalDocument
      documentTitle={dictionary.footer.returnPolicy}
      copy={dictionary.legal.returns}
    />
  );
}
