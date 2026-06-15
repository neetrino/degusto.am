'use client';

import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../../lib/currency';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAddToCart } from '../hooks/useAddToCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../../lib/auth/AuthContext';
import { WishlistHeartIcon } from '../icons/WishlistHeartIcon';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS } from '@/constants/universal-header-layout';
import { HomeProductFoodAttributeBadges } from './HomeProductFoodAttributeBadges';
import { StorefrontProductOverlayLink } from './StorefrontProductOverlayLink';
import { usePrefetchProductWhenVisible } from '../hooks/usePrefetchProductWhenVisible';
import { prefetchProductRoute } from '@/lib/products/prefetch-product-route';
import type { MenuCard, MenuCategory } from './menu-types';
import { ShopMobileProductCard } from './ShopMobileProductCard';
import { StoreMenuPagination } from './StoreMenuPagination';
import {
  FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS,
  MOBILE_SHOP_PRODUCTS_GRID_CLASS,
  MOBILE_STOREFRONT_FILTERS_ANCHOR_ID,
  MOBILE_STOREFRONT_PAGE_SECTION_CLASS,
} from '@/constants/mobile-figma-storefront';
import {
  getProductCardWishlistHoverClasses,
  PRODUCT_CARD_CART_BTN_HOVER_CLASS,
  PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS,
  PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS,
} from '@/constants/product-card-action-hover';
import { MobileFriendlyInput } from '@/components/mobile/MobileFriendlyInput';
import {
  isStorefrontAllCategorySlug,
  STOREFRONT_ALL_CATEGORY_SLUG,
} from '@/constants/storefront-all-category-slug';
import { shouldShowMenuCardStrikethroughPrice } from '@/lib/storefront/menu-card-pricing';
import { r2Asset } from '@/lib/r2-public-url';
import { useRoutePrefetch } from './useRoutePrefetch';
import { useShopCategorySoftNav } from './useShopCategorySoftNav';
import { ShopDesktopProductsSkeleton } from './ShopDesktopProductsSkeleton';
import { HomeOptimizedImage } from './HomeOptimizedImage';
import { createProductPreviewSummary } from '@/lib/products/product-preview';
import { convertPrice } from '@/lib/currency';
import {
  STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS,
  STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS,
  STOREFRONT_DESKTOP_SHOP_SECTION_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS,
} from '@/constants/storefront-desktop-layout';

const assets = {
  productCardAddToCart: r2Asset('product/20260512-g67zkm13ZH.svg'),
  productCardHot: r2Asset('product/20260512-dWv7-ZfxP1.svg'),
  productCardRibbon: r2Asset('product/20260512-lmzrYlGD39.svg'),
  productCardStar: r2Asset('product/20260512-7jf6Wihrew.svg'),
  switcherLeafRibbon: r2Asset('product/20260512-vCDQ1I3ZtJ.svg'),
  switcherPepper: r2Asset('product/20260512-dWv7-ZfxP1.svg'),
};

/** Desktop shop grid card — 3 columns, taller product photo (was 147px @ 227px wide). */
const DESKTOP_MENU_CARD_HEIGHT_CLASS = 'h-[330px]';
const DESKTOP_MENU_CARD_META_TOP_CLASS = 'top-[215px]';
const DESKTOP_MENU_CARD_TITLE_TOP_CLASS = 'top-[239px]';
const DESKTOP_MENU_CARD_PRICE_TOP_CLASS = 'top-[282px]';
const DESKTOP_MENU_CARD_COMPARE_PRICE_TOP_CLASS = 'top-[308px]';
const DESKTOP_MENU_CARD_IMAGE_FRAME_CLASS =
  'relative mx-auto mt-1 h-[180px] w-[calc(100%-10px)]';

