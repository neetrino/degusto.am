import { notFound } from "next/navigation";

import { listAdminDeliveryLocations } from "@/features/delivery/application/queries";
import { AdminDeliveryView } from "@/features/delivery/ui/AdminDeliveryView";
import { getDeliverySchedule } from "@/features/settings/application/queries";
import { isLocale } from "@/lib/i18n/config";

type AdminDeliveryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDeliveryPage({
  params,
}: AdminDeliveryPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const [locations, schedule] = await Promise.all([
    listAdminDeliveryLocations(),
    getDeliverySchedule(),
  ]);

  return (
    <AdminDeliveryView
      locale={locale}
      locations={locations}
      schedule={schedule}
    />
  );
}
