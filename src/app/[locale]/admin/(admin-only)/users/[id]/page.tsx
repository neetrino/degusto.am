import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_TITLE,
  ADMIN_LINK_BACK,
} from "@/features/admin/ui/admin-form-classes";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import { getAdminUserById } from "@/features/users/application/queries";
import {
  getEligibleUserStatuses,
  isUserRole,
  isUserStatus,
} from "@/features/users/domain/user-lifecycle";
import { UpdateUserRoleForm } from "@/features/users/ui/UpdateUserRoleForm";
import { UpdateUserStatusForm } from "@/features/users/ui/UpdateUserStatusForm";
import { isLocale } from "@/lib/i18n/config";

type AdminUserDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function userStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE") return "bg-[#3e573d]/15 text-[#3e573d]";
  if (normalized === "PENDING" || normalized === "INVITED") {
    return "bg-[#f7d18f]/45 text-[#8a5a12]";
  }
  if (
    normalized === "SUSPENDED" ||
    normalized === "BANNED" ||
    normalized === "ANONYMIZED"
  ) {
    return "bg-red-100 text-red-800";
  }
  return "bg-[#e8e2d9] text-[#5c564e]";
}

function userRoleBadgeClass(role: string): string {
  return role.toUpperCase() === "ADMIN"
    ? "bg-[#ff7f20]/15 text-[#c45a0a]"
    : "bg-[#e8e2d9] text-[#5c564e]";
}

function formatUtcDateTime(value: Date): string {
  return `${value.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const detail = await getAdminUserById(id);
  if (!detail) {
    notFound();
  }

  const { user, recentOrders } = detail;
  const role = isUserRole(user.role) ? user.role : null;
  const status = isUserStatus(user.status) ? user.status : null;
  const eligibleStatuses = status ? getEligibleUserStatuses(status) : [];
  const isAnonymized = status === "ANONYMIZED";

  return (
    <section>
      <div className="mb-6">
        <p className={`mb-1 ${ADMIN_PAGE_SUBTITLE}`}>
          <Link
            href={`/${locale}/admin/users`}
            className={ADMIN_LINK_BACK}
          >
            Users
          </Link>
        </p>
        <h1 className={ADMIN_PAGE_TITLE}>
          {user.firstName} {user.lastName}
        </h1>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{user.email}</p>
      </div>

      <Card className="mb-6 p-6">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p className="text-[#5c564e]">
            Role:{" "}
            <span
              className={`${ADMIN_BADGE} ${userRoleBadgeClass(user.role)}`}
            >
              {user.role}
            </span>
          </p>
          <p className="text-[#5c564e]">
            Status:{" "}
            <span
              className={`${ADMIN_BADGE} ${userStatusBadgeClass(user.status)}`}
            >
              {user.status}
            </span>
          </p>
          <p className="text-[#5c564e]">Phone: {user.phone ?? "—"}</p>
          <p className="text-[#5c564e]">
            Email verified:{" "}
            {user.emailVerifiedAt
              ? user.emailVerifiedAt.toISOString().slice(0, 10)
              : "no"}
          </p>
          <p className="text-[#5c564e]">
            Last login:{" "}
            {user.lastLoginAt
              ? user.lastLoginAt.toISOString().slice(0, 16).replace("T", " ")
              : "never"}{" "}
            UTC
          </p>
          <p className="text-[#5c564e]">
            Created: {user.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {role ? (
          <UpdateUserRoleForm
            locale={locale}
            userId={user.id}
            currentRole={role}
            disabled={isAnonymized}
          />
        ) : (
          <p className="text-sm text-red-700">Unknown role.</p>
        )}
        {status ? (
          <UpdateUserStatusForm
            locale={locale}
            userId={user.id}
            currentStatus={status}
            eligibleStatuses={eligibleStatuses}
          />
        ) : (
          <p className="text-sm text-red-700">Unknown status.</p>
        )}
      </div>

      <Card className="p-6">
        <h2 className={`mb-4 ${ADMIN_SECTION_TITLE}`}>Recent orders</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/${locale}/admin/orders/${order.orderNumber}`}
              className="block rounded-lg border border-[#ead7bf] p-3 transition-colors hover:bg-[#fff4eb]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-[#1f1a17]">
                  {order.orderNumber}
                </strong>
                <span
                  className={`${ADMIN_BADGE} ${orderStatusBadgeClass(order.status)}`}
                >
                  {order.status}
                </span>
                <span
                  className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#5c564e]">
                {order.totalAmount.toLocaleString("en-US")} {order.baseCurrency}
              </p>
              <p className="mt-1 text-xs text-[#8a8378]">
                Placed: {formatUtcDateTime(order.placedAt)}
              </p>
            </Link>
          ))}
          {recentOrders.length === 0 ? (
            <p className="text-sm text-[#5c564e]">No orders.</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
