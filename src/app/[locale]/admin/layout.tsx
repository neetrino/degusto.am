import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { MobileBottomNavIsland } from "@/components/layout/MobileBottomNavIsland";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { requireStaff } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  CURRENCY_COOKIE_NAME,
  parseCurrencyCookie,
} from "@/lib/money/currency-cookie";

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<unknown>;
};

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = (await params) as { locale: string };
  if (!isLocale(locale)) notFound();
  const user = await requireStaff(locale);

  const dictionary = getDictionary(locale);
  const cookieStore = await cookies();
  const currency = parseCurrencyCookie(
    cookieStore.get(CURRENCY_COOKIE_NAME)?.value,
  );

  return (
    <AdminShell
      locale={locale}
      role={user.role}
      mobileBottom={
        <MobileBottomNavIsland
          locale={locale}
          currency={currency}
          dictionary={dictionary}
        />
      }
    >
      {children}
    </AdminShell>
  );
}
