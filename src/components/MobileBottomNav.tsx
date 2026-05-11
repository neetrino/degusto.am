'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Home, Search, UserRound, Store, X } from 'lucide-react';
import { getCompareCount, getWishlistCount } from '../lib/storageCounts';
import { CartIcon } from './icons/CartIcon';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';

interface MobileNavItem {
  key: 'home' | 'wishlist' | 'shop' | 'cart' | 'account';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  onClick?: (_event: React.MouseEvent<HTMLAnchorElement>) => void;
  badge?: 'wishlist' | 'compare';
  visible?: boolean;
}

interface TopCategoryItem {
  id: string;
  slug: string;
  title: string;
  productCount: number;
  image: string | null;
}

interface TopCategoriesResponse {
  data: TopCategoryItem[];
}

/**
 * Ստեղծում է հաստատուն mobile նավիգացիոն վահանակ՝ էջի ներքևում,
 * որպեսզի հիմնական գործողությունները միշտ լինեն ձեռքի տակ փոքր էկրաններում։
 */
export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [showShopCategories, setShowShopCategories] = useState(false);
  const [shopCategories, setShopCategories] = useState<TopCategoryItem[]>([]);
  const [shopCategoriesLoading, setShopCategoriesLoading] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  useEffect(() => {
    const updateCounts = () => {
      const wishlist = getWishlistCount();
      const compare = getCompareCount();
      console.debug('[MobileBottomNav] wishlist/compare counts refreshed', { wishlist, compare });
      setWishlistCount(wishlist);
      setCompareCount(compare);
    };

    updateCounts();
    window.addEventListener('wishlist-updated', updateCounts);
    window.addEventListener('compare-updated', updateCounts);

    return () => {
      window.removeEventListener('wishlist-updated', updateCounts);
      window.removeEventListener('compare-updated', updateCounts);
    };
  }, []);

  useEffect(() => {
    if (!showShopCategories) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showShopCategories]);

  useEffect(() => {
    setShowShopCategories(false);
    setCategorySearchQuery('');
  }, [pathname]);

  useEffect(() => {
    if (!showShopCategories || shopCategories.length > 0 || shopCategoriesLoading) {
      return;
    }

    const fetchTopCategories = async () => {
      try {
        setShopCategoriesLoading(true);
        const language = getStoredLanguage();
        const response = await apiClient.get<TopCategoriesResponse>('/api/v1/categories/top', {
          params: { lang: language, limit: '12' },
        });
        setShopCategories(response.data || []);
      } catch {
        setShopCategories([]);
      } finally {
        setShopCategoriesLoading(false);
      }
    };

    fetchTopCategories();
  }, [showShopCategories, shopCategories.length, shopCategoriesLoading]);

  const navItems: MobileNavItem[] = useMemo(
    () => [
      { 
        key: 'home',
        label: 'Home', 
        href: '/', 
        icon: Home, 
        visible: true,
      },
      {
        key: 'wishlist',
        label: 'Wishlist',
        href: '/wishlist',
        icon: Heart,
        visible: true,
        badge: 'wishlist',
      },
      // Shop with Store icon
      { 
        key: 'shop',
        label: 'Shop', 
        href: '/products', 
        icon: Store, 
        visible: true,
        action: () => setShowShopCategories(true),
      },
      // On mobile we show Cart instead of Wishlist
      { 
        key: 'cart',
        label: 'Cart', 
        href: '/cart', 
        icon: CartIcon, 
        visible: true,
      },
      { key: 'account', label: 'My account', href: '/profile', icon: UserRound, visible: true },
    ],
    []
  );

  const resolveBadgeValue = (badge?: MobileNavItem['badge']) => {
    if (badge === 'wishlist') return wishlistCount;
    if (badge === 'compare') return compareCount;
    return 0;
  };

  const filteredShopCategories = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) {
      return shopCategories;
    }
    return shopCategories.filter((category) => category.title.toLowerCase().includes(query));
  }, [shopCategories, categorySearchQuery]);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[70] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 py-2">
          {navItems.filter(item => item.visible).map(({ key, label, href, icon: Icon, badge, action, onClick }) => {
            const isActive = key === 'shop' ? pathname?.startsWith('/products') : href ? pathname === href : false;
            const isShopItem = key === 'shop';
          const badgeValue = resolveBadgeValue(badge);
          const slotClass =
            key === 'home'
              ? 'col-start-1'
              : key === 'wishlist'
                ? 'col-start-2'
              : key === 'shop'
                ? 'col-start-3'
                : key === 'cart'
                  ? 'col-start-4'
                  : 'col-start-5';

          const defaultContent = (
            <>
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                {badgeValue > 0 && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {badgeValue > 99 ? '99+' : badgeValue}
                  </span>
                )}
              </div>
            </>
          );
          const shopContent = (
            <>
              <div
                className={`relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-lg transition ${
                  isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                <Icon className="h-6 w-6" />
                {badgeValue > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {badgeValue > 99 ? '99+' : badgeValue}
                  </span>
                )}
              </div>
            </>
          );

            if (action) {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  aria-label={label}
                  className={`flex flex-col items-center rounded-xl px-2 py-1 text-xs font-medium text-gray-500 transition ${slotClass}`}
                >
                  {isShopItem ? shopContent : defaultContent}
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={href || '#'}
                onClick={onClick}
                aria-label={label}
                className={`flex flex-col items-center rounded-xl px-2 py-1 text-xs font-medium transition ${slotClass} ${
                  isActive ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {isShopItem ? shopContent : defaultContent}
              </Link>
            );
          })}
        </div>
      </nav>
      {showShopCategories && (
        <div className="fixed inset-x-0 top-0 bottom-16 z-[60] bg-gray-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shop categories"
            className="mx-auto flex h-full w-full max-w-md flex-col border-x border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">Categories</h3>
              <button
                type="button"
                onClick={() => setShowShopCategories(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600"
                aria-label="Close categories"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-gray-100 px-4 py-3">
              <label htmlFor="category-search" className="sr-only">
                Search categories
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  id="category-search"
                  type="text"
                  value={categorySearchQuery}
                  onChange={(event) => setCategorySearchQuery(event.target.value)}
                  placeholder="Search category..."
                  className="h-10 w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-5 pt-4">
              {shopCategoriesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
                  ))}
                </div>
              ) : filteredShopCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredShopCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setShowShopCategories(false);
                        router.push(`/products?category=${category.slug}`);
                      }}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-24 w-full bg-gray-100">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 200px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Store className="h-7 w-7" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{category.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{category.productCount} products</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : categorySearchQuery.trim().length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No categories found for &quot;{categorySearchQuery}&quot;.
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Categories are not available right now.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

