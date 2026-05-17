'use client';

import { useTranslation } from '../../lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../../lib/currency';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAddToCart } from '../hooks/useAddToCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../../lib/auth/AuthContext';
import { WishlistHeartIcon } from '../icons/WishlistHeartIcon';
import { HomeProductFoodAttributeBadges } from './HomeProductFoodAttributeBadges';
import type { MenuCard, MenuCategory } from './menu-types';
import { ShopMobileProductCard } from './ShopMobileProductCard';
import { StoreMenuPagination } from './StoreMenuPagination';
import {
  MOBILE_SHOP_PRODUCTS_GRID_CLASS,
  MOBILE_STOREFRONT_FILTERS_ANCHOR_ID,
} from '@/constants/mobile-figma-storefront';

const assets = {
  productCardImage: '/api/r2/product/20260512-D3w_teddze.png',
  productCardAddToCart: '/api/r2/product/20260512-g67zkm13ZH.svg',
  productCardHot: 'https://www.figma.com/api/mcp/asset/fc4ede25-e0a0-40c4-9e90-1108955e5111',
  productCardRibbon: '/api/r2/product/20260512-lmzrYlGD39.svg',
  productCardStar: '/api/r2/product/20260512-7jf6Wihrew.svg',
  switcherLeafRibbon: 'https://www.figma.com/api/mcp/asset/c35852c7-d37b-4ae3-bce2-6cff1c8c6763',
  switcherPepper: 'https://www.figma.com/api/mcp/asset/b55ba537-950b-4307-b788-dd50e7b74c43',
};

/** Debounce before writing search to the URL (server refetch); avoids one request per key. */
const SEARCH_QUERY_URL_DEBOUNCE_MS = 250;

type DesktopMenuPageProps = {
  titleKey: string;
  subtitleKey: string;
  activeCategoryIndex: number;
  cards?: MenuCard[];
  categories?: MenuCategory[];
  activeCategorySlug?: string;
  initialSearch?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialFoodFilter?: 'leaf' | 'neutral' | 'pepper';
  menuPagination?: {
    currentPage: number;
    totalPages: number;
  };
  /** When false, hides the mobile product list (e.g. mobile shop category grid on `/shop`). */
  showMobileProductsList?: boolean;
};

const fallbackCategoryKeys = [
  'home.figma.desktop.categories.all',
  'home.figma.desktop.categories.soupsAndHotDishes',
  'home.figma.desktop.categories.salads',
  'home.figma.desktop.categories.shawarma',
  'home.figma.desktop.categories.pizza',
  'home.figma.desktop.categories.lahmajo',
  'home.figma.desktop.categories.georgianKhachapuri',
  'home.figma.desktop.categories.bbq',
  'home.figma.desktop.categories.khinkali',
  'home.figma.desktop.categories.stuffedPotato',
  'home.figma.desktop.categories.burgersAndSandwiches',
  'home.figma.desktop.categories.piesAndPancakes',
  'home.figma.desktop.categories.comboSets',
  'home.figma.desktop.categories.lunchBoxes',
  'home.figma.desktop.categories.grillAndSmokedProducts',
] as const;

type BuildMenuTargetPathFn = (
  categorySlug: string,
  overrides?: {
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    taste?: 'leaf' | 'neutral' | 'pepper';
    page?: number;
  }
) => string;

type MenuFilterRouteSnapshot = {
  buildTargetPath: BuildMenuTargetPathFn;
  activeCategorySlug: string;
  minPrice: string;
  maxPrice: string;
  foodFilter: 'leaf' | 'neutral' | 'pepper';
};

