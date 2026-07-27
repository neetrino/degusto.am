import Image from "next/image";

const FOOTER_DISH = "/assets/footer/dish.webp";

/**
 * Desktop dish layer — matches live degusto-am portrait + CSS rotate.
 * Figma node 1:1052 / live: -right-[10px] top-[-115px] xl:h-[800px] xl:w-[512px]
 */
export function FooterDishBackdrop() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- CSS rotate on portrait asset; next/image fights transform sizing
    <img
      src={FOOTER_DISH}
      alt=""
      width={512}
      height={800}
      className="pointer-events-none absolute -right-[10px] top-[-115px] z-0 hidden h-[min(800px,90vh)] w-[min(512px,42vw)] max-w-none -rotate-90 -scale-x-100 object-contain [aspect-ratio:90/173] lg:block xl:h-[800px] xl:w-[512px]"
      aria-hidden
    />
  );
}

/** Mobile dish fallback for the footer. */
export function FooterDishVisual() {
  return (
    <div className="relative mx-auto mb-4 h-[200px] w-full max-w-[360px] lg:hidden">
      <Image
        src={FOOTER_DISH}
        alt=""
        width={360}
        height={200}
        className="mx-auto h-[200px] w-auto max-w-full object-contain"
      />
    </div>
  );
}
