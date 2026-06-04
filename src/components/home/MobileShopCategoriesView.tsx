'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { getHomeCategoryHref } from './homeCategoryLinks';
import { resolveMobileShopCategoryImage } from '@/constants/mobile-shop-category-images';
import { StorefrontCategoryLink } from '../routing/StorefrontCategoryLink';

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
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-[14px]">
          {selectableCategories.map((category) => {
            const href = getHomeCategoryHref({ slug: category.slug, title: category.title });
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
                className={`relative block h-[183px] overflow-hidden rounded-[28px] bg-[#090909] text-left transition-opacity active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13] ${
                  isPending ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                <p className="absolute left-[13px] top-5 right-[10px] text-xs font-medium leading-[18px] text-white">
                  {category.title}
                </p>
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    className="pointer-events-none absolute bottom-0 right-0 h-[130px] w-[132px] object-contain"
                  />
                ) : null}
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