function useMenuSearchUrlSync(
  router: { replace: (href: string) => void },
  buildTargetPath: BuildMenuTargetPathFn,
  activeCategorySlug: string,
  minPrice: string,
  maxPrice: string,
  foodFilter: 'leaf' | 'neutral' | 'pepper'
) {
  const searchUrlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuFilterRouteRef = useRef<MenuFilterRouteSnapshot>({
    buildTargetPath,
    activeCategorySlug,
    minPrice,
    maxPrice,
    foodFilter,
  });

  useLayoutEffect(() => {
    menuFilterRouteRef.current = {
      buildTargetPath,
      activeCategorySlug,
      minPrice,
      maxPrice,
      foodFilter,
    };
  }, [activeCategorySlug, buildTargetPath, foodFilter, maxPrice, minPrice]);

  useEffect(() => {
    return () => {
      if (searchUrlDebounceRef.current) {
        clearTimeout(searchUrlDebounceRef.current);
      }
    };
  }, []);

  const scheduleSearchQueryUrlSync = useCallback((nextSearch: string) => {
    if (searchUrlDebounceRef.current) {
      clearTimeout(searchUrlDebounceRef.current);
    }
    searchUrlDebounceRef.current = setTimeout(() => {
      searchUrlDebounceRef.current = null;
      const d = menuFilterRouteRef.current;
      router.replace(
        d.buildTargetPath(d.activeCategorySlug, {
          search: nextSearch,
          minPrice: d.minPrice,
          maxPrice: d.maxPrice,
          taste: d.foodFilter,
        })
      );
    }, SEARCH_QUERY_URL_DEBOUNCE_MS);
  }, [router]);

  const flushSearchQueryUrlSync = useCallback((nextSearch: string) => {
    if (searchUrlDebounceRef.current) {
      clearTimeout(searchUrlDebounceRef.current);
      searchUrlDebounceRef.current = null;
    }
    const d = menuFilterRouteRef.current;
    router.replace(
      d.buildTargetPath(d.activeCategorySlug, {
        search: nextSearch,
        minPrice: d.minPrice,
        maxPrice: d.maxPrice,
        taste: d.foodFilter,
      })
    );
  }, [router]);

  return { scheduleSearchQueryUrlSync, flushSearchQueryUrlSync };
}

function isMenuCategoryEmpty(category: MenuCategory): boolean {
  return (
    typeof category.productCount === 'number' &&
    category.productCount === 0 &&
    category.slug !== ''
  );
}

function formatCategoryLabelWithCount(category: MenuCategory): string {
  if (typeof category.productCount !== 'number') {
    return category.title;
  }
  return `${category.title} (${category.productCount})`;
}

const categoryIconUrls: readonly string[] = [
  'https://www.figma.com/api/mcp/asset/8de80153-582c-4bef-9266-5891b9fbdab3',
  'https://www.figma.com/api/mcp/asset/e3d4fcad-c674-4414-95c8-ca012568b13e',
  'https://www.figma.com/api/mcp/asset/d370b052-6fd2-42a3-851d-f586d3a23b3a',
  'https://www.figma.com/api/mcp/asset/619909ac-77cf-4117-b141-aa71f293b6eb',
  'https://www.figma.com/api/mcp/asset/6d232edf-6c5c-4e86-9e11-50dd95b37b14',
  'https://www.figma.com/api/mcp/asset/c0ac7ff0-bf52-4391-b6e0-b747cd18ba51',
  'https://www.figma.com/api/mcp/asset/4cfc22ad-568a-4915-a3dd-00cb3776095d',
  'https://www.figma.com/api/mcp/asset/3154f92a-318f-447b-b519-4534c7b191fa',
  'https://www.figma.com/api/mcp/asset/bc9f1772-5cce-4796-98ac-45e4b00bee54',
  'https://www.figma.com/api/mcp/asset/2b326ae0-288b-422c-9a6f-43801b37f863',
  'https://www.figma.com/api/mcp/asset/0e7f6a80-7542-4046-9fde-4575adcfe996',
  'https://www.figma.com/api/mcp/asset/7b8393a5-e7d3-47c5-8674-84a5c2ebaaff',
  'https://www.figma.com/api/mcp/asset/77042696-4258-446a-a60c-61e7d439626e',
  'https://www.figma.com/api/mcp/asset/9abad853-0a02-45c4-bfad-b2db812cf47e',
  'https://www.figma.com/api/mcp/asset/f753dcb8-0d13-4c01-a132-9640f1282ad7',
];

