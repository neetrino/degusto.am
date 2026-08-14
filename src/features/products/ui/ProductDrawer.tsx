"use client";

import { useEffect, useState, useTransition } from "react";
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
  ADMIN_TEXT_MUTED,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
import { AdminContentLocaleToggle } from "@/features/admin/ui/AdminContentLocaleToggle";
import { AdminSheetHeader } from "@/features/admin/ui/AdminSheetHeader";
import type {
  AdminCategoryOption,
  AdminProductListItem,
} from "@/features/products/application/list-admin-products";
import {
  createProductFromDrawerAction,
  updateProductFromDrawerAction,
} from "@/features/products/application/upsert-product";
import { ProductDrawerCategories } from "@/features/products/ui/ProductDrawerCategories";
import { ProductDrawerDietBadges } from "@/features/products/ui/ProductDrawerDietBadges";
import {
  ProductDrawerImages,
  type ProductDraftImage,
} from "@/features/products/ui/ProductDrawerImages";
import {
  ProductDrawerModifiers,
  type ProductModifierDraft,
} from "@/features/products/ui/ProductDrawerModifiers";
import type { TranslationsJson } from "@/db/schema";
import { slugifyProductTitle } from "@/features/products/domain/slugify";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";

type ProductDrawerProduct = Pick<
  AdminProductListItem,
  | "id"
  | "sku"
  | "title"
  | "slug"
  | "description"
  | "translations"
  | "priceAmount"
  | "compareAtAmount"
  | "stockOnHand"
  | "status"
  | "categoryIds"
  | "images"
  | "isSpicy"
  | "isVegetarian"
  | "additions"
  | "exclusions"
>;

type ProductDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  product?: ProductDrawerProduct | null;
  categories: AdminCategoryOption[];
};

type LocaleFields = {
  title: string;
  slug: string;
  description: string;
};

type LocaleDrafts = Record<Locale, LocaleFields>;

function emptyLocaleFields(): LocaleFields {
  return { title: "", slug: "", description: "" };
}

function emptyLocaleDrafts(): LocaleDrafts {
  return {
    hy: emptyLocaleFields(),
    en: emptyLocaleFields(),
    ru: emptyLocaleFields(),
  };
}

function draftsFromTranslations(
  translations: TranslationsJson | null | undefined,
  fallback?: { title: string; slug: string; description: string },
): LocaleDrafts {
  const drafts = emptyLocaleDrafts();
  let anyFilled = false;

  for (const loc of locales) {
    const entry = translations?.[loc];
    if (!entry) continue;
    anyFilled = true;
    drafts[loc] = {
      title: entry.title ?? "",
      slug: entry.slug ?? "",
      description: entry.description ?? "",
    };
  }

  if (!anyFilled && fallback && (fallback.title || fallback.slug)) {
    const seed = {
      title: fallback.title,
      slug: fallback.slug,
      description: fallback.description,
    };
    drafts.hy = seed;
    drafts.en = { ...seed };
    drafts.ru = { ...seed };
  }

  return drafts;
}

function isLocaleFilled(fields: LocaleFields): boolean {
  return fields.title.trim().length > 0;
}

function primaryTitleFromDrafts(drafts: LocaleDrafts): string {
  for (const loc of locales) {
    const title = drafts[loc].title.trim();
    if (title) return title;
  }
  return "";
}

function withSharedSlug(
  drafts: LocaleDrafts,
  sharedSlug: string,
): LocaleDrafts {
  const next = emptyLocaleDrafts();
  for (const loc of locales) {
    const title = drafts[loc].title.trim();
    if (!title) continue;
    next[loc] = {
      title: drafts[loc].title,
      slug: sharedSlug,
      description: drafts[loc].description,
    };
  }
  return next;
}

function imagesFromProduct(
  product: ProductDrawerProduct | null,
): ProductDraftImage[] {
  if (!product) return [];
  return product.images.map((image) => ({
    key: image.id,
    previewUrl: image.url,
    isPrimary: image.isPrimary,
    existingId: image.id,
  }));
}

function modifiersFromProduct(
  product: ProductDrawerProduct | null,
  kind: "additions" | "exclusions",
): ProductModifierDraft[] {
  if (!product) return [];
  return product[kind].map((item) => ({
    key: item.id,
    label: item.label,
    isEnabled: item.isEnabled,
    priceAmount: item.priceAmount,
  }));
}