/** Debounce before writing search to the URL (server refetch); avoids one request per key. */
const SEARCH_QUERY_URL_DEBOUNCE_MS = 250;
/** Debounce min/max price URL updates (same reason as search). */
const PRICE_FILTER_URL_DEBOUNCE_MS = 300;

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
  /** When false, skips desktop section render (used on mobile to reduce hydration/DOM cost). */
  renderDesktopLayout?: boolean;
  /** When categories are omitted server-side (mobile product list), still show the picker button. */
  showCategoryPicker?: boolean;
};

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
  const priceUrlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (priceUrlDebounceRef.current) {
        clearTimeout(priceUrlDebounceRef.current);
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

  const schedulePriceFilterUrlSync = useCallback(
    (overrides: {
      minPrice?: string;
      maxPrice?: string;
      taste?: 'leaf' | 'neutral' | 'pepper';
    }) => {
      if (priceUrlDebounceRef.current) {
        clearTimeout(priceUrlDebounceRef.current);
      }
      priceUrlDebounceRef.current = setTimeout(() => {
        priceUrlDebounceRef.current = null;
        const d = menuFilterRouteRef.current;
        router.replace(
          d.buildTargetPath(d.activeCategorySlug, {
            minPrice: overrides.minPrice ?? d.minPrice,
            maxPrice: overrides.maxPrice ?? d.maxPrice,
            taste: overrides.taste ?? d.foodFilter,
          })
        );
      }, PRICE_FILTER_URL_DEBOUNCE_MS);
    },
    [router]
  );

  return { scheduleSearchQueryUrlSync, flushSearchQueryUrlSync, schedulePriceFilterUrlSync };
}