function MenuCardItem({ card }: { card: MenuCard }) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist(card.id);
  const title = card.title || t(card.titleKey);
  const category = card.category || (card.categoryKey ? t(card.categoryKey) : '');
  const imageSrc = card.image || assets.productCardImage;
  const calculatedDiscountPercent =
    card.oldPrice > card.price && card.oldPrice > 0
      ? Math.round(((card.oldPrice - card.price) / card.oldPrice) * 100)
      : 0;
  const fallbackDiscountPercent =
    typeof card.discountPercent === 'number' && card.discountPercent > 0
      ? Math.round(card.discountPercent)
      : 0;
  const effectiveDiscountPercent = calculatedDiscountPercent || fallbackDiscountPercent;
  const hasDiscount = effectiveDiscountPercent > 0;
  const discountText = hasDiscount ? `-${effectiveDiscountPercent}%` : '';
  const productHref = `/products/${card.slug}`;
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: card.id,
    productSlug: card.slug,
    inStock: card.inStock ?? true,
    defaultVariantId: card.defaultVariantId ?? undefined,
    price: card.price,
  });
  const handleOpenProduct = () => {
    router.push(productHref);
  };
  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    handleOpenProduct();
  };

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const cardRoot = button.closest('[data-home-product-card]');
    const origin =
      (cardRoot?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: card.image || null });
  };

  const handleWishlistToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(productHref)}`);
      return;
    }
    void toggleWishlist();
  };

  return (
    <article
      data-home-product-card
      className="relative h-[284px] w-[236px] shrink-0 rounded-[20px] border-[1.5px] border-[#dedede] bg-white cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleOpenProduct}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={title}
    >
      <div data-product-fly-origin className="absolute left-1/2 top-1 h-[147px] w-[227px] -translate-x-1/2">
        <img src={imageSrc} alt={title} className="h-full w-full rounded-[18px] object-cover" />
      </div>
      <HomeProductFoodAttributeBadges
        variant="desktop-card"
        supportsSpicy={card.supportsSpicy ?? false}
        supportsGreens={card.supportsGreens ?? false}
        hotIconSrc={assets.productCardHot}
        greensIconSrc={assets.productCardRibbon}
      />
      <button
        type="button"
        onClick={handleWishlistToggle}
        className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-colors sm:h-10 sm:w-10 ${
          isInWishlist
            ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
            : 'border-[#dedede]/90 bg-white/95 text-gray-700 hover:bg-white'
        }`}
        title={
          isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')
        }
        aria-label={
          isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
        }
      >
        <WishlistHeartIcon filled={isInWishlist} size={18} />
      </button>
      <div className="absolute left-[14px] top-[170px] flex items-center gap-[6px]">
        <img src={assets.productCardStar} alt="" className="h-5 w-5 object-contain" />
        <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>
      <h3 className="absolute left-[14px] top-[194px] w-[130px] text-base font-bold leading-[1.05] text-[#3c2f2f]">
        <span className="block max-h-[34px] overflow-hidden break-words">{title}</span>
      </h3>
      {category ? (
        <p className="absolute left-[14px] top-[236px] w-[130px] overflow-visible text-base font-medium leading-[1.2] text-[#a1a1a1]">
          {category}
        </p>
      ) : null}
      {hasDiscount ? (
        <span className="absolute right-px top-[170px] inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black">
          {discountText}
        </span>
      ) : null}
      <p className="absolute right-[14px] top-[236px] text-[20px] font-black leading-none text-[#3c2f2f]">{formatPrice(card.price, currency)}</p>
      <p className="absolute right-[14px] top-[262px] text-sm font-light leading-none text-[#3c2f2f] line-through">{formatPrice(card.oldPrice, currency)}</p>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart || (card.inStock === false)}
        aria-label={t('common.buttons.addToCart')}
        className="absolute -bottom-[25px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center"
      >
        <img src={assets.productCardAddToCart} alt="" className="h-[52px] w-[51px] object-contain" />
      </button>
    </article>
  );
}