export function ProductDrawer({
  locale,
  open,
  onClose,
  product = null,
  categories: initialCategories,
}: ProductDrawerProps) {
  const router = useRouter();
  const isEdit = product != null;
  const initialContentLocale: Locale = isLocale(locale) ? locale : "hy";
  const [contentLocale, setContentLocale] =
    useState<Locale>(initialContentLocale);
  const [localeDrafts, setLocaleDrafts] =
    useState<LocaleDrafts>(emptyLocaleDrafts);
  const [images, setImages] = useState<ProductDraftImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [categories, setCategories] =
    useState<AdminCategoryOption[]>(initialCategories);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [priceAmount, setPriceAmount] = useState("");
  const [compareAtAmount, setCompareAtAmount] = useState("");
  const [sku, setSku] = useState("");
  const [stockOnHand, setStockOnHand] = useState("");
  const [isSpicy, setIsSpicy] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [additions, setAdditions] = useState<ProductModifierDraft[]>([]);
  const [exclusions, setExclusions] = useState<ProductModifierDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeFields = localeDrafts[contentLocale];
  const filledLocales = locales.filter((loc) =>
    isLocaleFilled(localeDrafts[loc]),
  );

  function patchActiveFields(patch: Partial<LocaleFields>): void {
    setLocaleDrafts((prev) => ({
      ...prev,
      [contentLocale]: { ...prev[contentLocale], ...patch },
    }));
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCategories(initialCategories);
      setContentLocale(isLocale(locale) ? locale : "hy");
      if (product) {
        setLocaleDrafts(
          draftsFromTranslations(product.translations, {
            title: product.title,
            slug: product.slug,
            description: product.description,
          }),
        );
        setImages(imagesFromProduct(product));
        setRemovedImageIds([]);
        setCategoryIds(product.categoryIds);
        setPriceAmount(String(product.priceAmount));
        setCompareAtAmount(
          product.compareAtAmount != null ? String(product.compareAtAmount) : "",
        );
        setSku(product.sku);
        setStockOnHand(String(product.stockOnHand));
        setIsSpicy(product.isSpicy);
        setIsVegetarian(product.isVegetarian);
        setAdditions(modifiersFromProduct(product, "additions"));
        setExclusions(modifiersFromProduct(product, "exclusions"));
        setError(null);
        return;
      }
      setLocaleDrafts(emptyLocaleDrafts());
      setImages([]);
      setRemovedImageIds([]);
      setCategoryIds([]);
      setPriceAmount("");
      setCompareAtAmount("");
      setSku("");
      setStockOnHand("");
      setIsSpicy(false);
      setIsVegetarian(false);
      setAdditions([]);
      setExclusions([]);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, product, initialCategories, locale]);

  function handleImagesChange(next: ProductDraftImage[]): void {
    const nextKeys = new Set(next.map((image) => image.key));
    const removedExisting = images
      .filter(
        (image) =>
          image.existingId &&
          !nextKeys.has(image.key) &&
          !removedImageIds.includes(image.existingId),
      )
      .map((image) => image.existingId as string);
    if (removedExisting.length > 0) {
      setRemovedImageIds((prev) => [...prev, ...removedExisting]);
    }
    setImages(next);
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Edit product" : "Add new product"}
      panelClassName="w-[min(100%,48rem)] sm:w-[min(72%,56rem)]"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
        <AdminSheetHeader
          title={isEdit ? "Edit product" : "Add new product"}
        />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (filledLocales.length === 0) {
              setError(
                "Fill title for at least one language (HY / EN / RU).",
              );
              return;
            }
            const newImages = images.filter((image) => image.file);
            const primaryImage = images.find((image) => image.isPrimary);
            const primaryNewIndex = primaryImage?.file
              ? newImages.findIndex((image) => image.key === primaryImage.key)
              : null;

            const sharedSlug =
              (isEdit && product?.slug.trim()) ||
              slugifyProductTitle(primaryTitleFromDrafts(localeDrafts));
            const translations = withSharedSlug(localeDrafts, sharedSlug);

            const payload = {
              sku: sku.trim(),
              translations: {
                hy: translations.hy,
                en: translations.en,
                ru: translations.ru,
              },
              priceAmount: Number(priceAmount),
              compareAtAmount: compareAtAmount.trim()
                ? Number(compareAtAmount)
                : null,
              stockOnHand: Number(stockOnHand),
              categoryIds,
              status: (product?.status === "ACTIVE" ||
              product?.status === "ARCHIVED"
                ? product.status
                : "DRAFT") as "DRAFT" | "ACTIVE" | "ARCHIVED",
              isSpicy,
              isVegetarian,
              additions: additions.map((item) => ({
                label: item.label,
                isEnabled: item.isEnabled,
                priceAmount: item.priceAmount,
              })),
              exclusions: exclusions.map((item) => ({
                label: item.label,
                isEnabled: item.isEnabled,
                priceAmount: 0,
              })),
              primaryExistingId: primaryImage?.existingId ?? null,
              primaryNewIndex:
                primaryNewIndex != null && primaryNewIndex >= 0
                  ? primaryNewIndex
                  : null,
              removeImageIds: removedImageIds,
            };

            const formData = new FormData();
            formData.set("data", JSON.stringify(payload));
            for (const image of newImages) {
              if (image.file) formData.append("images", image.file);
            }

            startTransition(async () => {
              setError(null);
              try {
                const result =
                  isEdit && product
                    ? await updateProductFromDrawerAction(
                        locale,
                        product.id,
                        formData,
                      )
                    : await createProductFromDrawerAction(locale, formData);

                if (!result.ok) {
                  setError(result.error.message);
                  return;
                }

                onClose();
                router.refresh();
              } catch {
                setError(
                  "Unable to save product. Try a different SKU or title.",
                );
              }
            });
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={ADMIN_LABEL}>Content language</p>
                <p className={`-mt-0.5 text-xs ${ADMIN_TEXT_MUTED}`}>
                  Switch HY / EN / RU — title and description update per
                  language. Slug is generated automatically.
                </p>
              </div>
              <AdminContentLocaleToggle
                value={contentLocale}
                onChange={setContentLocale}
                filledLocales={filledLocales}
                disabled={isPending}
              />
            </div>

            <div>
              <label>
                <span className={ADMIN_LABEL}>
                  Title ({contentLocale.toUpperCase()}){" "}
                  <span className="text-red-600">*</span>
                </span>
                <input
                  value={activeFields.title}
                  onChange={(event) =>
                    patchActiveFields({ title: event.target.value })
                  }
                  placeholder="Product title"
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            <label className="block">
              <span className={ADMIN_LABEL}>
                Description ({contentLocale.toUpperCase()})
              </span>
              <textarea
                value={activeFields.description}
                onChange={(event) =>
                  patchActiveFields({ description: event.target.value })
                }
                placeholder="Product description"
                className={ADMIN_TEXTAREA}
                disabled={isPending}
              />
            </label>

            <ProductDrawerImages
              images={images}
              disabled={isPending}
              onChange={handleImagesChange}
            />

            <ProductDrawerCategories
              locale={locale}
              categories={categories}
              selectedIds={categoryIds}
              disabled={isPending}
              onCategoriesChange={setCategories}
              onSelectedChange={setCategoryIds}
            />

            <ProductDrawerDietBadges
              isSpicy={isSpicy}
              isVegetarian={isVegetarian}
              disabled={isPending}
              onSpicyChange={setIsSpicy}
              onVegetarianChange={setIsVegetarian}
            />

            <ProductDrawerModifiers
              additions={additions}
              exclusions={exclusions}
              disabled={isPending}
              onAdditionsChange={setAdditions}
              onExclusionsChange={setExclusions}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ADMIN_LABEL}>
                  Price <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  min={0}
                  type="number"
                  value={priceAmount}
                  onChange={(event) => setPriceAmount(event.target.value)}
                  placeholder="AMD price"
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label>
                <span className={ADMIN_LABEL}>Compare at price</span>
                <input
                  min={0}
                  type="number"
                  value={compareAtAmount}
                  onChange={(event) => setCompareAtAmount(event.target.value)}
                  placeholder="Optional"
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ADMIN_LABEL}>
                  SKU <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  placeholder="SKU"
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label>
                <span className={ADMIN_LABEL}>
                  Quantity <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  min={0}
                  type="number"
                  value={stockOnHand}
                  onChange={(event) => setStockOnHand(event.target.value)}
                  placeholder="Stock"
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <div className={ADMIN_SHEET_FOOTER}>
            <Button
              type="submit"
              disabled={isPending}
              className={ADMIN_SHEET_PRIMARY_BUTTON}
            >
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save"
                  : "Create"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className={ADMIN_SHEET_CANCEL}
            >
              Cancel
            </button>
          </div>
        </form>
    </SideSheet>
  );
}
