'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileBottomNavigation } from './MobileBottomNavigation';

const mobileAssets = {
  logo: 'https://www.figma.com/api/mcp/asset/345dbbe4-761a-42f0-a554-83511545e58f',
  callCircle: 'https://www.figma.com/api/mcp/asset/6e5427f2-82d9-4267-bf64-e2e1cdd09e9b',
  callIcon: 'https://www.figma.com/api/mcp/asset/c5d3f7df-e8d0-40ec-b0ad-e06adf1ce60d',
  switcherIcon: 'https://www.figma.com/api/mcp/asset/26c63489-fc7c-4b7f-87a2-9156705f7f6e',
  switcherArrow: 'https://www.figma.com/api/mcp/asset/cbe85ed1-d7c5-4189-a5b8-7ec3b3f7eb3c',
  searchIcon: 'https://www.figma.com/api/mcp/asset/33aead96-ecde-46e9-b86e-3871b7928d56',
  searchFilterButton: 'https://www.figma.com/api/mcp/asset/bb3e616c-ab0d-4f42-9ccb-45c0daf71d51',
  categoryFrame: 'https://www.figma.com/api/mcp/asset/e6ab91ee-c554-4ff9-8716-61d688f31921',
  categoryPizza: 'https://www.figma.com/api/mcp/asset/45b6df3c-de24-4094-9603-809303ac5371',
  categoryBurger: 'https://www.figma.com/api/mcp/asset/b87e3da9-7760-44e7-9560-1b92ab4cff79',
  categorySushi: 'https://www.figma.com/api/mcp/asset/92df6362-18fd-44d6-a7a2-d4996b17398c',
  categorySalad: 'https://www.figma.com/api/mcp/asset/cb141394-f9bf-4427-9c24-b7258be01570',
  categorySoup: 'https://www.figma.com/api/mcp/asset/bbcd35c6-b0ad-4ad7-a67c-71da195898a4',
  dailyOfferBackground: 'https://www.figma.com/api/mcp/asset/943101db-4a65-4e6d-bf66-6fd22a7c0515',
  dailyOfferPizza: 'https://www.figma.com/api/mcp/asset/2385d899-004b-413a-8bb1-db7bf1ab8443',
  dailyOfferAddToCart: 'https://www.figma.com/api/mcp/asset/618da678-71ef-4456-b3eb-a581c63c4d39',
  productImage: 'https://www.figma.com/api/mcp/asset/42c59295-49ab-4335-a7fc-abc3c930ab8b',
  productHot: 'https://www.figma.com/api/mcp/asset/d3818424-732e-4339-86bd-d38d53ca5b36',
  productRibbon: 'https://www.figma.com/api/mcp/asset/5e9022a2-a5e8-40f7-8cbb-7a6d689d340a',
  productStar: 'https://www.figma.com/api/mcp/asset/9715ab2d-3688-4517-865e-bfdb8d571cc4',
  productAddToCart: 'https://www.figma.com/api/mcp/asset/b1e84ae1-32b1-4057-8271-272a7b1b5987',
  bottomNavBackground: 'https://www.figma.com/api/mcp/asset/42fcf5e9-9d2a-4f0b-8ba7-1fb9cb942f84',
  bottomNavHome: 'https://www.figma.com/api/mcp/asset/ec1f8b32-6f07-44cb-bf3c-4f4428723b74',
  bottomNavCart: 'https://www.figma.com/api/mcp/asset/3798b9e8-749e-436f-88ea-54f995151037',
  bottomNavFavorite: 'https://www.figma.com/api/mcp/asset/6c3a6dc5-0e8a-4e4b-9be5-232fbb64f680',
  bottomNavProfile: 'https://www.figma.com/api/mcp/asset/f216ca33-15bf-4919-aacd-0b70efa73c4f',
  bottomNavShop: 'https://www.figma.com/api/mcp/asset/a8e79a53-32fb-4097-b70c-db2e78c5ce1b',
};

type MobileCategory = {
  id: string;
  title: string;
  image: string;
  framed?: boolean;
};

type MobileProduct = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  oldPrice: string;
};

const mobileCategories: MobileCategory[] = [
  { id: 'pizza', title: 'Պիցցա', image: mobileAssets.categoryPizza, framed: true },
  { id: 'burger', title: 'Բուրգեր', image: mobileAssets.categoryBurger },
  { id: 'sushi', title: 'Սուշի', image: mobileAssets.categorySushi },
  { id: 'salad', title: 'Աղցան', image: mobileAssets.categorySalad },
  { id: 'soup', title: 'Ապուր', image: mobileAssets.categorySoup },
];

