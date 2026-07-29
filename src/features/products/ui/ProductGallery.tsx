"use client";

import Image from "next/image";
import { Expand, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import {
  PRODUCT_EASE,
  productThumbItem,
  productThumbStagger,
} from "@/features/products/ui/ProductDetailMotion";
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

function isSignedMediaUrl(url: string): boolean {
  return url.includes("X-Amz-Signature") || url.includes("X-Amz-Credential");
}

function subscribeNowhere(): () => void {
  return () => undefined;
}

/** True after client hydration — safe to portal lightbox to document.body. */
function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNowhere, () => true, () => false);
}

/** PDP main gallery — Motion entrance, parallax, thumbnail stagger. */
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
  const portalReady = useIsClient();
  const selected =
    images.find((image) => image.id === selectedId) ?? images[0] ?? null;

  const frameRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 28,
    mass: 0.4,
  });
  const imageY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["8%", "-8%"],
  );
  const imageScale = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [1, 1, 1] : [1.08, 1, 1.06],
  );

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
        <motion.div
          ref={frameRef}
          className="group/main relative aspect-[3/2] w-full min-h-[14rem] overflow-hidden rounded-[2.125rem] bg-neutral-50 lg:aspect-[42/25]"
        >
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, scale: 1.06, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, scale: 0.98, filter: "blur(6px)" }
                }
                transition={{ duration: 0.55, ease: PRODUCT_EASE }}
                className="absolute inset-0 h-full w-full"
              >
                <motion.div
                  style={{ y: imageY, scale: imageScale }}
                  className="absolute inset-0 h-full w-full will-change-transform"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    aria-label={expandLabel}
                    className="absolute inset-0 z-[1] cursor-zoom-in"
                  >
                    <span className="sr-only">{expandLabel}</span>
                  </button>
                  <Image
                    src={selected.url}
                    alt={selected.alt || title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                    unoptimized={isSignedMediaUrl(selected.url)}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                No image
              </div>
            )}
          </AnimatePresence>

          {discountPercent != null ? (
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 14,
                delay: 0.45,
              }}
              className="absolute top-4 right-4 z-10 flex size-12 items-center justify-center rounded-full bg-[#ff7f20] text-sm font-semibold text-black shadow-md"
            >
              -{discountPercent}%
            </motion.span>
          ) : null}

          {!inStock ? (
            <span className="absolute top-4 left-4 z-10 rounded-full bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white">
              {outOfStockLabel}
            </span>
          ) : null}

          {selected ? (
            <motion.button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={expandLabel}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: PRODUCT_EASE, delay: 0.55 }}
              whileHover={reduceMotion ? undefined : { scale: 1.08 }}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              className="absolute bottom-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md"
            >
              <Expand className="size-4" aria-hidden />
            </motion.button>
          ) : null}
        </motion.div>

        {images.length > 1 ? (
          <motion.ul
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={reduceMotion ? undefined : productThumbStagger}
            className="flex flex-wrap gap-2"
            role="list"
          >
            {images.map((image) => {
              const isActive = image.id === selected?.id;
              return (
                <motion.li
                  key={image.id}
                  variants={reduceMotion ? undefined : productThumbItem}
                >
                  <motion.button
                    type="button"
                    onClick={() => setSelectedId(image.id)}
                    aria-label={image.alt || title}
                    aria-pressed={isActive}
                    whileHover={reduceMotion ? undefined : { y: -3, scale: 1.04 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
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
                      unoptimized={isSignedMediaUrl(image.url)}
                    />
                  </motion.button>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : null}
      </div>

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {expanded && selected ? (
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={title}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/80 p-4 sm:p-8"
                  onClick={() => setExpanded(false)}
                >
                  <button
                    type="button"
                    aria-label={closeLabel}
                    className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-md"
                    onClick={() => setExpanded(false)}
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                  <motion.div
                    initial={
                      reduceMotion ? false : { opacity: 0, scale: 0.92, y: 24 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.4, ease: PRODUCT_EASE }}
                    className="relative mx-auto h-[min(85vh,820px)] w-[min(100%,56rem)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Image
                      src={selected.url}
                      alt={selected.alt || title}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      unoptimized={isSignedMediaUrl(selected.url)}
                      priority
                    />
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
