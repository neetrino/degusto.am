import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocument } from "@/features/legal/ui/LegalDocument";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type TermsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);
  const canonicalPath = `/${locale}/legal/terms`;

  return {
    title: dictionary.footer.terms,
    description: dictionary.legal.terms.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: dictionary.footer.terms,
      description: dictionary.legal.terms.description,
      type: "website",
      url: canonicalPath,
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  return (
    <LegalDocument
      documentTitle={dictionary.footer.terms}
      copy={dictionary.legal.terms}
    />
  );
}