const mobileProducts: MobileProduct[] = Array.from({ length: 12 }, (_, index) => ({
  id: `mobile-product-${index + 1}`,
  title: 'Double Cheeseburger',
  subtitle: 'Բուրգեր',
  price: '1200 ֏',
  oldPrice: '1200 ֏',
}));

function MobileSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold leading-5 text-black">{title}</h2>
      <Link href="/products" className="text-base font-bold leading-6 text-[#f66a13]">
        Ավելին {'>'}
      </Link>
    </div>
  );
}

function MobileCategoryStrip() {
  return (
    <div className="space-y-3">
      <MobileSectionHeader title="Կատեգորիաներ" />
      <div className="grid grid-cols-5 gap-2 pb-1">
        {mobileCategories.map((category) => (
          <article key={category.id} className="min-w-0">
            <div className="relative mx-auto flex h-[72px] w-[48px] items-center justify-center rounded-[24px] bg-[#090909]">
              {category.framed ? (
                <img src={mobileAssets.categoryFrame} alt="" className="absolute inset-0 h-full w-full object-contain" />
              ) : null}
              <img src={category.image} alt={category.title} className="relative h-[42px] w-[40px] rounded-[10px] object-cover" />
            </div>
            <p className="mt-[6px] text-center text-xs leading-5 text-black">{category.title}</p>
          </article>
        ))}
      </div>
      <div className="pt-1">
        <MobileSliderIndicator />
      </div>
    </div>
  );
}

function MobileDailyOffer() {
  return (
    <article className="relative mx-auto h-32 w-[356px] overflow-hidden rounded-[20px]">
      <div className="absolute left-0 top-0 h-full w-[182px] bg-[#f66a13]" />
      <img src={mobileAssets.dailyOfferPizza} alt="Daily offer pizza" className="absolute right-0 top-0 h-full w-[174px] object-cover" />
      <h3 className="absolute left-[11px] top-[10px] text-[20px] font-bold leading-[21px] text-white">
        Օրվա
        <br />
        Առաջարկ
      </h3>
      <p className="absolute left-[11px] top-[57px] w-[102px] text-sm font-medium leading-[1.15] text-[rgba(255,255,255,0.89)]">
        Double Cheeseburger
      </p>
      <p className="absolute left-[11px] top-24 text-base font-black leading-none text-white">1200 ֏</p>
      <span className="absolute left-[255px] top-[15px] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-white text-xs font-bold text-black">
        -30%
      </span>
      <button type="button" className="absolute left-[128px] top-[76px] inline-flex h-[41.669px] w-[41.096px] items-center justify-center">
        <img src={mobileAssets.dailyOfferAddToCart} alt="Add to cart" className="h-[41.7px] w-[41.1px] object-contain" />
      </button>
    </article>
  );
}

function MobileProductCard({ product }: { product: MobileProduct }) {
  return (
    <article className="relative h-[248px] rounded-[20px] bg-[#ffeacc]">
      <div className="absolute left-1 right-1 top-[5px] h-[143px] overflow-hidden rounded-[18px]">
        <img src={mobileAssets.productImage} alt={product.title} className="h-full w-full object-cover" />
      </div>
      <div className="absolute left-[9px] top-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ff2b2e]">
        <img src={mobileAssets.productHot} alt="" className="h-[13px] w-[13px] -rotate-[13deg] object-contain" />
      </div>
      <img src={mobileAssets.productRibbon} alt="" className="absolute left-[9px] top-[38px] h-[22px] w-[22px] object-contain" />

      <div className="absolute left-[9px] top-[150px] flex items-center gap-1.5">
        <img src={mobileAssets.productStar} alt="" className="h-[19px] w-[19px] object-contain" />
        <p className="text-sm font-medium leading-none text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>

      <h3 className="absolute left-[9px] top-[172px] w-[118px] text-sm font-bold leading-[1.15] text-[#3c2f2f]">{product.title}</h3>
      <p className="absolute left-[9px] top-[209px] text-sm font-medium leading-none text-[#a1a1a1]">{product.subtitle}</p>

      <span className="absolute right-0 top-[112px] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-[#ff7f20] text-xs font-bold leading-none text-black">
        -30%
      </span>
      <p className="absolute right-2 top-[210px] text-base font-black leading-none text-[#3c2f2f]">{product.price}</p>
      <p className="absolute right-2 top-[226px] text-xs font-medium leading-none text-[#3c2f2f] line-through">{product.oldPrice}</p>

      <button type="button" className="absolute -bottom-[10px] left-1/2 inline-flex h-[42px] w-[42px] -translate-x-1/2 items-center justify-center">
        <img src={mobileAssets.productAddToCart} alt="Add to cart" className="h-[42px] w-[42px] object-contain" />
      </button>
    </article>
  );
}