function FoodAttributeSwitcher({
  selectedOption,
  onChange,
}: {
  selectedOption: 'leaf' | 'neutral' | 'pepper';
  onChange: (_next: 'leaf' | 'neutral' | 'pepper') => void;
}) {
  const { t } = useTranslation();
  const optionOrder: Array<'leaf' | 'neutral' | 'pepper'> = ['leaf', 'neutral', 'pepper'];
  const selectedIndex = optionOrder.indexOf(selectedOption);
  const switcherBackgroundClassName =
    selectedOption === 'leaf'
      ? 'bg-[#7fb24a]'
      : selectedOption === 'pepper'
        ? 'bg-[#dc3f3a]'
        : 'bg-[#aeb1ba]';

  return (
    <div
      role="radiogroup"
      aria-label={t('home.figma.desktop.shop.foodAttributeSwitcherAria')}
      className={`relative flex h-[46px] w-[120px] items-center gap-[6px] rounded-[40px] px-[4px] transition-colors duration-200 ${switcherBackgroundClassName}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[6px] top-1/2 z-20 h-[28px] w-[28px] -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-sm transition-transform duration-200"
        style={{ transform: `translate(${selectedIndex * 38}px, -50%)` }}
      />

      <button
        type="button"
        role="radio"
        aria-checked={selectedOption === 'leaf'}
        onClick={() => onChange('leaf')}
        className={`relative z-10 inline-flex h-[32px] w-[32px] items-center justify-center rounded-full transition-opacity ${
          selectedOption === 'leaf' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <img src={assets.switcherLeafRibbon} alt="" className="h-[32px] w-[32px] object-contain" />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={selectedOption === 'neutral'}
        onClick={() => onChange('neutral')}
        className={`relative z-10 inline-flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ececef] text-[#b5b5b8] transition-opacity ${
          selectedOption === 'neutral' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <svg
          aria-hidden="true"
          className="h-[15px] w-[15px]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={selectedOption === 'pepper'}
        onClick={() => onChange('pepper')}
        className={`relative z-10 inline-flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ff2b2e] transition-opacity ${
          selectedOption === 'pepper' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <img src={assets.switcherPepper} alt="" className="h-[19px] w-[19px] -rotate-[13deg] object-contain" />
      </button>
    </div>
  );
}

export function FigmaDesktopMenuPage({
  titleKey,
  subtitleKey,
  activeCategoryIndex,
  cards,
  categories: dbCategories,
  activeCategorySlug = '',
  initialSearch = '',
  initialMinPrice = '',
  initialMaxPrice = '',
  initialFoodFilter = 'neutral',
  menuPagination,
  showMobileProductsList = true,
}: DesktopMenuPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuCards = cards ?? [];
  const hasDbCategories = Array.isArray(dbCategories) && dbCategories.length > 0;
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [foodFilter, setFoodFilter] = useState<'leaf' | 'neutral' | 'pepper'>(initialFoodFilter);
  const routeBasePath = pathname?.startsWith('/combo') ? '/combo' : '/shop';

  useEffect(() => {
    if (!showMobileProductsList || searchParams.get('openFilters') !== '1') {
      return;
    }
    document.getElementById(MOBILE_STOREFRONT_FILTERS_ANCHOR_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [searchParams, showMobileProductsList]);

  const buildTargetPath = useMemo(() => {
    return (
      categorySlug: string,
      overrides?: {
        search?: string;
        minPrice?: string;
        maxPrice?: string;
        taste?: 'leaf' | 'neutral' | 'pepper';
        page?: number;
      }
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextSearch = (overrides?.search ?? searchTerm).trim();
      const nextMinPrice = (overrides?.minPrice ?? minPrice).trim();
      const nextMaxPrice = (overrides?.maxPrice ?? maxPrice).trim();
      const nextTaste = overrides?.taste ?? foodFilter;

      if (categorySlug) {
        params.set('category', categorySlug);
      } else {
        params.delete('category');
      }

      if (nextSearch) {
        params.set('search', nextSearch);
      } else {
        params.delete('search');
      }

      if (nextMinPrice) {
        params.set('minPrice', nextMinPrice);
      } else {
        params.delete('minPrice');
      }

      if (nextMaxPrice) {
        params.set('maxPrice', nextMaxPrice);
      } else {
        params.delete('maxPrice');
      }

      if (nextTaste !== 'neutral') {
        params.set('taste', nextTaste);
      } else {
        params.delete('taste');
      }

      const nextPage = overrides?.page;
      if (typeof nextPage === 'number' && nextPage >= 2) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }

      const queryString = params.toString();
      return queryString ? `${routeBasePath}?${queryString}` : routeBasePath;
    };
  }, [searchParams, searchTerm, minPrice, maxPrice, foodFilter, routeBasePath]);

  const { scheduleSearchQueryUrlSync, flushSearchQueryUrlSync } = useMenuSearchUrlSync(
    router,
    buildTargetPath,
    activeCategorySlug,
    minPrice,
    maxPrice,
    foodFilter
  );

  const openMobileCategoryPicker = useCallback(() => {
    router.push(routeBasePath);
  }, [router, routeBasePath]);

  return (
    <>
      {showMobileProductsList ? (
      <div className="pb-8 pt-0 lg:hidden">
        <div className="mx-auto w-full max-w-[1470px]">
          <h1 className="text-[32px] font-bold leading-tight text-[#f66913]">{t(titleKey)}</h1>
          <p className="mt-2 text-sm tracking-[-0.2px] text-[#717182]">{t(subtitleKey)}</p>

          {hasDbCategories ? (
            <button
              type="button"
              onClick={openMobileCategoryPicker}
              className="mt-4 flex h-[46px] w-full items-center justify-center rounded-[40px] bg-[#ff7f20] px-4 text-base font-semibold text-white"
            >
              {t('home.figma.mobile.chooseCategories')}
            </button>
          ) : null}

          <div
            id={MOBILE_STOREFRONT_FILTERS_ANCHOR_ID}
            className="scroll-mt-28 mt-6 flex flex-wrap items-center gap-2 text-sm text-[#717182]"
          >
            <span className="w-full shrink-0 text-base sm:w-auto">{t('home.figma.desktop.shop.priceLabel')}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={minPrice}
              onChange={(event) => {
                const nextMinPrice = event.target.value;
                setMinPrice(nextMinPrice);
                router.replace(
                  buildTargetPath(activeCategorySlug, {
                    search: searchTerm,
                    minPrice: nextMinPrice,
                    maxPrice,
                  })
                );
              }}
              placeholder={t('home.figma.desktop.shop.priceFrom')}
              className="h-[46px] min-w-0 flex-1 rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80] sm:flex-none sm:basis-[109px]"
            />
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={maxPrice}
              onChange={(event) => {
                const nextMaxPrice = event.target.value;
                setMaxPrice(nextMaxPrice);
                router.replace(
                  buildTargetPath(activeCategorySlug, {
                    search: searchTerm,
                    minPrice,
                    maxPrice: nextMaxPrice,
                  })
                );
              }}
              placeholder={t('home.figma.desktop.shop.priceTo')}
              className="h-[46px] min-w-0 flex-1 rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80] sm:flex-none sm:basis-[109px]"
            />
            <FoodAttributeSwitcher
              selectedOption={foodFilter}
              onChange={(nextTaste) => {
                setFoodFilter(nextTaste);
                router.replace(
                  buildTargetPath(activeCategorySlug, {
                    search: searchTerm,
                    minPrice,
                    maxPrice,
                    taste: nextTaste,
                  })
                );
              }}
            />
          </div>

          {menuCards.length > 0 ? (
            <div className={`mt-8 ${MOBILE_SHOP_PRODUCTS_GRID_CLASS}`}>
              {menuCards.map((card) => (
                <ShopMobileProductCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="mt-8 flex min-h-[200px] items-center justify-center rounded-[20px] border border-dashed border-[#d4d4d8] bg-[#fafafc] px-6 text-center text-base font-medium text-[#717182]">
              {t('common.messages.noProductsFound')}
            </div>
          )}

          {menuPagination ? (
            <StoreMenuPagination
              navAriaLabel={t('common.ariaLabels.paginationNav')}
              currentPage={menuPagination.currentPage}
              totalPages={menuPagination.totalPages}
              buildPageHref={(targetPage) => buildTargetPath(activeCategorySlug, { page: targetPage })}
            />
          ) : null}
        </div>
      </div>
      ) : null}

      <div className="hidden bg-white pb-20 pt-5 lg:block">
        <div className="mx-auto flex w-full max-w-[1470px] gap-8 px-3">
        <aside className="sticky top-[116px] flex h-[calc(100vh-132px)] w-[320px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-black pb-5 text-white">
          <div className="border-b border-white/10 p-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                flushSearchQueryUrlSync(searchTerm);
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
                onChange={(event) => {
                  const nextSearch = event.target.value;
                  setSearchTerm(nextSearch);
                  scheduleSearchQueryUrlSync(nextSearch);
                }}
                placeholder={`${t('common.buttons.search')}...`}
                className="h-full w-full bg-transparent text-[16px] text-black outline-none placeholder:text-black/50"
                aria-label={t('common.ariaLabels.search')}
              />
            </form>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-6 pt-[10px]">
            <p className="pb-[12px] text-[14px] font-medium uppercase tracking-[0.2px] text-[#717182]">{t('common.navigation.categories')}</p>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-hide">
              {hasDbCategories
                ? dbCategories.map((category) => {
                    const isActive = activeCategorySlug === category.slug;
                    const empty = isMenuCategoryEmpty(category);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        aria-disabled={empty}
                        tabIndex={empty ? -1 : undefined}
                        onClick={() => {
                          if (empty) {
                            return;
                          }
                          router.push(buildTargetPath(category.slug));
                        }}
                        aria-pressed={isActive}
                        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-[10px] px-3 py-[10px] text-left text-[14px] font-medium leading-5 tracking-[-0.15px] ${
                          isActive ? 'rounded-[30px] bg-[#ff7f20] text-white' : 'text-white hover:bg-white/10'
                        } ${empty ? 'cursor-not-allowed' : ''} ${
                          empty && !isActive ? 'opacity-50 hover:bg-transparent' : ''
                        }`}
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                          {category.iconUrl ? <img src={category.iconUrl} alt="" className="h-6 w-6 object-contain" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{formatCategoryLabelWithCount(category)}</span>
                      </button>
                    );
                  })
                : fallbackCategoryKeys.map((categoryKey, index) => {
                    const isActive = index === activeCategoryIndex;
                    const iconUrl = categoryIconUrls[index];
                    return (
                      <button
                        key={categoryKey}
                        type="button"
                        className={`flex h-10 w-full items-center rounded-[10px] px-3 py-[10px] text-left text-[14px] font-medium leading-5 tracking-[-0.15px] ${
                          isActive ? 'rounded-[30px] bg-[#ff7f20] text-white' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="mr-3 inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                          {iconUrl ? <img src={iconUrl} alt="" className="h-6 w-6 object-contain" /> : null}
                        </span>
                        <span>{t(categoryKey)}</span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mb-[42px] mt-10 flex items-start justify-between">
            <div className="pt-1">
              <h1 className="text-[60px] leading-[51px] text-[#f66913]">{t(titleKey)}</h1>
              <p className="mt-2.5 text-base tracking-[-0.31px] text-[#717182]">
                {t(subtitleKey)}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-[37px] text-sm text-[#717182]">
              <span className="px-1 text-base">{t('home.figma.desktop.shop.priceLabel')}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={minPrice}
                onChange={(event) => {
                  const nextMinPrice = event.target.value;
                  setMinPrice(nextMinPrice);
                  router.replace(
                    buildTargetPath(activeCategorySlug, {
                      search: searchTerm,
                      minPrice: nextMinPrice,
                      maxPrice,
                    })
                  );
                }}
                placeholder={t('home.figma.desktop.shop.priceFrom')}
                className="h-[46px] w-[109px] rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
              />
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={maxPrice}
                onChange={(event) => {
                  const nextMaxPrice = event.target.value;
                  setMaxPrice(nextMaxPrice);
                  router.replace(
                    buildTargetPath(activeCategorySlug, {
                      search: searchTerm,
                      minPrice,
                      maxPrice: nextMaxPrice,
                    })
                  );
                }}
                placeholder={t('home.figma.desktop.shop.priceTo')}
                className="h-[46px] w-[109px] rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
              />
              <FoodAttributeSwitcher
                selectedOption={foodFilter}
                onChange={(nextTaste) => {
                  setFoodFilter(nextTaste);
                  router.replace(
                    buildTargetPath(activeCategorySlug, {
                      search: searchTerm,
                      minPrice,
                      maxPrice,
                      taste: nextTaste,
                    })
                  );
                }}
              />
            </div>
          </div>

          {menuCards.length > 0 ? (
            <div className="grid grid-cols-4 gap-x-[30px] gap-y-[34px]">
              {menuCards.map((card) => (
                <MenuCardItem key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-[20px] border border-dashed border-[#d4d4d8] bg-[#fafafc] px-6 text-center text-[18px] font-medium text-[#717182]">
              {t('common.messages.noProductsFound')}
            </div>
          )}

          {menuPagination ? (
            <StoreMenuPagination
              navAriaLabel={t('common.ariaLabels.paginationNav')}
              currentPage={menuPagination.currentPage}
              totalPages={menuPagination.totalPages}
              buildPageHref={(targetPage) => buildTargetPath(activeCategorySlug, { page: targetPage })}
            />
          ) : null}
        </section>
      </div>
    </div>
    </>
  );
}

export function FigmaDesktopShopPage() {
  return (
    <FigmaDesktopMenuPage
      titleKey="home.figma.desktop.shop.menuTitle"
      subtitleKey="home.figma.desktop.shop.menuSubtitle"
      activeCategoryIndex={0}
    />
  );
}

export type { MenuCard, MenuCategory } from './menu-types';

