import { notFound } from "next/navigation";

import {
  AuthCard,
  AuthPageShell,
  firstAuthPhoneHref,
} from "@/features/auth/ui/AuthPageShell";
import { ResetPasswordForm } from "@/features/auth/ui/ResetPasswordForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

function resolveToken(raw: string | string[] | undefined): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0];
  }
  return "";
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const token = resolveToken(query.token);

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
        title={dictionary.auth.resetPasswordTitle}
        subtitle={dictionary.auth.resetPasswordSubtitle}
      >
        <ResetPasswordForm
          locale={rawLocale}
          token={token}
          dictionary={dictionary.auth}
        />
      </AuthCard>
    </AuthPageShell>
  );
}
