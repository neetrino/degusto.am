import Image from "next/image";
import { notFound } from "next/navigation";

import { ABOUT_BOTANICAL_BG } from "@/features/about/content/about-assets";
import { AboutHero } from "@/features/about/ui/AboutHero";
import { AboutMission } from "@/features/about/ui/AboutMission";
import { AboutStats } from "@/features/about/ui/AboutStats";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <div
      data-about-page
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-[7.5rem] w-screen"
    >
      <div className="relative overflow-hidden bg-[#FBF6EA] pt-[7.5rem] pb-10 md:pb-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={ABOUT_BOTANICAL_BG}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[#FBF6EA]/62" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F6EEDF] via-[#F8F1E4]/88 to-transparent" />
          <div className="absolute -bottom-12 -left-16 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(246,238,223,0.9)_0%,_rgba(246,238,223,0)_72%)] blur-xl md:block" />
          <div className="absolute -right-16 -bottom-12 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(246,238,223,0.9)_0%,_rgba(246,238,223,0)_72%)] blur-xl md:block" />
        </div>

        <div className="relative z-10">
          <AboutHero copy={dictionary.about} />
          <AboutStats copy={dictionary.about} />
          <AboutMission copy={dictionary.about} />
        </div>
      </div>
    </div>
  );
}
