"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
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
  createHeroSlideAction,
  updateHeroSlideAction,
} from "@/features/hero/application/manage-hero";
import type { AdminHeroSlideListItem } from "@/features/hero/application/queries";

type HeroSlideModalProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  slide?: AdminHeroSlideListItem | null;
};

export function HeroSlideModal({
  locale,
  open,
  onClose,
  slide = null,
}: HeroSlideModalProps) {
  const isEdit = slide != null;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Edit hero slide" : "Create hero slide"}
      panelClassName="w-full max-w-lg"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
      <HeroSlideDrawerForm
        key={slide?.id ?? "create"}
        locale={locale}
        onClose={onClose}
        slide={slide}
      />
    </SideSheet>
  );
}

type HeroSlideDrawerFormProps = {
  locale: string;
  onClose: () => void;
  slide: AdminHeroSlideListItem | null;
};

function HeroSlideDrawerForm({
  locale,
  onClose,
  slide,
}: HeroSlideDrawerFormProps) {
  const router = useRouter();
  const isEdit = slide != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(
    slide && slide.title !== "Untitled" ? slide.title : "",
  );
  const [subtitle, setSubtitle] = useState(slide?.subtitle ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    slide?.imageUrl ?? null,
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
        <AdminSheetHeader
          title={isEdit ? "Edit hero slide" : "Create hero slide"}
        />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData();
            formData.set("title", title.trim());
            formData.set("subtitle", subtitle.trim());
            if (imageFile) {
              formData.set("image", imageFile);
            }
            if (removeExistingImage) {
              formData.set("removeImage", "1");
            }

            startTransition(async () => {
              setError(null);
              const result =
                isEdit && slide
                  ? await updateHeroSlideAction(locale, slide.id, formData)
                  : await createHeroSlideAction(locale, formData);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            });
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <label className="block">
              <span className={ADMIN_LABEL}>Title</span>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>Subtitle</span>
              <input
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <div>
              <span className={ADMIN_LABEL}>Upload image</span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center rounded-xl border border-dashed border-[#ead7bf] px-4 py-2 text-sm font-medium text-[#5c564e] hover:border-[#ff7f20]/50 hover:bg-[#fff4eb] disabled:opacity-50"
                >
                  {imagePreview ? "Change image" : "+ Upload image"}
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
                      if (isEdit && slide?.imageUrl) {
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
                // eslint-disable-next-line @next/next/no-img-element -- local blob/admin preview
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
                  ? "Edit"
                  : "Create"}
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
    </>
  );
}
