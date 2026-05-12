'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MobileBottomNavigation } from './MobileBottomNavigation';

type ShopCategoryCard = {
  id: string;
  title: string;
  image: string;
  categorySlug: string;
};

const mobileShopAssets = {
  logo: 'https://www.figma.com/api/mcp/asset/34f958fa-ab37-48d3-9ea9-b8188df6f94e',
  callCircle: 'https://www.figma.com/api/mcp/asset/8bf39f26-3d18-4871-b694-21fbc3692875',
  callIcon: 'https://www.figma.com/api/mcp/asset/e056c509-d7fe-456d-bc12-61214878c30a',
  switcherIcon: 'https://www.figma.com/api/mcp/asset/f8088dd0-f232-4862-88bd-9379e9d70cc2',
  switcherArrow: 'https://www.figma.com/api/mcp/asset/88c9a9d7-3f4f-475a-beaa-de047f843561',
  searchIcon: 'https://www.figma.com/api/mcp/asset/20b16655-3497-40ab-ad5a-036dca9c7f79',
  searchFilterButton: 'https://www.figma.com/api/mcp/asset/800b5f18-840d-4007-a2d0-f1e2b4ccf2ce',
  soup: 'https://www.figma.com/api/mcp/asset/b6135bb9-6d9a-49a7-b8fe-4da577c24236',
  shawarma: 'https://www.figma.com/api/mcp/asset/4cc67778-89fc-446d-a1eb-aae21c069b47',
  salad: 'https://www.figma.com/api/mcp/asset/84a83d78-772b-48b8-b3a7-87e6d4e070ea',
  bottomNavBackground: 'https://www.figma.com/api/mcp/asset/af1f700c-23b6-4f02-9bdb-3e40f80be690',
  bottomNavShop: 'https://www.figma.com/api/mcp/asset/ff3931b1-7a4b-4bbe-842c-490d7734243e',
  bottomNavShopIcon: 'https://www.figma.com/api/mcp/asset/8cd2ca77-9fde-451d-a3ba-d2295bf005f4',
  bottomNavHome: 'https://www.figma.com/api/mcp/asset/cbe4779c-ddb3-4b58-bbc0-84e5dc3f71c2',
  bottomNavCart: 'https://www.figma.com/api/mcp/asset/4ff8c2a7-ec88-40eb-93b9-f7ef967358cd',
  bottomNavFavorite: 'https://www.figma.com/api/mcp/asset/cb43f44b-05c7-493e-be48-2d1ca3962f8c',
  bottomNavProfile: 'https://www.figma.com/api/mcp/asset/1c1ba9d3-6fce-4cc4-9d3e-b0050bef93af',
};

const shopCategories: ShopCategoryCard[] = [
  { id: 'cat-soup', title: 'Ապուրներ և տաք ուտեստներ', image: mobileShopAssets.soup, categorySlug: 'soup' },
  { id: 'cat-salad', title: 'Աղցաններ', image: mobileShopAssets.salad, categorySlug: 'salad' },
  { id: 'cat-shawarma', title: 'Շաուրմա', image: mobileShopAssets.shawarma, categorySlug: 'shawarma' },
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

  const handleOpenProducts = (categorySlug: string) => {
    router.push(`/products?category=${encodeURIComponent(categorySlug)}`);
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
              <img src={mobileShopAssets.callIcon} alt="Call" className="relative h-[23px] w-[23px] object-contain" />
            </button>
            <button type="button" className="relative inline-flex h-12 w-[159px] items-center rounded-[70px] bg-white px-[19px]">
              <img src={mobileShopAssets.switcherIcon} alt="" className="h-[19px] w-[19px] object-contain" />
              <span className="ml-[2px] text-base font-bold leading-[18px] text-[#ff7f20]">EN / AMD</span>
              <img src={mobileShopAssets.switcherArrow} alt="" className="absolute right-[20px] h-[10px] w-[4px] rotate-90 object-contain" />
            </button>
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
            placeholder="Որոնել"
            className="h-full w-full rounded-[30px] bg-transparent pl-[39px] pr-[58px] text-[15px] leading-6 text-black outline-none placeholder:text-[#abb7c2]"
          />
          <button type="button" className="absolute right-[7px] top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center">
            <img src={mobileShopAssets.searchFilterButton} alt="Filters" className="h-10 w-10 object-contain" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mt-[87px] rounded-t-[30px] bg-[#e7e7e7] px-[15px] pb-[130px] pt-[22px]">
        <h1 className="text-base font-semibold leading-5 text-black">Կատեգորիաներ</h1>

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
              <p className="absolute left-[13px] top-[20px] right-[10px] text-xs font-medium leading-[18px] text-white">{category.title}</p>
              <img src={category.image} alt={category.title} className="absolute bottom-0 right-0 h-[130px] w-[132px] object-contain" />
            </button>
          ))}
        </div>
      </main>

      <MobileBottomNavigation
        assets={{
          bottomNavBackground: mobileShopAssets.bottomNavBackground,
          bottomNavShop: mobileShopAssets.bottomNavShop,
          bottomNavShopIcon: mobileShopAssets.bottomNavShopIcon,
          bottomNavHome: mobileShopAssets.bottomNavHome,
          bottomNavCart: mobileShopAssets.bottomNavCart,
          bottomNavFavorite: mobileShopAssets.bottomNavFavorite,
          bottomNavProfile: mobileShopAssets.bottomNavProfile,
        }}
        onShopClick={() => {
          router.push('/shop');
        }}
      />
    </div>
  );
}
