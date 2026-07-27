import { Suspense } from "react";
import { notFound } from "next/navigation";

import { AuthCard, AuthPageShell } from "@/features/auth/ui/AuthPageShell";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <AuthPageShell>
      <AuthCard
        title={dictionary.auth.loginTitle}
        subtitle={dictionary.auth.loginSubtitle}
      >
        <Suspense
          fallback={
            <p className="text-center text-sm text-[#395145]">…</p>
          }
        >
          <LoginForm locale={rawLocale} dictionary={dictionary.auth} />
        </Suspense>
      </AuthCard>
    </AuthPageShell>
  );
}
