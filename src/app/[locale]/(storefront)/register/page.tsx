import { notFound } from "next/navigation";

import { AuthCard, AuthPageShell } from "@/features/auth/ui/AuthPageShell";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <AuthPageShell>
      <AuthCard
        title={dictionary.auth.registerTitle}
        subtitle={dictionary.auth.registerSubtitle}
      >
        <RegisterForm locale={rawLocale} dictionary={dictionary.auth} />
      </AuthCard>
    </AuthPageShell>
  );
}
