'use client';

import { useTranslation } from '../../lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../../lib/currency';

const assets = {
  productCardImage: '/api/r2/product/20260512-D3w_teddze.png',
  productCardAddToCart: '/api/r2/product/20260512-g67zkm13ZH.svg',
  productCardHot: 'https://www.figma.com/api/mcp/asset/fc4ede25-e0a0-40c4-9e90-1108955e5111',
  productCardRibbon: '/api/r2/product/20260512-lmzrYlGD39.svg',
  productCardStar: '/api/r2/product/20260512-7jf6Wihrew.svg',
  switcherLeafRibbon: 'https://www.figma.com/api/mcp/asset/c35852c7-d37b-4ae3-bce2-6cff1c8c6763',
  switcherPepper: 'https://www.figma.com/api/mcp/asset/b55ba537-950b-4307-b788-dd50e7b74c43',
};

type MenuCard = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  price: number;
  oldPrice: number;
  discount: string;
};

type DesktopMenuPageProps = {
  titleKey: string;
  subtitleKey: string;
  activeCategoryIndex: number;
};

const categories = [
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

const cards: MenuCard[] = Array.from({ length: 12 }, (_, index) => ({
  id: `menu-card-${index + 1}`,
  titleKey: 'home.figma.mobile.product.title',
  subtitleKey: 'home.figma.mobile.product.subtitle',
  price: 1200,
  oldPrice: 1200,
  discount: '-30%',
}));

function MenuCardItem({ card }: { card: MenuCard }) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const title = t(card.titleKey);
  const subtitle = t(card.subtitleKey);

  return (
    <article className="relative h-[284px] w-[236px] shrink-0 rounded-[20px] border-[1.5px] border-[#dedede] bg-white">
      <div className="absolute left-1/2 top-1 h-[147px] w-[227px] -translate-x-1/2">
        <img src={assets.productCardImage} alt={title} className="h-full w-full rounded-[18px] object-cover" />
      </div>
      <div className="absolute left-4 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2b2e] p-1">
        <img src={assets.productCardHot} alt="" className="h-[19px] w-[19px] -rotate-[13deg] object-contain" />
      </div>
      <div className="absolute left-4 top-[58px] flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
        <img src={assets.productCardRibbon} alt="" className="h-8 w-8 scale-110 object-cover" />
      </div>
      <div className="absolute left-[14px] top-[170px] flex items-center gap-[6px]">
        <img src={assets.productCardStar} alt="" className="h-5 w-5 object-contain" />
        <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>
      <h3 className="absolute left-[14px] top-[194px] w-[130px] text-base font-bold leading-[1.05] text-[#3c2f2f]">
        <span className="block max-h-[34px] overflow-hidden break-words">{title}</span>
      </h3>
      <p className="absolute left-[14px] top-[236px] w-[130px] overflow-visible text-base font-medium leading-[1.2] text-[#a1a1a1]">{subtitle}</p>
      <span className="absolute right-px top-[170px] inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black">
        {card.discount}
      </span>
      <p className="absolute right-[14px] top-[236px] text-[20px] font-black leading-none text-[#3c2f2f]">{formatPrice(card.price, currency)}</p>
      <p className="absolute right-[14px] top-[262px] text-sm font-light leading-none text-[#3c2f2f] line-through">{formatPrice(card.oldPrice, currency)}</p>
      <button
        type="button"
        aria-label={t('common.buttons.addToCart')}
        className="absolute -bottom-[25px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center"
      >
        <img src={assets.productCardAddToCart} alt="" className="h-[52px] w-[51px] object-contain" />
      </button>
    </article>
  );
}

function FoodAttributeSwitcher() {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-label={t('home.figma.desktop.shop.foodAttributeSwitcherAria')}
      className="relative flex h-[46px] w-[120px] items-center gap-[6px] rounded-[40px] bg-[#f3f3f5] px-[4px]"
    >
      <span className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-full">
        <img src={assets.switcherLeafRibbon} alt="" className="h-[32px] w-[32px] object-contain" />
      </span>
      <span className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ececef] text-[22px] font-bold text-[#b5b5b8]">
        ×
      </span>
      <span className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ff2b2e]">
        <img src={assets.switcherPepper} alt="" className="h-[19px] w-[19px] -rotate-[13deg] object-contain" />
      </span>
    </button>
  );
}

export function FigmaDesktopMenuPage({ titleKey, subtitleKey, activeCategoryIndex }: DesktopMenuPageProps) {
  const { t } = useTranslation();

  return (
    <div className="hidden bg-white pb-20 pt-5 lg:block">
      <div className="mx-auto flex w-full max-w-[1470px] gap-8 px-3">
        <aside className="sticky top-5 flex h-[calc(100vh-40px)] w-[320px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-black pb-5 text-white">
          <div className="border-b border-white/10 p-6">
            <div className="relative flex h-[46px] items-center rounded-[40px] bg-[#f3f3f5] pl-10 pr-4 text-[16px] text-black/50">
              <span className="absolute left-4 text-[#7f7f80]" aria-hidden="true">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span>{t('common.buttons.search')}...</span>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-6 pt-[10px]">
            <p className="pb-[12px] text-[14px] font-medium uppercase tracking-[0.2px] text-[#717182]">{t('common.navigation.categories')}</p>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-hide">
              {categories.map((categoryKey, index) => {
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
              <button
                type="button"
                className="h-[46px] w-[109px] rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
              >
                | {t('home.figma.desktop.shop.priceFrom')}
              </button>
              <button
                type="button"
                className="h-[46px] w-[109px] rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
              >
                | {t('home.figma.desktop.shop.priceTo')}
              </button>
              <FoodAttributeSwitcher />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-x-[30px] gap-y-[34px]">
            {cards.map((card) => (
              <MenuCardItem key={card.id} card={card} />
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button type="button" className="rounded-[40px] bg-[#ff7f20] px-8 py-4 text-base font-bold text-white">
              {t('home.figma.desktop.shop.moreButton')} →
            </button>
          </div>
        </section>
      </div>
    </div>
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
