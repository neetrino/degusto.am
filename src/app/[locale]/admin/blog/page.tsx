import { notFound } from "next/navigation";

import { SHOW_ADMIN_BLOG_UI } from "@/features/blog/admin-blog-ui";
import { listAdminBlogPosts } from "@/features/blog/application/queries";
import { AdminBlogView } from "@/features/blog/ui/AdminBlogView";
import { isLocale } from "@/lib/i18n/config";

type AdminBlogPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminBlogPage({ params }: AdminBlogPageProps) {
  if (!SHOW_ADMIN_BLOG_UI) {
    notFound();
  }

  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const posts = await listAdminBlogPosts(locale);

  return <AdminBlogView locale={locale} posts={posts} />;
}
