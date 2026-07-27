import Image from "next/image";

import {
  ABOUT_HERO_IMAGE,
} from "@/features/about/content/about-assets";
import { AboutLeafDivider } from "@/features/about/ui/AboutLeafDivider";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutHeroProps = {
  copy: Dictionary["about"];
};

/** Intro section — image left, story copy right (Degusto about reference). */
export function AboutHero({ copy }: AboutHeroProps) {
  return (
    <section className="relative z-20 py-12 pb-16 md:py-16 md:pb-20">
      <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8 lg:gap-14">
          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[32px] shadow-[0_24px_45px_-28px_rgba(18,63,42,0.55)] ring-1 ring-[rgba(201,164,92,0.35)] transition-shadow duration-300 hover:shadow-[0_30px_52px_-28px_rgba(18,63,42,0.65)] md:aspect-[5/4] lg:aspect-auto lg:h-[min(36rem,74vh)] lg:min-h-[24rem]">
              <Image
                src={ABOUT_HERO_IMAGE}
                alt={copy.heroImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="space-y-6 md:pl-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-[#B94A24] uppercase md:text-sm">
              {copy.eyebrow}
            </p>
            <div className="inline-flex w-fit flex-col">
              <h1 className="text-[2.15rem] leading-[1.08] font-semibold text-[#163F2E] md:text-5xl">
                {copy.title}
              </h1>
              <AboutLeafDivider />
            </div>
            <div className="max-w-xl space-y-4 text-base leading-8 text-[#5F6B66] md:text-lg md:leading-8">
              {copy.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
