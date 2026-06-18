'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { getHomeCategoryHref } from './homeCategoryLinks';
import { resolveMobileShopCategoryImage } from '@/constants/mobile-shop-category-images';
import {
  MOBILE_SHOP_CATEGORY_CARD_CLASS,
  MOBILE_SHOP_CATEGORY_CARD_IMAGE_CLASS,
  MOBILE_SHOP_CATEGORY_GRID_CLASS,
} from '@/constants/mobile-figma-storefront';
import { HomeOptimizedImage } from './HomeOptimizedImage';
import { StorefrontCategoryLink } from '../routing/StorefrontCategoryLink';
import { resolveStorefrontCategoryLabel } from '@/lib/storefront/menu-card-category-label';

export type MobileShopCategoryCard = {
  id: string;
  slug: string;
  title: string;
  iconUrl: string | null;
  productCount?: number;
};

type MobileShopCategoriesViewProps = {
  categories: MobileShopCategoryCard[];
};

function isCategorySelectable(category: MobileShopCategoryCard): boolean {
  return typeof category.productCount !== 'number' || category.productCount > 0;
}

export function MobileShopCategoriesView({ categories }: MobileShopCategoriesViewProps) {
  const { t } = useTranslation();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const selectableCategories = useMemo(
    () => categories.filter(isCategorySelectable),
    [categories]
  );

  return (
    <section className="lg:hidden">
      <h1 className="text-base font-semibold leading-5 text-black">{t('common.navigation.categories')}</h1>

      {selectableCategories.length > 0 ? (
        <div className={MOBILE_SHOP_CATEGORY_GRID_CLASS}>
          {selectableCategories.map((category) => {
            const categoryLabel = resolveStorefrontCategoryLabel(
              { slug: category.slug, title: category.title },
              t
            );
            const href = getHomeCategoryHref({ slug: category.slug, title: categoryLabel });
            const imageSrc = resolveMobileShopCategoryImage(category.slug, category.iconUrl);
            const isPending = pendingSlug === category.slug;

            return (
              <StorefrontCategoryLink
                key={category.id}
                href={href}
                onClick={() => {
                  setPendingSlug(category.slug);
                }}
                aria-busy={isPending}
                className={`${MOBILE_SHOP_CATEGORY_CARD_CLASS} ${
                  isPending ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                <p className="relative z-10 px-[13px] pt-5 text-xs font-medium leading-[18px] text-white">
                  {categoryLabel}
                </p>
                <div className={MOBILE_SHOP_CATEGORY_CARD_IMAGE_CLASS}>
                  <HomeOptimizedImage
                    src={imageSrc}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 50vw, 240px"
                    loading="lazy"
                  />
                </div>
              </StorefrontCategoryLink>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-[#717182]">{t('common.messages.noProductsFound')}</p>
      )}
    </section>
  );
}
