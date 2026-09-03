"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { SideSheet } from "@/components/ui/SideSheet";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SHEET_CHIP_ACTIVE,
  ADMIN_SHEET_CHIP_IDLE,
  ADMIN_SHEET_FOOTER,
  ADMIN_SHEET_PRIMARY_BUTTON,
  ADMIN_SHEET_SURFACE,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
import { AdminSheetHeader } from "@/features/admin/ui/AdminSheetHeader";
import { getAdminCopy } from "@/features/admin/ui/admin-copy";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/features/blog/application/manage-blog";
import type { AdminBlogListItem } from "@/features/blog/application/queries";
import {
  normalizeBlogSlug,
  type BlogPostStatus,
  type BlogTranslations,
} from "@/features/blog/domain/blog-rules";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";

type LocaleDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  slugTouched: boolean;
};

type BlogPostDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  post?: AdminBlogListItem | null;
};

function emptyDraft(): LocaleDraft {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    slugTouched: false,
  };
}

function draftsFromTranslations(
  translations: BlogTranslations | undefined,
): Record<Locale, LocaleDraft> {
  const next = {
    hy: emptyDraft(),
    en: emptyDraft(),
    ru: emptyDraft(),
  } satisfies Record<Locale, LocaleDraft>;

  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      slug: copy.slug,
      excerpt: copy.excerpt ?? "",
      content: copy.content,
      slugTouched: true,
    };
  }

  return next;
}

function resolvedSlug(draft: LocaleDraft): string {
  if (draft.slugTouched && draft.slug.trim()) {
    return normalizeBlogSlug(draft.slug);
  }
  const fromTitle = normalizeBlogSlug(draft.title);
  return fromTitle || `post-${Date.now().toString(36)}`;
}