function MobileSliderIndicator() {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ff7f20]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
    </div>
  );
}

function MobileCategorySliderIndicator() {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="h-1 w-5 rounded-[12px] bg-[#f66a13]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
    </div>
  );
}

export function FigmaHomePageMobile() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleOpenShopPicker = () => {
    router.push('/shop');
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[393px] overflow-hidden bg-[var(--project-color)]">
      <div className="absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D]" />
      <div className="absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D]" />

      <header className="relative z-10 px-[11px] pt-[58px]">
        <div className="flex translate-y-[20px] items-start justify-between">
          <img src={mobileAssets.logo} alt="Degusto" className="h-[46px] w-[129px] object-contain" />
          <div className="flex items-center gap-1">
            <button type="button" className="relative inline-flex h-12 w-12 items-center justify-center">
              <img src={mobileAssets.callCircle} alt="" className="absolute inset-0 h-12 w-12 object-contain" />
              <img src={mobileAssets.callIcon} alt="Call" className="relative h-[23px] w-[23px] object-contain" />
            </button>
            <button type="button" className="relative inline-flex h-12 w-[159px] items-center rounded-[70px] bg-white px-[19px]">
              <img src={mobileAssets.switcherIcon} alt="" className="h-[19px] w-[19px] object-contain" />
              <span className="ml-[2px] text-base font-bold leading-[18px] text-[#ff7f20]">EN / AMD</span>
              <img src={mobileAssets.switcherArrow} alt="" className="absolute right-[20px] h-[10px] w-[4px] rotate-90 object-contain" />
            </button>
          </div>
        </div>

        <div className="relative mt-[8px] h-12 translate-y-[20px] rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]">
          <img src={mobileAssets.searchIcon} alt="" className="absolute left-[15px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 object-contain" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            placeholder="Որոնել"
            className="h-full w-full rounded-[30px] bg-transparent pl-[39px] pr-[58px] text-[15px] leading-6 text-black outline-none placeholder:text-[#abb7c2]"
          />
          <button type="button" className="absolute right-[7px] top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center">
            <img src={mobileAssets.searchFilterButton} alt="Filters" className="h-10 w-10 object-contain" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mt-[87px] rounded-t-[30px] bg-white px-[19px] pb-[110px] pt-8">
        <MobileCategoryStrip />
        <div className="mt-[22px]">
          <MobileDailyOffer />
        </div>
        <div className="mt-[19px]">
          <MobileCategorySliderIndicator />
        </div>

        <div className="mt-[30px] space-y-[22px]">
          <MobileSectionHeader title="Նորույթներ" />
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
            {mobileProducts.slice(0, 4).map((product) => (
              <MobileProductCard key={`new-${product.id}`} product={product} />
            ))}
          </div>
        </div>

        <div className="mt-[30px] space-y-[22px]">
          <MobileSectionHeader title="Կատեգորիա" />
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
            {mobileProducts.slice(4, 8).map((product) => (
              <MobileProductCard key={`cat-a-${product.id}`} product={product} />
            ))}
          </div>
        </div>

        <div className="mt-[30px] space-y-[22px]">
          <MobileSectionHeader title="Կատեգորիա" />
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
            {mobileProducts.slice(8, 12).map((product) => (
              <MobileProductCard key={`cat-b-${product.id}`} product={product} />
            ))}
          </div>
        </div>
      </main>
      <MobileBottomNavigation
        assets={{
          bottomNavBackground: mobileAssets.bottomNavBackground,
          bottomNavShop: mobileAssets.bottomNavShop,
          bottomNavHome: mobileAssets.bottomNavHome,
          bottomNavCart: mobileAssets.bottomNavCart,
          bottomNavFavorite: mobileAssets.bottomNavFavorite,
          bottomNavProfile: mobileAssets.bottomNavProfile,
        }}
        onShopClick={handleOpenShopPicker}
      />
    </div>
  );
}
