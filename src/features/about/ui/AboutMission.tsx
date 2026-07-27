import Image from "next/image";

import { ABOUT_MISSION_IMAGE } from "@/features/about/content/about-assets";
import { AboutLeafDivider } from "@/features/about/ui/AboutLeafDivider";
import { AboutReveal } from "@/features/about/ui/AboutReveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutMissionProps = {
  copy: Dictionary["about"];
};

/** Mission + goal cards beside interior photo. */
export function AboutMission({ copy }: AboutMissionProps) {
  return (
    <section className="relative py-12 md:py-16">
      <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
        <div className="grid grid-cols-1 gap-8 md:gap-9 lg:min-h-[42rem] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-stretch lg:gap-10 xl:gap-12">
          <AboutReveal
            variant="left"
            offsetPx={28}
            durationMs={750}
            className="order-1"
          >
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xl overflow-hidden rounded-[30px] border border-[rgba(201,164,92,0.34)] shadow-[0_24px_50px_-28px_rgba(22,63,46,0.62)] lg:mx-0 lg:h-full lg:max-w-none lg:rounded-[32px]">
              <Image
                src={ABOUT_MISSION_IMAGE}
                alt={copy.missionImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover object-top"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
            </div>
          </AboutReveal>

          <AboutReveal
            variant="right"
            offsetPx={28}
            delayMs={100}
            durationMs={750}
            className="order-2 flex flex-col gap-6 lg:h-full lg:gap-7"
          >
            <div className="rounded-[26px] border border-[rgba(201,164,92,0.34)] bg-[#FFFDF7]/88 p-6 shadow-[0_16px_34px_-22px_rgba(22,63,46,0.58)] backdrop-blur-[1px] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_22px_42px_-20px_rgba(22,63,46,0.6)] md:p-8 lg:flex-1">
              <div className="inline-flex w-fit flex-col">
                <h2 className="text-2xl font-semibold text-[#163F2E] md:text-3xl">
                  {copy.missionTitle}
                </h2>
                <AboutLeafDivider className="mt-3" />
              </div>
              <p className="mt-4 text-base leading-8 text-[#5F6B66] md:text-lg">
                {copy.missionBody}
              </p>
            </div>

            <div className="rounded-[26px] border border-[rgba(201,164,92,0.34)] bg-[#FFFDF7]/88 p-6 shadow-[0_16px_34px_-22px_rgba(22,63,46,0.58)] backdrop-blur-[1px] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_22px_42px_-20px_rgba(22,63,46,0.6)] md:p-8 lg:flex-1">
              <div className="inline-flex w-fit flex-col">
                <h2 className="text-2xl font-semibold text-[#163F2E] md:text-3xl">
                  {copy.goalTitle}
                </h2>
                <AboutLeafDivider className="mt-3" />
              </div>
              {copy.goalParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-base leading-8 text-[#5F6B66] md:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </AboutReveal>
        </div>
      </div>
    </section>
  );
}