export function BlogPostDrawer({
  locale,
  open,
  onClose,
  post = null,
}: BlogPostDrawerProps) {
  const router = useRouter();
  const copy = getAdminCopy(locale);
  const commonCopy = copy.common;
  const drawerCopy = copy.drawers.blog;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = post != null;
  const [activeLocale, setActiveLocale] = useState<Locale>(() => {
    if (!post) return "en";
    return (
      (locales.find((loc) => post.translations[loc]?.title) as
        | Locale
        | undefined) ?? "en"
    );
  });
  const [drafts, setDrafts] = useState<Record<Locale, LocaleDraft>>(() =>
    draftsFromTranslations(post?.translations),
  );
  const [status, setStatus] = useState<BlogPostStatus>(
    () => post?.status ?? "DRAFT",
  );
  const [publishedAt, setPublishedAt] = useState(
    () => post?.publishedAt ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    () => post?.coverUrl ?? null,
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (post) {
        setActiveLocale(
          (locales.find((loc) => post.translations[loc]?.title) as
            | Locale
            | undefined) ?? "en",
        );
        setDrafts(draftsFromTranslations(post.translations));
        setStatus(post.status);
        setPublishedAt(post.publishedAt ?? "");
        setImageFile(null);
        setImagePreview(post.coverUrl ?? null);
        setRemoveExistingImage(false);
        setError(null);
        return;
      }
      setActiveLocale("en");
      setDrafts({ hy: emptyDraft(), en: emptyDraft(), ru: emptyDraft() });
      setStatus("DRAFT");
      setPublishedAt("");
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, post]);

  const draft = drafts[activeLocale];

  function updateDraft(patch: Partial<LocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? drawerCopy.editTitle : drawerCopy.addTitle}
      panelClassName="w-full max-w-lg"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
        <AdminSheetHeader
          title={isEdit ? drawerCopy.editTitle : drawerCopy.addTitle}
        />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const current = drafts[activeLocale];
            const slug = resolvedSlug(current);
            if (!current.title.trim() || !current.content.trim()) {
              setError(drawerCopy.requiredError);
              return;
            }

            startTransition(async () => {
              setError(null);
              const payload = {
                editingLocale: activeLocale,
                title: current.title,
                slug,
                excerpt: current.excerpt || undefined,
                content: current.content,
                status,
                publishedAt: publishedAt || null,
                tags: post?.tags.join(", ") ?? "",
              };
              const mediaForm = new FormData();
              if (imageFile) {
                mediaForm.set("image", imageFile);
              }
              if (removeExistingImage) {
                mediaForm.set("removeImage", "1");
              }

              const result =
                isEdit && post
                  ? await updateBlogPostAction(
                      locale,
                      post.id,
                      payload,
                      mediaForm,
                    )
                  : await createBlogPostAction(locale, payload, mediaForm);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            });
          }}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-[#8a837a] uppercase">
                {drawerCopy.translations}
              </p>
              <div className="flex flex-wrap gap-2">
                {locales.map((loc) => {
                  const selected = loc === activeLocale;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setActiveLocale(loc)}
                      className={`transition-colors ${
                        selected
                          ? ADMIN_SHEET_CHIP_ACTIVE
                          : ADMIN_SHEET_CHIP_IDLE
                      }`}
                    >
                      {localeLabels[loc]}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className={ADMIN_LABEL}>
                {drawerCopy.title} <span className="text-red-600">*</span>
              </span>
              <input
                required
                value={draft.title}
                onChange={(event) =>
                  updateDraft({ title: event.target.value })
                }
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>{drawerCopy.shortExcerpt}</span>
              <input
                value={draft.excerpt}
                onChange={(event) =>
                  updateDraft({ excerpt: event.target.value })
                }
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>
                {drawerCopy.fullText} <span className="text-red-600">*</span>
              </span>
              <textarea
                required
                rows={8}
                value={draft.content}
                onChange={(event) =>
                  updateDraft({ content: event.target.value })
                }
                className={ADMIN_TEXTAREA}
                disabled={isPending}
              />
              <span className="mt-1 block text-xs text-[#8a837a]">
                {drawerCopy.fullTextHint}
              </span>
            </label>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-[#8a837a] uppercase">
                {drawerCopy.common}
              </p>
              <div className="space-y-4">
                <label className="block">
                  <span className={ADMIN_LABEL}>{drawerCopy.publicationDate}</span>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                    className={ADMIN_INPUT}
                    disabled={isPending}
                  />
                  <span className="mt-1 block text-xs text-[#8a837a]">
                    {drawerCopy.publicationDateHint}
                  </span>
                </label>
                <div>
                  <span className={ADMIN_LABEL}>{drawerCopy.status}</span>
                  <SelectDropdown
                    ariaLabel={drawerCopy.status}
                    value={status}
                    options={[
                      { label: drawerCopy.draft, value: "DRAFT" },
                      { label: drawerCopy.published, value: "PUBLISHED" },
                      { label: drawerCopy.archived, value: "ARCHIVED" },
                    ]}
                    disabled={isPending}
                    deferChange={false}
                    className="mt-1"
                    onValueChange={(next) =>
                      setStatus(next as BlogPostStatus)
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <span className={ADMIN_LABEL}>{drawerCopy.coverImage}</span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center rounded-xl border border-dashed border-[#ead7bf] px-4 py-2 text-sm font-medium text-[#5c564e] hover:border-[#ff7f20]/50 hover:bg-[#fff4eb] disabled:opacity-50"
                >
                  {imagePreview ? drawerCopy.changeImage : drawerCopy.uploadImage}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    setImagePreview((current) => {
                      if (current?.startsWith("blob:")) {
                        URL.revokeObjectURL(current);
                      }
                      return file ? URL.createObjectURL(file) : null;
                    });
                    setImageFile(file);
                    setRemoveExistingImage(false);
                  }}
                />
                {imagePreview ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview((current) => {
                        if (current?.startsWith("blob:")) {
                          URL.revokeObjectURL(current);
                        }
                        return null;
                      });
                      if (isEdit && post?.coverUrl) {
                        setRemoveExistingImage(true);
                      }
                    }}
                    className="text-sm font-medium text-[#5c564e] hover:text-red-600"
                  >
                    {drawerCopy.remove}
                  </button>
                ) : null}
              </div>
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob/admin preview
                <img
                  src={imagePreview}
                  alt=""
                  className="mt-3 h-28 w-28 rounded-xl border border-[#ead7bf] object-cover"
                />
              ) : null}
              <p className="mt-1 text-xs text-[#8a837a]">
                {drawerCopy.imageFormatsHint}
              </p>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <div className={ADMIN_SHEET_FOOTER}>
            <Button
              type="submit"
              className={`w-full ${ADMIN_SHEET_PRIMARY_BUTTON}`}
              disabled={isPending}
            >
              {isPending ? commonCopy.saving : commonCopy.save}
            </Button>
          </div>
        </form>
    </SideSheet>
  );
}
