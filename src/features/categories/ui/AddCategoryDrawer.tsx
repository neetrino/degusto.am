"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { SideSheet } from "@/components/ui/SideSheet";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SHEET_CANCEL,
  ADMIN_SHEET_FOOTER,
  ADMIN_SHEET_PRIMARY_BUTTON,
  ADMIN_SHEET_SURFACE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminSheetHeader } from "@/features/admin/ui/AdminSheetHeader";
import {
  createCategoryFromDrawerAction,
  updateCategoryFromDrawerAction,
} from "@/features/categories/actions";
import { slugifyCategoryTitle } from "@/features/categories/domain/slugify";
import type { AdminCategoryListItem } from "@/features/categories/application/list-admin-categories";
import { validateImageFile } from "@/lib/media/image-file";

type AddCategoryDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  categories: AdminCategoryListItem[];
  category?: AdminCategoryListItem | null;
};

export function AddCategoryDrawer({
  locale,
  open,
  onClose,
  categories,
  category = null,
}: AddCategoryDrawerProps) {
  const router = useRouter();
  const isEdit = category != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (category) {
        setTitle(category.title);
        setSlug(category.slug);
        setSlugTouched(true);
        setParentId(category.parentId ?? "");
        setStatus(category.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE");
        setImageFile(null);
        setImagePreview(category.imageUrl);
        setRemoveExistingImage(false);
        setError(null);
        return;
      }
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      setParentId("");
      setStatus("ACTIVE");
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, category]);

  const displaySlug = slugTouched ? slug : slugifyCategoryTitle(title) || "---";
  const parentOptions = categories.filter((item) => item.id !== category?.id);

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Edit Category" : "Add Category"}
      panelClassName="w-full max-w-lg"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
      <AdminSheetHeader title={isEdit ? "Edit Category" : "Add Category"} />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (imageFile) {
              const imageError = validateImageFile(imageFile);
              if (imageError) {
                setError(imageError);
                return;
              }
            }

            const nextSlug =
              slugTouched && slug.trim()
                ? slug.trim()
                : slugifyCategoryTitle(title);

            const formData = new FormData();
            formData.set("title", title.trim());
            formData.set("slug", nextSlug);
            formData.set("parentId", parentId);
            formData.set("status", status);
            if (imageFile) {
              formData.set("image", imageFile);
            }
            if (removeExistingImage) {
              formData.set("removeImage", "1");
            }

            startTransition(async () => {
              setError(null);
              try {
                const result =
                  isEdit && category
                    ? await updateCategoryFromDrawerAction(
                        locale,
                        category.id,
                        formData,
                      )
                    : await createCategoryFromDrawerAction(locale, formData);

                if (!result.ok) {
                  setError(result.error.message);
                  return;
                }

                onClose();
                router.refresh();
              } catch {
                setError("Upload failed. Try a smaller image and try again.");
              }
            });
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <label className="block">
              <span className={ADMIN_LABEL}>
                Category Title <span className="text-red-600">*</span>
              </span>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter category title"
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>Slug</span>
              <input
                value={displaySlug === "---" ? "" : displaySlug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                placeholder="---"
                className={ADMIN_INPUT}
                disabled={isPending}
              />
              <span className="mt-1 block text-xs text-[#8a837a]">
                Generated automatically from the title and used on /products.
              </span>
            </label>

            <div>
              <span className={ADMIN_LABEL}>Parent Category</span>
              <SelectDropdown
                ariaLabel="Parent Category"
                value={parentId}
                allLabel="None (Root Category)"
                options={parentOptions.map((item) => ({
                  label: item.title,
                  value: item.id,
                }))}
                disabled={isPending}
                deferChange={false}
                className="mt-1"
                onValueChange={setParentId}
              />
            </div>

            <div>
              <span className={ADMIN_LABEL}>Status</span>
              <SelectDropdown
                ariaLabel="Status"
                value={status}
                options={[
                  { label: "Published", value: "ACTIVE" },
                  { label: "Archived", value: "ARCHIVED" },
                ]}
                disabled={isPending}
                deferChange={false}
                className="mt-1"
                onValueChange={(next) =>
                  setStatus(next as "ACTIVE" | "ARCHIVED")
                }
              />
            </div>

            <div>
              <span className={ADMIN_LABEL}>Image</span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center rounded-xl border border-dashed border-[#ead7bf] px-4 py-2 text-sm font-medium text-[#5c564e] hover:border-[#ff7f20]/50 hover:bg-[#fff4eb] disabled:opacity-50"
                >
                  {imagePreview ? "Change Image" : "+ Upload Image"}
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
                      if (isEdit && category?.imageUrl) {
                        setRemoveExistingImage(true);
                      }
                    }}
                    className="text-sm font-medium text-[#5c564e] hover:text-red-600"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {imagePreview ? (
                // Admin previews can be blob URLs or dynamic storage hosts.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt=""
                  className="mt-3 h-28 w-28 rounded-xl border border-[#ead7bf] object-cover"
                />
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <div className={ADMIN_SHEET_FOOTER}>
            <Button
              type="submit"
              disabled={isPending || !title.trim()}
              className={ADMIN_SHEET_PRIMARY_BUTTON}
            >
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save"
                  : "Create Category"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className={`whitespace-nowrap ${ADMIN_SHEET_CANCEL}`}
            >
              Cancel
            </button>
          </div>
        </form>
    </SideSheet>
  );
}
