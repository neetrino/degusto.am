import { notFound } from "next/navigation";

import {
  AuthCard,
  AuthPageShell,
  firstAuthPhoneHref,
} from "@/features/auth/ui/AuthPageShell";
import { ForgotPasswordForm } from "@/features/auth/ui/ForgotPasswordForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <AuthPageShell
      mobileChrome={{
        locale: rawLocale,
        brand: dictionary.brand,
        callLabel: dictionary.home.call,
        phoneHref: firstAuthPhoneHref(dictionary.footer.phones),
        languageLabel: dictionary.header.language,
        searchLabel: dictionary.header.search,
        searchPlaceholder: dictionary.header.search,
      }}
    >
      <AuthCard
        title={dictionary.auth.forgotPasswordTitle}
        subtitle={dictionary.auth.forgotPasswordSubtitle}
      >
        <ForgotPasswordForm locale={rawLocale} dictionary={dictionary.auth} />
      </AuthCard>
    </AuthPageShell>
  );
}
