"use client";

import Image from "next/image";
import { Expand, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { ProductGalleryImage } from "@/features/products/types";

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  title: string;
  discountPercent?: number | null;
  inStock: boolean;
  outOfStockLabel: string;
  expandLabel: string;
  closeLabel: string;
};

/** PDP main gallery — Degusto reference aspect, discount badge, expand. */
export function ProductGallery({
  images,
  title,
  discountPercent = null,
  inStock,
  outOfStockLabel,
  expandLabel,
  closeLabel,
}: ProductGalleryProps) {
  const [selectedId, setSelectedId] = useState(images[0]?.id ?? null);
  const [expanded, setExpanded] = useState(false);
  const selected =
    images.find((image) => image.id === selectedId) ?? images[0] ?? null;

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="group/main relative aspect-[3/2] w-full overflow-hidden rounded-[2.125rem] bg-neutral-50 lg:aspect-[42/25]">
          {selected ? (
            <Image
              src={selected.url}
              alt={selected.alt || title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover/main:scale-105"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}

          {discountPercent != null ? (
            <span className="absolute top-4 right-4 z-10 flex size-12 items-center justify-center rounded-full bg-[#ff7f20] text-sm font-semibold text-white shadow-md">
              -{discountPercent}%
            </span>
          ) : null}

          {!inStock ? (
            <span className="absolute top-4 left-4 z-10 rounded-full bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white">
              {outOfStockLabel}
            </span>
          ) : null}

          {selected ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={expandLabel}
              className="absolute bottom-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition hover:scale-105"
            >
              <Expand className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        {images.length > 1 ? (
          <ul className="flex flex-wrap gap-2" role="list">
            {images.map((image) => {
              const isActive = image.id === selected?.id;
              return (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(image.id)}
                    aria-label={image.alt || title}
                    aria-pressed={isActive}
                    className={`relative h-16 w-16 overflow-hidden rounded-[14px] border bg-neutral-50 transition ${
                      isActive
                        ? "border-[#ff7f20] ring-2 ring-[#ff7f20]/25"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {expanded && selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            aria-label={closeLabel}
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white text-gray-800"
            onClick={() => setExpanded(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
          <div
            className="relative h-[min(80vh,720px)] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selected.url}
              alt={selected.alt || title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
