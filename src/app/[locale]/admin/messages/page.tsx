import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_SELECT,
  ADMIN_LINK,
} from "@/features/admin/ui/admin-form-classes";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { listAdminContactMessages } from "@/features/contact/application/queries";
import { CONTACT_STATUSES } from "@/features/contact/domain/contact-rules";
import { adminContactFilterSchema } from "@/features/contact/schemas/contact";
import { isLocale } from "@/lib/i18n/config";

type AdminMessagesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function contactStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "UNREAD") return "bg-[#ff7f20]/15 text-[#c45a0a]";
  if (normalized === "READ") return "bg-[#f7d18f]/45 text-[#8a5a12]";
  if (normalized === "REPLIED") return "bg-[#3e573d]/15 text-[#3e573d]";
  if (normalized === "ARCHIVED") return "bg-[#e8e2d9] text-[#5c564e]";
  return "bg-[#e8e2d9] text-[#5c564e]";
}

export default async function AdminMessagesPage({
  params,
  searchParams,
}: AdminMessagesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const parsed = adminContactFilterSchema.safeParse({
    status: firstParam(raw.status) || undefined,
    q: firstParam(raw.q) || undefined,
    page: firstParam(raw.page) ?? "1",
  });

  const filters = parsed.success
    ? parsed.data
    : { page: 1 as const, status: undefined, q: undefined };

  const { rows, total, pageSize } = await listAdminContactMessages(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section>
      <div className="mb-6">
        <h1 className={ADMIN_PAGE_TITLE}>Messages</h1>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
          {total} message{total === 1 ? "" : "s"}
          {filters.status ? ` · ${filters.status}` : ""}
        </p>
      </div>

      <Card className="mb-6 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-[180px] flex-1">
            <span className={ADMIN_LABEL}>Search</span>
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Name, email, subject…"
              className={ADMIN_INPUT}
            />
          </label>
          <label className="min-w-[140px]">
            <span className={ADMIN_LABEL}>Status</span>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className={ADMIN_SELECT}
            >
              <option value="">All</option>
              {CONTACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      <Card className={ADMIN_TABLE_CARD}>
        {rows.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-[#5c564e]`}>
            No messages match these filters.
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Subject</th>
                  <th className={ADMIN_TABLE_TH}>From</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>Status</th>
                  <th className={ADMIN_TABLE_TH}>Received</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {rows.map((message) => (
                  <tr key={message.id} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>
                      <Link
                        href={`/${locale}/admin/messages/${message.id}`}
                        className={ADMIN_LINK}
                      >
                        {message.subject}
                      </Link>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <p className="text-sm text-[#1f1a17]">{message.name}</p>
                      <p className="text-xs text-[#8a837a]">{message.email}</p>
                    </td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      <span
                        className={`${ADMIN_BADGE} ${contactStatusBadgeClass(message.status)}`}
                      >
                        {message.status}
                      </span>
                      {message.spamScore !== null ? (
                        <p className="mt-1 text-xs text-[#8a837a]">
                          spam {message.spamScore}
                        </p>
                      ) : null}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="text-xs text-[#8a837a]">
                        {message.createdAt
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}{" "}
                        UTC
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center gap-3 text-sm text-[#5c564e]">
          <span>
            Page {filters.page} / {totalPages}
          </span>
        </nav>
      ) : null}
    </section>
  );
}
