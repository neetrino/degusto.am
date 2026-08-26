import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SHOW_CONTACT_DETAILS_SECTION } from "@/features/contact/contact-ui";
import { ContactForm } from "@/features/contact/ui/ContactForm";
import { ContactInfo } from "@/features/contact/ui/ContactInfo";
import { ContactMap } from "@/features/contact/ui/ContactMap";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);
  const canonicalPath = `/${locale}/contact`;

  return {
    title: dictionary.contact.title,
    description: dictionary.contact.mapTitle,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: dictionary.contact.title,
      description: dictionary.contact.mapTitle,
      type: "website",
      url: canonicalPath,
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <div
      data-contact-page
      className="mx-auto w-full max-w-7xl px-4 pb-8 pt-[7.5rem] sm:px-6 lg:px-8"
    >
      {SHOW_CONTACT_DETAILS_SECTION ? (
        <div className="mx-auto max-w-7xl bg-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <ContactInfo copy={dictionary.contact} />
            <ContactForm
              copy={{
                name: dictionary.contact.name,
                email: dictionary.contact.email,
                phone: dictionary.contact.phone,
                message: dictionary.contact.message,
                submit: dictionary.contact.submit,
                success: dictionary.contact.success,
                error: dictionary.contact.error,
              }}
            />
          </div>
        </div>
      ) : null}
      <ContactMap copy={dictionary.contact} footer={dictionary.footer} />
    </div>
  );
}
