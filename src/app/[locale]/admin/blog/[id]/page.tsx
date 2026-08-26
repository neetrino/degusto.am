import { notFound, redirect } from "next/navigation";

import { SHOW_ADMIN_BLOG_UI } from "@/features/blog/admin-blog-ui";
import { isLocale } from "@/lib/i18n/config";

type AdminBlogDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

/** Edit UI moved to the blog list drawer. */
export default async function AdminBlogDetailPage({
  params,
}: AdminBlogDetailPageProps) {
  if (!SHOW_ADMIN_BLOG_UI) {
    notFound();
  }

  const { locale } = await params;
  if (!isLocale(locale)) {
    redirect("/hy/admin/blog");
  }
  redirect(`/${locale}/admin/blog`);
}