function useBuildMenuTargetPath(
  searchParams: ReturnType<typeof useSearchParams>,
  searchTerm: string,
  minPrice: string,
  maxPrice: string,
  foodFilter: 'leaf' | 'neutral' | 'pepper',
  routeBasePath: string
): BuildMenuTargetPathFn {
  return useMemo(() => {
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

      if (isStorefrontAllCategorySlug(categorySlug)) {
        params.set('category', STOREFRONT_ALL_CATEGORY_SLUG);
      } else if (categorySlug) {
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

function MenuCardItemBase({ card }: { card: MenuCard }) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist(card.id);
  const title = card.title || (card.titleKey ? t(card.titleKey) : '');
  const category = card.category || (card.categoryKey ? t(card.categoryKey) : '');
  const imageSrc = resolveStorefrontProductImage(card.image);
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
  const showStrikethroughPrice = shouldShowMenuCardStrikethroughPrice(card.price, card.oldPrice);
  const discountText = hasDiscount ? `-${effectiveDiscountPercent}%` : '';
  const productHref = `/products/${card.slug}`;
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: card.id,
    productSlug: card.slug,
    inStock: card.inStock ?? true,
    defaultVariantId: card.defaultVariantId ?? undefined,
    price: card.price,
    title,
    image: card.image ?? imageSrc,
  });
  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const cardRoot = button.closest('[data-home-product-card]');
    const origin =
      (cardRoot?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: resolveStorefrontProductImage(card.image) });
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

  const visibilityRef = usePrefetchProductWhenVisible(card.slug);
  const displayRating = card.rating ?? 5;
  const previewSummary = createProductPreviewSummary({
    id: card.id,
    slug: card.slug,
    title,
    image: imageSrc,
    price: convertPrice(card.price, 'USD', currency),
    oldPrice: showStrikethroughPrice ? convertPrice(card.oldPrice, 'USD', currency) : null,
    discount: hasDiscount ? effectiveDiscountPercent : null,
    category: null,
    rating: displayRating,
    currency,
    inStock: card.inStock ?? true,
    defaultVariantId: card.defaultVariantId ?? null,
  });
  const warmProductRoute = useCallback(() => {
    prefetchProductRoute(router, card.slug);
  }, [router, card.slug]);

  return (
    <article
      ref={visibilityRef}
      data-home-product-card
      className={`relative ${DESKTOP_MENU_CARD_HEIGHT_CLASS} w-full shrink-0 cursor-pointer rounded-[20px] border-[1.5px] border-[#dedede] bg-white transition-colors ${FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS} hover:shadow-md`}
      onMouseEnter={warmProductRoute}
      onFocus={warmProductRoute}
      onPointerDown={warmProductRoute}
      onTouchStart={warmProductRoute}
    >
      <StorefrontProductOverlayLink slug={card.slug} label={title} preview={previewSummary} />
      <div className={DESKTOP_MENU_CARD_IMAGE_FRAME_CLASS}>
        <div data-product-fly-origin className="h-full w-full overflow-hidden rounded-[20px]">
          <HomeOptimizedImage
            src={imageSrc}
            alt={title}
            fill
            className="h-full w-full rounded-[20px] object-cover"
            sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, 50vw"
            loading="lazy"
          />
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
          className={`absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-md sm:h-10 sm:w-10 ${PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS} ${getProductCardWishlistHoverClasses(isInWishlist)} ${
            isInWishlist
              ? 'border-red-600 bg-red-600 text-white'
              : 'border-[#dedede]/90 bg-white/95 text-gray-700'
          }`}
          title={
            isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')
          }
          aria-label={
            isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
          }
        >
          <span className={PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS} aria-hidden>
            <WishlistHeartIcon filled={isInWishlist} size={18} />
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart || (card.inStock === false)}
        aria-label={t('common.buttons.addToCart')}
        className={`absolute -bottom-[25px] left-1/2 z-20 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center disabled:opacity-50 ${PRODUCT_CARD_CART_BTN_HOVER_CLASS}`}
      >
        <img src={assets.productCardAddToCart} alt="" className="h-[52px] w-[51px] object-contain" />
      </button>
      <div className={`absolute left-[14px] ${DESKTOP_MENU_CARD_META_TOP_CLASS} flex items-center gap-[6px]`}>
        <img src={assets.productCardStar} alt="" className="h-5 w-5 object-contain" />
        <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">
          {displayRating.toFixed(1)}
        </p>
      </div>
      <div className={`absolute left-[14px] right-[100px] ${DESKTOP_MENU_CARD_TITLE_TOP_CLASS} min-w-0`}>
        <h3 className="text-base font-bold leading-[1.05] text-[#3c2f2f]">
          <span className="block max-h-[34px] overflow-hidden break-words">{title}</span>
        </h3>
        {category ? (
          <p className="mt-1 truncate text-base font-medium leading-[1.2] text-[#a1a1a1]">{category}</p>
        ) : null}
      </div>
      {hasDiscount ? (
        <span className={`absolute right-px ${DESKTOP_MENU_CARD_META_TOP_CLASS} inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black`}>
          {discountText}
        </span>
      ) : null}
      <p className={`absolute right-[14px] ${DESKTOP_MENU_CARD_PRICE_TOP_CLASS} text-[20px] font-black leading-none text-[#3c2f2f]`}>{formatPrice(card.price, currency)}</p>
      {showStrikethroughPrice ? (
        <p className={`absolute right-[14px] ${DESKTOP_MENU_CARD_COMPARE_PRICE_TOP_CLASS} text-sm font-light leading-none text-[#3c2f2f] line-through`}>
          {formatPrice(card.oldPrice, currency)}
        </p>
      ) : null}
    </article>
  );
}

