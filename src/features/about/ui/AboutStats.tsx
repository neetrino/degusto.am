import Image from "next/image";

import {
  ABOUT_STAT_ICONS,
  type AboutStatIconKey,
} from "@/features/about/content/about-assets";
import { AboutLeafDivider } from "@/features/about/ui/AboutLeafDivider";
import { AboutReveal } from "@/features/about/ui/AboutReveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutStatsProps = {
  copy: Dictionary["about"];
};

function isStatIconKey(value: string): value is AboutStatIconKey {
  return value in ABOUT_STAT_ICONS;
}

/** Stats card grid — reference «Մեր ցուցանիշները» block. */
export function AboutStats({ copy }: AboutStatsProps) {
  return (
    <section className="relative z-10 -mt-12 pt-20 pb-12 md:-mt-14 md:pt-24 md:pb-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FBF6EA]/40 to-transparent" />
        <div className="absolute -right-10 top-12 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(233,172,154,0.18)_0%,_rgba(233,172,154,0)_72%)] blur-2xl md:block" />
        <div className="absolute -left-14 bottom-2 hidden h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(126,157,116,0.16)_0%,_rgba(126,157,116,0)_72%)] blur-2xl lg:block" />
      </div>

      <AboutReveal
        variant="up"
        offsetPx={18}
        durationMs={700}
        className="relative mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]"
      >
        <div className="rounded-[30px] border border-[rgba(201,164,92,0.33)] bg-[#FFFDF7]/78 p-6 shadow-[0_18px_38px_-24px_rgba(22,63,46,0.45)] backdrop-blur-[2px] md:p-9 lg:rounded-[34px] lg:p-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#B94A24] uppercase md:text-sm">
              {copy.statsEyebrow}
            </p>
            <div className="mt-3 inline-flex w-fit flex-col">
              <h2 className="text-2xl font-semibold text-[#163F2E] md:text-3xl lg:text-4xl">
                {copy.statsTitle}
              </h2>
              <AboutLeafDivider />
            </div>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-10 lg:grid-cols-4 lg:gap-6">
            {copy.stats.map((stat, index) => {
              const iconSrc = isStatIconKey(stat.icon)
                ? ABOUT_STAT_ICONS[stat.icon]
                : ABOUT_STAT_ICONS.users;

              return (
                <AboutReveal
                  key={`${stat.value}-${stat.label}`}
                  variant="up"
                  offsetPx={22}
                  delayMs={index * 110}
                  durationMs={650}
                >
                  <article className="group rounded-[24px] border border-[rgba(201,164,92,0.28)] bg-[#FFFDF7]/90 px-5 py-6 text-center shadow-[0_14px_26px_-22px_rgba(22,63,46,0.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-20px_rgba(22,63,46,0.75)] md:px-6 md:py-7">
                    <div className="mx-auto flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border border-[rgba(201,164,92,0.48)] bg-[#FFF8E8] p-0.5 transition-transform duration-300 group-hover:scale-105">
                      <Image
                        src={iconSrc}
                        alt=""
                        width={60}
                        height={60}
                        className="h-full w-full rounded-full object-cover"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-4 text-3xl font-semibold tabular-nums text-[#163F2E] md:text-4xl">
                      {stat.value}
                    </p>
                    <span
                      className="mx-auto mt-3 block h-px w-12 bg-[#C9A45C]/72"
                      aria-hidden
                    />
                    <p className="mt-3 text-sm text-[#5F6B66] md:text-base">
                      {stat.label}
                    </p>
                  </article>
                </AboutReveal>
              );
            })}
          </div>
        </div>
      </AboutReveal>
    </section>
  );
}
