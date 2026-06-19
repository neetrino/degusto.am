import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n-client';
import { UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS } from '@/constants/universal-header-layout';
import { isStorefrontAllCategorySlug } from '@/constants/storefront-all-category-slug';
import { STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS } from '@/constants/storefront-desktop-layout';
import { resolveStorefrontCategoryLabel } from '@/lib/storefront/menu-card-category-label';
import type { MenuCategory } from '../menu-types';

function isMenuCategoryEmpty(category: MenuCategory): boolean {
  return (
    typeof category.productCount === 'number' &&
    category.productCount === 0 &&
    category.slug !== ''
  );
}

function formatCategoryLabelWithCount(categoryLabel: string, productCount?: number): string {
  return typeof productCount === 'number' ? `${categoryLabel} (${productCount})` : categoryLabel;
}

type CategoryNavItem = {
  category: MenuCategory;
  href: string;
};

type FigmaDesktopShopCategorySidebarProps = {
  searchTerm: string;
  onSearchTermChange: (nextSearch: string) => void;
  onSearchSubmit: () => void;
  categoryNavItems: CategoryNavItem[];
  resolvedActiveCategorySlug: string;
  enableSoftCategoryNav: boolean;
  onNavigateCategory: (href: string, categorySlug: string) => void;
  onPrefetchCategory: (href: string) => void;
  getPrefetchHandlers: (href: string) => Record<string, unknown>;
};

export function FigmaDesktopShopCategorySidebar({
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  categoryNavItems,
  resolvedActiveCategorySlug,
  enableSoftCategoryNav,
  onNavigateCategory,
  onPrefetchCategory,
  getPrefetchHandlers,
}: FigmaDesktopShopCategorySidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className={`${UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS} ${STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS} flex-col overflow-hidden rounded-[20px] bg-black pb-5 text-white`}>
      <div className="border-b border-white/10 p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
          className="relative flex h-[46px] items-center rounded-[40px] bg-[#f3f3f5] pl-10 pr-4 text-[16px] text-black/50"
        >
          <span className="absolute left-4 text-[#7f7f80]" aria-hidden="true">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="2" />
              <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={`${t('common.buttons.search')}...`}
            className="h-full w-full bg-transparent text-[16px] text-black outline-none placeholder:text-black/50"
            aria-label={t('common.ariaLabels.search')}
          />
        </form>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-6 pt-[10px]">
        <p className="pb-[12px] text-[14px] font-medium uppercase tracking-[0.2px] text-[#717182]">{t('common.navigation.categories')}</p>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-hide">
          {categoryNavItems.length > 0
            ? categoryNavItems.map(({ category, href }) => {
                const isActive =
                  category.slug === ''
                    ? isStorefrontAllCategorySlug(resolvedActiveCategorySlug)
                    : resolvedActiveCategorySlug === category.slug;
                const empty = isMenuCategoryEmpty(category);
                const sharedClassName = `flex h-10 w-full min-w-0 items-center gap-2 rounded-[10px] px-3 py-[10px] text-left text-[14px] font-medium leading-5 tracking-[-0.15px] ${
                  isActive ? 'rounded-[30px] bg-[#ff7f20] text-white' : 'text-white hover:bg-white/10'
                } ${empty ? 'cursor-not-allowed' : ''} ${
                  empty && !isActive ? 'opacity-50 hover:bg-transparent' : ''
                }`;
                const categoryLabel = resolveStorefrontCategoryLabel(
                  { slug: category.slug, title: category.title },
                  t
                );
                const labelNode = (
                  <>
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                      {category.iconUrl ? <img src={category.iconUrl} alt="" className="h-6 w-6 object-contain" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {formatCategoryLabelWithCount(categoryLabel, category.productCount)}
                    </span>
                  </>
                );

                if (empty) {
                  return (
                    <span key={category.id} aria-disabled="true" className={sharedClassName}>
                      {labelNode}
                    </span>
                  );
                }

                if (enableSoftCategoryNav) {
                  return (
                    <a
                      key={category.id}
                      href={href}
                      onClick={(event) => {
                        event.preventDefault();
                        onNavigateCategory(href, category.slug);
                      }}
                      onMouseEnter={() => onPrefetchCategory(href)}
                      onFocus={() => onPrefetchCategory(href)}
                      onPointerDown={() => onPrefetchCategory(href)}
                      onTouchStart={() => onPrefetchCategory(href)}
                      aria-current={isActive ? 'page' : undefined}
                      className={sharedClassName}
                    >
                      {labelNode}
                    </a>
                  );
                }

                return (
                  <Link
                    key={category.id}
                    href={href}
                    prefetch
                    {...getPrefetchHandlers(href)}
                    aria-current={isActive ? 'page' : undefined}
                    className={sharedClassName}
                  >
                    {labelNode}
                  </Link>
                );
              })
            : (
                <p className="px-1 py-2 text-sm text-white/60">{t('home.featured_products.noProducts')}</p>
              )}
        </div>
      </div>
    </aside>
  );
}