const MenuCardItem = memo(MenuCardItemBase);

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
        className="pointer-events-none absolute left-[6px] top-1/2 z-20 inline-flex h-[28px] w-[28px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm transition-transform duration-200"
        style={{ transform: `translate(${selectedIndex * 38}px, -50%)` }}
      >
        {selectedOption === 'leaf' ? (
          <img src={assets.switcherLeafRibbon} alt="" className="h-[28px] w-[28px] object-contain" />
        ) : null}
        {selectedOption === 'neutral' ? (
          <svg
            className="h-[14px] w-[14px] text-[#b5b5b8]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : null}
        {selectedOption === 'pepper' ? (
          <img
            src={assets.switcherPepper}
            alt=""
            className="h-[18px] w-[18px] -rotate-[13deg] object-contain"
          />
        ) : null}
      </span>

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
  renderDesktopLayout = true,
  showCategoryPicker,
}: DesktopMenuPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuCards = cards ?? [];
  const hasDbCategories =
    showCategoryPicker ?? (Array.isArray(dbCategories) && dbCategories.length > 0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [foodFilter, setFoodFilter] = useState<'leaf' | 'neutral' | 'pepper'>(initialFoodFilter);
  const routeBasePath = pathname?.startsWith('/combo') ? '/combo' : '/shop';
  const enableSoftCategoryNav = routeBasePath === '/shop' || routeBasePath === '/combo';

  useEffect(() => {
    setSearchTerm(initialSearch);
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
    setFoodFilter(initialFoodFilter);
  }, [initialFoodFilter, initialMaxPrice, initialMinPrice, initialSearch]);

  const {
    displayCards: desktopDisplayCards,
    displayActiveCategorySlug,
    displayPagination: desktopDisplayPagination,
    isProductsPending,
    navigateCategory,
    prefetchCategory,
  } = useShopCategorySoftNav({
    initialCards: menuCards,
    initialActiveCategorySlug: activeCategorySlug,
    initialPagination: menuPagination,
    enabled: enableSoftCategoryNav,
  });

  const desktopMenuCards = enableSoftCategoryNav ? desktopDisplayCards : menuCards;
  const desktopActiveCategorySlug = enableSoftCategoryNav
    ? displayActiveCategorySlug
    : activeCategorySlug;
  const desktopMenuPagination = enableSoftCategoryNav ? desktopDisplayPagination : menuPagination;

  useEffect(() => {
    if (!showMobileProductsList || searchParams.get('openFilters') !== '1') {
      return;
    }
    document.getElementById(MOBILE_STOREFRONT_FILTERS_ANCHOR_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [searchParams, showMobileProductsList]);

  const buildTargetPath = useBuildMenuTargetPath(
    searchParams,
    searchTerm,
    minPrice,
    maxPrice,
    foodFilter,
    routeBasePath
  );

  const { scheduleSearchQueryUrlSync, flushSearchQueryUrlSync, schedulePriceFilterUrlSync } =
    useMenuSearchUrlSync(
      router,
      buildTargetPath,
      activeCategorySlug,
      minPrice,
      maxPrice,
      foodFilter
    );

  const categoryNavItems = useMemo(() => {
    if (!Array.isArray(dbCategories)) {
      return [];
    }
    return dbCategories.map((category) => ({
      category,
      href: buildTargetPath(category.slug),
    }));
  }, [buildTargetPath, dbCategories]);

  const categoryNavHrefs = useMemo(
    () => categoryNavItems.map((item) => item.href),
    [categoryNavItems]
  );

  const { getPrefetchHandlers } = useRoutePrefetch(
    enableSoftCategoryNav ? [] : categoryNavHrefs
  );

  const openMobileCategoryPicker = useCallback(() => {
    router.push(routeBasePath);
  }, [router, routeBasePath]);

  return (
    <>
      {showMobileProductsList ? (
      <div className="pb-8 pt-0 lg:hidden">
        <div className={MOBILE_STOREFRONT_PAGE_SECTION_CLASS}>
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
            <MobileFriendlyInput
              type="number"
              min={0}
              inputMode="numeric"
              value={minPrice}
              onChange={(event) => {
                const nextMinPrice = event.target.value;
                setMinPrice(nextMinPrice);
                schedulePriceFilterUrlSync({ minPrice: nextMinPrice });
              }}
              placeholder={t('home.figma.desktop.shop.priceFrom')}
              className="h-[46px] min-w-0 flex-1 rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80] sm:flex-none sm:basis-[109px]"
            />
            <MobileFriendlyInput
              type="number"
              min={0}
              inputMode="numeric"
              value={maxPrice}
              onChange={(event) => {
                const nextMaxPrice = event.target.value;
                setMaxPrice(nextMaxPrice);
                schedulePriceFilterUrlSync({ maxPrice: nextMaxPrice });
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

      {renderDesktopLayout ? (
      <div className="hidden bg-white pb-20 pt-5 lg:block">
        <div className={`${STOREFRONT_DESKTOP_SHOP_SECTION_CLASS} flex min-w-0 ${STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS}`}>
        <aside className={`${UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS} ${STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS} flex-col overflow-hidden rounded-[20px] bg-black pb-5 text-white`}>
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
              {categoryNavItems.length > 0
                ? categoryNavItems.map(({ category, href }) => {
                    const isActive =
                      category.slug === ''
                        ? isStorefrontAllCategorySlug(desktopActiveCategorySlug)
                        : desktopActiveCategorySlug === category.slug;
                    const empty = isMenuCategoryEmpty(category);
                    const sharedClassName = `flex h-10 w-full min-w-0 items-center gap-2 rounded-[10px] px-3 py-[10px] text-left text-[14px] font-medium leading-5 tracking-[-0.15px] ${
                      isActive ? 'rounded-[30px] bg-[#ff7f20] text-white' : 'text-white hover:bg-white/10'
                    } ${empty ? 'cursor-not-allowed' : ''} ${
                      empty && !isActive ? 'opacity-50 hover:bg-transparent' : ''
                    }`;

                    if (empty) {
                      return (
                        <span
                          key={category.id}
                          aria-disabled="true"
                          className={sharedClassName}
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                            {category.iconUrl ? <img src={category.iconUrl} alt="" className="h-6 w-6 object-contain" /> : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{formatCategoryLabelWithCount(category)}</span>
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
                            navigateCategory(href, category.slug);
                          }}
                          onMouseEnter={() => prefetchCategory(href)}
                          onFocus={() => prefetchCategory(href)}
                          onPointerDown={() => prefetchCategory(href)}
                          onTouchStart={() => prefetchCategory(href)}
                          aria-current={isActive ? 'page' : undefined}
                          className={sharedClassName}
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                            {category.iconUrl ? <img src={category.iconUrl} alt="" className="h-6 w-6 object-contain" /> : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{formatCategoryLabelWithCount(category)}</span>
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
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                          {category.iconUrl ? <img src={category.iconUrl} alt="" className="h-6 w-6 object-contain" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{formatCategoryLabelWithCount(category)}</span>
                      </Link>
                    );
                  })
                : (
                    <p className="px-1 py-2 text-sm text-white/60">{t('home.featured_products.noProducts')}</p>
                  )}
            </div>
          </div>
        </aside>

        <section className={STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS}>
          <div className="mb-[42px] mt-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 pt-1">
              <h1 className="text-4xl font-bold leading-tight text-[#f66913] xl:text-[60px] xl:leading-[51px]">{t(titleKey)}</h1>
              <p className="mt-2.5 text-base tracking-[-0.31px] text-[#717182]">
                {t(subtitleKey)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#717182] xl:pt-[37px]">
              <span className="w-full shrink-0 px-1 text-base xl:w-auto">{t('home.figma.desktop.shop.priceLabel')}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={minPrice}
                onChange={(event) => {
                  const nextMinPrice = event.target.value;
                  setMinPrice(nextMinPrice);
                  schedulePriceFilterUrlSync({ minPrice: nextMinPrice });
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
                  schedulePriceFilterUrlSync({ maxPrice: nextMaxPrice });
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

          {isProductsPending ? (
            <ShopDesktopProductsSkeleton />
          ) : desktopMenuCards.length > 0 ? (
            <div className={STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS}>
              {desktopMenuCards.map((card) => (
                <MenuCardItem key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-[20px] border border-dashed border-[#d4d4d8] bg-[#fafafc] px-6 text-center text-[18px] font-medium text-[#717182]">
              {t('common.messages.noProductsFound')}
            </div>
          )}

          {desktopMenuPagination ? (
            <StoreMenuPagination
              navAriaLabel={t('common.ariaLabels.paginationNav')}
              currentPage={desktopMenuPagination.currentPage}
              totalPages={desktopMenuPagination.totalPages}
              buildPageHref={(targetPage) =>
                buildTargetPath(desktopActiveCategorySlug, { page: targetPage })
              }
            />
          ) : null}
        </section>
      </div>
    </div>
      ) : null}
    </>
  );
}

export type { MenuCard, MenuCategory } from './menu-types';

