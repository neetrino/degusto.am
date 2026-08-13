import { notFound } from "next/navigation";

import { AboutHero } from "@/features/about/ui/AboutHero";
import { AboutMission } from "@/features/about/ui/AboutMission";
import { AboutPrinciplesMarquee } from "@/features/about/ui/AboutPrinciplesMarquee";
import { AboutSmoothScroll } from "@/features/about/ui/AboutSmoothScroll";
import { AboutStats } from "@/features/about/ui/AboutStats";
import { AboutStory } from "@/features/about/ui/AboutStory";
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
  const [lead = "", ...storyParagraphs] = dictionary.about.paragraphs;

  return (
    <AboutSmoothScroll>
      <div
        data-about-page
        className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-[7.5rem] w-screen"
      >
        <AboutHero
          copy={dictionary.about}
          locale={rawLocale}
          ctaLabel={dictionary.nav.shopNow}
          lead={lead}
        />
        <AboutPrinciplesMarquee principles={dictionary.about.principles} />
        <AboutStory
          paragraphs={storyParagraphs}
          brand={dictionary.brand}
          eyebrow={dictionary.about.storyEyebrow}
          title={dictionary.about.storyTitle}
          yearsValue="4"
          yearsLabel={dictionary.about.storyYearsLabel}
        />
        <AboutStats copy={dictionary.about} />
        <AboutMission copy={dictionary.about} brand={dictionary.brand} />
      </div>
    </AboutSmoothScroll>
  );
}
