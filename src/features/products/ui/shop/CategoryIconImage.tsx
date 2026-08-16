import Image from "next/image";

import type { CategoryIconAsset } from "@/features/products/ui/shop/resolve-category-icon";

type CategoryIconImageProps = {
  icon: CategoryIconAsset;
  imageClassName?: string;
};

/** Figma category glyph — outer box vs leaf size, optional rotate. */
export function CategoryIconImage({
  icon,
  imageClassName,
}: CategoryIconImageProps) {
  const leaf = (
    <Image
      src={icon.src}
      alt=""
      width={Math.round(icon.leafWidth)}
      height={Math.round(icon.leafHeight)}
      unoptimized
      className={`block max-w-none ${imageClassName ?? ""}`}
      aria-hidden
    />
  );

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: icon.boxWidth, height: icon.boxHeight }}
    >
      {icon.rotateDeg != null ? (
        <span style={{ transform: `rotate(${icon.rotateDeg}deg)` }}>{leaf}</span>
      ) : (
        leaf
      )}
    </span>
  );
}
