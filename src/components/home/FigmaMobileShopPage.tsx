'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LanguageCurrencySwitcher } from '../LanguageCurrencySwitcher';
import { useTranslation } from '../../lib/i18n-client';

type ShopCategoryCard = {
  id: string;
  titleKey: string;
  image: string;
  categorySlug: string;
};

const mobileShopAssets = {
  logo: '/api/r2/logo/20260512-lLuzJZar2z.png',
  callCircle: '/api/r2/assets/20260512-WB-BU3QlP-.svg',
  callIcon: '/api/r2/icons/20260512-dVgQEhScab.svg',
  switcherIcon: '/api/r2/icons/20260512-I4ssJ5cKId.svg',
  switcherArrow: '/api/r2/assets/20260512-yevMtsLhrq.svg',
  searchIcon: '/api/r2/icons/20260512-emARdDawmN.svg',
  searchFilterButton: '/api/r2/search/20260512-Ye216FAl_f.svg',
  soup: '/api/r2/assets/20260512-AQ7ex5ejKk.png',
  shawarma: '/api/r2/assets/20260512-plUR8fm4WB.png',
  salad: '/api/r2/assets/20260512-mjMgqeHOCf.png',
};

const shopCategories: ShopCategoryCard[] = [
  { id: 'cat-soup', titleKey: 'home.figma.mobile.shopCategory.soup', image: mobileShopAssets.soup, categorySlug: 'soup' },
  { id: 'cat-salad', titleKey: 'home.figma.mobile.shopCategory.salad', image: mobileShopAssets.salad, categorySlug: 'salad' },
  { id: 'cat-shawarma', titleKey: 'home.figma.mobile.shopCategory.shawarma', image: mobileShopAssets.shawarma, categorySlug: 'shawarma' },
];

const repeatedShopCards: ShopCategoryCard[] = Array.from({ length: 4 }, (_, index) =>
  shopCategories.map((category) => ({
    ...category,
    id: `${category.id}-${index}`,
  }))
).flat();

export function FigmaMobileShopPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const handleOpenProducts = (categorySlug: string) => {
    router.push(`/shop?category=${encodeURIComponent(categorySlug)}`);
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[393px] overflow-hidden bg-[#f66a13]">
      <div className="absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D]" />
      <div className="absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D]" />

      <header className="relative z-10 px-[11px] pt-[58px]">
        <div className="flex translate-y-[20px] items-start justify-between">
          <img src={mobileShopAssets.logo} alt="Degusto" className="h-[46px] w-[129px] object-contain" />
          <div className="flex items-center gap-1">
            <button type="button" className="relative inline-flex h-12 w-12 items-center justify-center">
              <img src={mobileShopAssets.callCircle} alt="" className="absolute inset-0 h-12 w-12 object-contain" />
              <img src={mobileShopAssets.callIcon} alt={t('home.figma.mobile.callButtonAria')} className="relative h-[23px] w-[23px] object-contain" />
            </button>
            <LanguageCurrencySwitcher
              variant="mobile"
              iconSrc={mobileShopAssets.switcherIcon}
              arrowSrc={mobileShopAssets.switcherArrow}
            />
          </div>
        </div>
        <div className="relative mt-[8px] h-12 translate-y-[20px] rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]">
          <img src={mobileShopAssets.searchIcon} alt="" className="absolute left-[15px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 object-contain" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            placeholder={t('common.buttons.search')}
            className="h-full w-full rounded-[30px] bg-transparent pl-[39px] pr-[58px] text-[15px] leading-6 text-black outline-none placeholder:text-[#abb7c2]"
          />
          <button type="button" className="absolute right-[7px] top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center">
            <img src={mobileShopAssets.searchFilterButton} alt={t('products.header.filters')} className="h-10 w-10 object-contain" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mt-[87px] rounded-t-[30px] bg-[#e7e7e7] px-[15px] pb-[130px] pt-[22px]">
        <h1 className="text-base font-semibold leading-5 text-black">{t('common.navigation.categories')}</h1>

        <div className="mt-4 grid grid-cols-2 gap-x-[12px] gap-y-[14px]">
          {repeatedShopCards.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                handleOpenProducts(category.categorySlug);
              }}
              className="relative h-[183px] overflow-hidden rounded-[28px] bg-[#090909] text-left"
            >
              <p className="absolute left-[13px] top-[20px] right-[10px] text-xs font-medium leading-[18px] text-white">{t(category.titleKey)}</p>
              <img src={category.image} alt={t(category.titleKey)} className="absolute bottom-0 right-0 h-[130px] w-[132px] object-contain" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
