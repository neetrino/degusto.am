import Link from 'next/link';
import { t } from '@/lib/i18n';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { formatPrice } from '@/lib/currency';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import {
  isStorefrontAllCategorySlug,
  STOREFRONT_ALL_CATEGORY_SLUG,
} from '@/constants/storefront-all-category-slug';
import { UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS } from '@/constants/universal-header-layout';
import {
  MOBILE_SHOP_PRODUCTS_GRID_CLASS,
  MOBILE_STOREFRONT_PAGE_SECTION_CLASS,
} from '@/constants/mobile-figma-storefront';
import {
  STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS,
  STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS,
  STOREFRONT_DESKTOP_SHOP_SECTION_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS,
} from '@/constants/storefront-desktop-layout';
import type { MenuCard, MenuCategory } from './menu-types';

type StorefrontMenuPageShellProps = {
  locale: StorefrontLocale;
  routeBasePath: '/shop' | '/combo';
  titleKey: string;
  subtitleKey: string;
  cards: MenuCard[];
  categories: MenuCategory[];
  activeCategorySlug?: string;
  showMobileProductsList?: boolean;
};

function buildCategoryHref(routeBasePath: string, categorySlug: string): string {
  if (isStorefrontAllCategorySlug(categorySlug) || categorySlug === '') {
    return `${routeBasePath}?category=${STOREFRONT_ALL_CATEGORY_SLUG}`;
  }
  return `${routeBasePath}?category=${encodeURIComponent(categorySlug)}`;
}

function formatCategoryLabel(category: MenuCategory): string {
  if (typeof category.productCount !== 'number') {
    return category.title;
  }
  return `${category.title} (${category.productCount})`;
}

function StaticMenuProductCard({ card }: { card: MenuCard }) {
  const title = card.title ?? '';
  const imageSrc = resolveStorefrontProductImage(card.image);

  return (
    <article className="relative h-[330px] w-full shrink-0 rounded-[20px] border-[1.5px] border-[#dedede] bg-white">
      <Link href={`/products/${card.slug}`} className="absolute inset-0 z-10 rounded-[20px]" aria-label={title}>
        <span className="sr-only">{title}</span>
      </Link>
      <div className="relative mx-auto mt-1 h-[180px] w-[calc(100%-10px)] overflow-hidden rounded-[20px]">
        <img src={imageSrc} alt={title} className="h-full w-full rounded-[20px] object-cover" loading="lazy" />
      </div>
      <h3 className="absolute left-[14px] right-[100px] top-[239px] truncate text-base font-bold text-[#3c2f2f]">
        {title}
      </h3>
      <p className="absolute right-[14px] top-[282px] text-[20px] font-black text-[#3c2f2f]">
        {formatPrice(card.price, 'AMD')}
      </p>
    </article>
  );
}

/**
 * Server-rendered shop/combo shell shown while interactive menu hydrates.
 */
export function StorefrontMenuPageShell({
  locale,
  routeBasePath,
  titleKey,
  subtitleKey,
  cards,
  categories,
  activeCategorySlug = '',
  showMobileProductsList = true,
}: StorefrontMenuPageShellProps) {
  const title = t(locale, titleKey);
  const subtitle = t(locale, subtitleKey);
  const noProductsLabel = t(locale, 'common.messages.noProductsFound');
  const categoriesLabel = t(locale, 'common.navigation.categories');

  return (
    <>
      {showMobileProductsList ? (
        <div className="pb-8 pt-0 lg:hidden">
          <div className={MOBILE_STOREFRONT_PAGE_SECTION_CLASS}>
            <h1 className="text-[32px] font-bold leading-tight text-[#f66913]">{title}</h1>
            <p className="mt-2 text-sm tracking-[-0.2px] text-[#717182]">{subtitle}</p>
            {cards.length > 0 ? (
              <div className={`mt-8 ${MOBILE_SHOP_PRODUCTS_GRID_CLASS}`}>
                {cards.map((card) => (
                  <StaticMenuProductCard key={card.id} card={card} />
                ))}
              </div>
            ) : (
              <div className="mt-8 flex min-h-[200px] items-center justify-center rounded-[20px] border border-dashed border-[#d4d4d8] bg-[#fafafc] px-6 text-center text-base font-medium text-[#717182]">
                {noProductsLabel}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="hidden bg-white pb-20 pt-5 lg:block">
        <div className={`${STOREFRONT_DESKTOP_SHOP_SECTION_CLASS} flex min-w-0 ${STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS}`}>
          <aside
            className={`${UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS} ${STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS} flex-col overflow-hidden rounded-[20px] bg-black pb-5 text-white`}
          >
            <div className="flex min-h-0 flex-1 flex-col px-6 pt-[10px]">
              <p className="pb-[12px] text-[14px] font-medium uppercase tracking-[0.2px] text-[#717182]">
                {categoriesLabel}
              </p>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-hide">
                {categories.map((category) => {
                  const isActive =
                    category.slug === ''
                      ? isStorefrontAllCategorySlug(activeCategorySlug)
                      : activeCategorySlug === category.slug;

                  return (
                    <Link
                      key={category.id}
                      href={buildCategoryHref(routeBasePath, category.slug)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-[10px] px-3 py-[10px] text-left text-[14px] font-medium leading-5 tracking-[-0.15px] ${
                        isActive ? 'rounded-[30px] bg-[#ff7f20] text-white' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {category.iconUrl ? (
                        <img src={category.iconUrl} alt="" className="h-6 w-6 shrink-0 object-contain" />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">{formatCategoryLabel(category)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className={STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS}>
            <div className="mb-[42px] mt-10">
              <h1 className="text-4xl font-bold leading-tight text-[#f66913] xl:text-[60px] xl:leading-[51px]">
                {title}
              </h1>
              <p className="mt-2.5 text-base tracking-[-0.31px] text-[#717182]">{subtitle}</p>
            </div>

            {cards.length > 0 ? (
              <div className={STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS}>
                {cards.map((card) => (
                  <StaticMenuProductCard key={card.id} card={card} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-[20px] border border-dashed border-[#d4d4d8] bg-[#fafafc] px-6 text-center text-[18px] font-medium text-[#717182]">
                {noProductsLabel}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
