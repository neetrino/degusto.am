import {
  PDP_FIGMA_DARK_SECTION,
  PDP_RELATED_HEADER_GAP_CLASS,
  PDP_RELATED_SECTION_CLASS,
  PDP_RELATED_SECTION_MAX_WIDTH_CLASS,
  PDP_RELATED_TITLE_ACCENT_CLASS,
  PDP_RELATED_TITLE_MAIN_CLASS,
  PDP_RELATED_VIEW_MORE_CLASS,
} from '@/constants/pdp-figma-tokens';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';
import { ViewMoreButton } from '@/components/view-more/ViewMoreButton';
import type { LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';

type RelatedProductsSectionSkeletonProps = {
  language: LanguageCode;
  skeletonCardWidth: string;
  skeletonCount: number;
  compact: boolean;
};

/** Static PDP related block — no API calls (used while main product payload loads). */
export function RelatedProductsSectionSkeleton({
  language,
  skeletonCardWidth,
  skeletonCount,
  compact,
}: RelatedProductsSectionSkeletonProps) {
  return (
    <section className={PDP_RELATED_SECTION_CLASS} style={{ backgroundColor: PDP_FIGMA_DARK_SECTION }}>
      <div className={PDP_RELATED_SECTION_MAX_WIDTH_CLASS}>
        <div className={`flex items-start justify-between gap-4 ${PDP_RELATED_HEADER_GAP_CLASS}`}>
          <h2 className="max-w-[min(100%,42rem)] font-black leading-none">
            <span className={PDP_RELATED_TITLE_ACCENT_CLASS}>
              {t(language, 'product.relatedSectionTitleAccent')}
            </span>
            <span className={PDP_RELATED_TITLE_MAIN_CLASS}>
              {t(language, 'product.relatedSectionTitleMain')}
            </span>
          </h2>
          <ViewMoreButton
            href="/shop"
            className={`${PDP_RELATED_VIEW_MORE_CLASS} ${montserratArmFont.className} lg:mt-2`}
            size="md"
          >
            {t(language, 'product.relatedSectionMore')} →
          </ViewMoreButton>
        </div>
        <div className="relative overflow-hidden" aria-hidden>
          <div className="flex items-stretch">
            {Array.from({ length: skeletonCount }, (_, i) => i + 1).map((i) => (
              <div key={i} className="shrink-0" style={{ width: skeletonCardWidth }}>
                <div className={compact ? 'px-[7px] pb-5' : 'px-[16.5px] pb-[30px]'}>
                  <div className="h-[268px] animate-pulse rounded-[20px] bg-neutral-100 lg:h-[284px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
