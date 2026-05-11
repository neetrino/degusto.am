'use client';

import Link from 'next/link';
import { useState } from 'react';

const assets = {
  heroBg: 'https://www.figma.com/api/mcp/asset/85cedb2c-a501-40fe-9b97-de4ab816ce45',
  logo: 'https://www.figma.com/api/mcp/asset/b684f5ca-5543-4689-be84-ac53b6c5d14c',
  cartIcon: 'https://www.figma.com/api/mcp/asset/6af1086c-a9ef-4e40-a198-a1dc8ae19a1b',
  cartCounterBubble: 'https://www.figma.com/api/mcp/asset/92cf106e-719d-418a-9062-442c2c704c3a',
  switcherIcon: 'https://www.figma.com/api/mcp/asset/7e774d0a-9c34-437c-b6a6-eb0f02674821',
  switcherArrow: 'https://www.figma.com/api/mcp/asset/7eb0464d-351a-4497-9966-932e83d0dc1c',
  loginIcon: 'https://www.figma.com/api/mcp/asset/78b21874-ca2c-4a82-ad97-53f6d15d758a',
  searchBadge: 'https://www.figma.com/api/mcp/asset/717cf64a-7dc5-44fd-8730-e63c2abe5677',
  searchIcon: 'https://www.figma.com/api/mcp/asset/79afe4c8-e7f4-44f9-8a3e-d76365facd5a',
  offerBadge: 'https://www.figma.com/api/mcp/asset/d3a756a8-cee5-463a-84de-431457f8df09',
  product: 'https://www.figma.com/api/mcp/asset/391d8c26-5fd9-4a5a-bd37-4fb776b3791d',
  productCardImage: 'https://www.figma.com/api/mcp/asset/bfa37838-b9d6-4bdf-8ad2-5f4d937f39b3',
  productCardAddToCart: 'https://www.figma.com/api/mcp/asset/46263ee5-81fc-4599-bc9c-4fbe5266856f',
  productCardHot: 'https://www.figma.com/api/mcp/asset/f511c8ac-085a-4aa8-9f8f-b417639f1eec',
  productCardRibbon: 'https://www.figma.com/api/mcp/asset/575acea0-5e0b-4151-a172-963f16eb96fa',
  productCardStar: 'https://www.figma.com/api/mcp/asset/0060a54b-084d-493d-90df-32f0bd4ae3c4',
  categorySoup: 'https://www.figma.com/api/mcp/asset/f59e55b2-9f13-4728-a2ab-b81a336c933e',
  categorySalad: 'https://www.figma.com/api/mcp/asset/bb38ad79-89f9-419e-adaf-93b0ac75db5a',
  categoryShawarma: 'https://www.figma.com/api/mcp/asset/43549dd0-8594-452d-9fd3-c5f3697f20d8',
  categoryPizza: 'https://www.figma.com/api/mcp/asset/23f5ca6d-8c2f-4461-ae15-1888a189e1b5',
  footerBrandLogo: 'https://www.figma.com/api/mcp/asset/af1386b6-6403-4d12-b481-b0a886d658ac',
  footerMailIcon: 'https://www.figma.com/api/mcp/asset/fa1f18f7-5fb4-4969-a352-7ba68988990b',
  footerPhoneIcon: 'https://www.figma.com/api/mcp/asset/26278683-2f5b-4e23-a574-4cf0ee5a74e2',
  footerInstagramIcon: 'https://www.figma.com/api/mcp/asset/badac04a-9f91-4327-b869-444fac713eae',
  footerTikTokIcon: 'https://www.figma.com/api/mcp/asset/f2b1e657-7dee-46b9-8406-398d2399731f',
  footerTelegramIcon: 'https://www.figma.com/api/mcp/asset/77fcdba1-46b8-44f7-9903-805ead66b2de',
  footerWhatsappIcon: 'https://www.figma.com/api/mcp/asset/90e301d2-29b6-4c8a-958b-f52692611d7e',
  footerViberIcon: 'https://www.figma.com/api/mcp/asset/69968fcd-a155-47cc-b0aa-8f07c6ffaf95',
  footerAppStoreBadge: 'https://www.figma.com/api/mcp/asset/11b4b283-8108-4c9d-8ce1-b5a27e579ccb',
  footerGooglePlayBadge: 'https://www.figma.com/api/mcp/asset/1a4ee134-cb1e-4f57-82da-2a57dfe644ae',
  footerIdramLogo: 'https://www.figma.com/api/mcp/asset/7e6ea7ce-62b4-4944-a231-439e3c4ad39a',
  footerFastshiftLogo: 'https://www.figma.com/api/mcp/asset/0bbbacf6-84d8-4233-9db2-6a06643aabfa',
  footerArcaLogo: 'https://www.figma.com/api/mcp/asset/87b1034e-9e9a-4689-88ab-511074f64d78',
  footerVisaLogo: 'https://www.figma.com/api/mcp/asset/b2630fe9-6a4f-45f5-aca7-eb823d6a990c',
  footerPastaVisual: 'https://www.figma.com/api/mcp/asset/8374a97d-b4c4-4430-822c-d6214226119e',
  footerAddressPinIcon: 'https://www.figma.com/api/mcp/asset/2986cc51-e2e3-4e3a-a3e1-7e9816116373',
};

type CardItem = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  image: string;
};

type CategoryItem = {
  id: string;
  title: string;
  count: string;
  image: string;
};

const newsCards: CardItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: `news-${index + 1}`,
  title: 'Double Cheeseburger',
  subtitle: 'Բուրգեր',
  price: '1200 ֏',
  image: assets.product,
}));

const categoryBase: CategoryItem[] = [
  { id: 'cat-1', title: 'Ապուրներ եւ տաք ուտեստներ', count: '(78 ապրանք)', image: assets.categorySoup },
  { id: 'cat-2', title: 'Աղցաններ', count: '(41 ապրանք)', image: assets.categorySalad },
  { id: 'cat-3', title: 'Շաուրմա', count: '(18 ապրանք)', image: assets.categoryShawarma },
  { id: 'cat-4', title: 'Պիցցա', count: '(44 ապրանք)', image: assets.categoryPizza },
];

const categories: CategoryItem[] = [...categoryBase, ...categoryBase, ...categoryBase, ...categoryBase].map((item, index) => ({
  ...item,
  id: `${item.id}-${index}`,
}));

function HeroHeader() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <div aria-hidden="true" className="h-[104px]" />
      <header className="fixed left-0 right-0 top-6 z-50 mx-auto flex h-20 w-full max-w-[1450px] items-center rounded-[120px] bg-black px-4 md:px-6 lg:px-7">
        <img src={assets.logo} alt="Degusto" className="h-12 w-[134px] shrink-0 object-contain" />
        <nav className="ml-8 mr-auto hidden items-center gap-[30px] whitespace-nowrap px-4 text-[18px] font-semibold leading-[30px] text-white lg:flex">
          <Link href="/" className="shrink-0">
            Գլխավոր
          </Link>
          <Link href="/products" className="shrink-0">
            Խոհանոց
          </Link>
          <Link href="/products" className="shrink-0">
            Կոմբոներ
          </Link>
          <Link href="/about" className="shrink-0">
            Մեր մասին
          </Link>
        </nav>
        <div
          className="relative ml-auto hidden h-12 w-[237px] items-center rounded-[90px] bg-white p-1 transition-all duration-300 ease-out hover:w-[380px] focus-within:w-[380px] md:flex"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            placeholder="Փնտրել..."
            className="h-full min-w-0 flex-1 bg-transparent pl-[14px] text-base leading-6 text-[#252525] outline-none placeholder:text-[rgba(105,105,105,0.56)]"
            aria-label="Search"
          />
          <span className="relative ml-auto inline-flex h-10 items-center overflow-hidden rounded-[20px] bg-[#f66812] py-2 pl-10 pr-4">
            <span className="absolute left-0 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center overflow-hidden">
              <img src={assets.searchBadge} alt="" className="h-8 w-8 object-contain" />
              <img src={assets.searchIcon} alt="" className="absolute h-6 w-6 object-contain" />
            </span>
            <span className="text-[15px] font-semibold leading-6 text-white">Որոնել</span>
          </span>
        </div>
        <div className="ml-3 flex items-center gap-[11px]">
          <div className="hidden items-center gap-[7px] md:flex">
            <button type="button" className="relative h-12 w-[117px] shrink-0">
              <span className="absolute right-0 top-0 inline-flex h-12 w-[88px] items-center justify-center rounded-[70px] bg-[#f1f2f4] text-base font-bold text-black">
                0Դ
              </span>
              <img src={assets.cartIcon} alt="" className="absolute bottom-[1px] left-2 h-[34px] w-[37px] object-contain" />
              <span className="absolute left-[35px] top-[2px] inline-flex h-6 w-6 items-center justify-center">
                <img src={assets.cartCounterBubble} alt="" className="absolute h-6 w-6 object-contain" />
                <span className="relative text-sm font-bold leading-6 text-white">0</span>
              </span>
            </button>
            <button
              type="button"
              className="relative inline-flex h-12 w-[159px] shrink-0 items-center justify-center overflow-hidden rounded-[70px] bg-[#f55c0a] px-[18px] text-base font-bold leading-[18px] text-white"
            >
              <span className="inline-flex -translate-x-[6px] items-center justify-center gap-[2px]">
                <img src={assets.switcherIcon} alt="" className="h-[19px] w-[19px] shrink-0 object-contain" />
                <span className="shrink-0">EN / AMD</span>
              </span>
              <img src={assets.switcherArrow} alt="" className="absolute right-[18px] h-3 w-2 shrink-0 rotate-90 object-contain" />
            </button>
          </div>
          <button type="button" className="inline-flex h-12 w-12 items-center justify-center">
            <img src={assets.loginIcon} alt="Log in" className="h-12 w-12 object-contain" />
          </button>
        </div>
      </header>
    </>
  );
}

function NewsCard({ item }: { item: CardItem }) {
  return (
    <article className="relative h-[284px] w-[236px] shrink-0 rounded-[20px] border-[1.5px] border-[#dedede] bg-white">
      <div className="absolute left-1/2 top-1 h-[147px] w-[227px] -translate-x-1/2">
        <img src={item.image} alt={item.title} className="h-full w-full rounded-[18px] object-cover" />
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
      <h3 className="absolute left-[14px] top-[194px] text-base font-bold leading-[1.05] text-[#3c2f2f]">
        <span className="block">Double</span>
        <span className="block">Cheeseburger</span>
      </h3>
      <p className="absolute left-[14px] top-[230px] text-base font-medium leading-none text-[#a1a1a1]">{item.subtitle}</p>
      <span className="absolute right-px top-[170px] inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black">
        -30%
      </span>
      <p className="absolute right-[14px] top-[236px] text-[20px] font-black leading-none text-[#3c2f2f]">{item.price}</p>
      <p className="absolute right-[14px] top-[262px] text-sm font-light leading-none text-[#3c2f2f] line-through">1200 Դ</p>
      <button
        type="button"
        className="absolute -bottom-[25px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center"
      >
        <img src={assets.productCardAddToCart} alt="Add to cart" className="h-[52px] w-[51px] object-contain" />
      </button>
    </article>
  );
}

function CategoryCard({ item }: { item: CategoryItem }) {
  return (
    <article className="rounded-[22px] bg-[#0c0d12] p-4">
      <h3 className="min-h-[56px] text-2xl font-black leading-tight text-white">{item.title}</h3>
      <p className="mb-2 mt-1 text-sm text-white/80">{item.count}</p>
      <img src={item.image} alt={item.title} className="mx-auto h-[190px] w-full max-w-[240px] object-contain" />
    </article>
  );
}

export function FigmaHomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#ff6a10]">
      <section className="relative w-full overflow-hidden bg-[#ff6a10] pb-56 pt-8 lg:h-[930px] lg:pb-0 lg:[aspect-ratio:231/130]">
        <img
          src={assets.heroBg}
          alt="Degusto hero"
          className="absolute inset-x-0 top-[92px] h-[900px] w-full object-contain object-top lg:h-full"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="725"
          height="450"
          viewBox="0 0 725 450"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-[-120px] top-[-450px] opacity-100"
          style={{
            width: '678.855px',
            height: '1512.29px',
            transform: 'rotate(20deg)',
            transformOrigin: 'center',
          }}
        >
          <path
            d="M-387.936 202.028C-387.936 202.028 119.69 546.315 464.803 275C809.917 3.68502 577.568 -962.001 577.568 -962.001"
            stroke="#3E573D"
            strokeWidth="141"
            strokeLinecap="square"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="211"
          height="985"
          viewBox="0 0 211 985"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute right-[-170px] top-[-1px] opacity-100"
          style={{
            width: '611.208px',
            height: '979.275px',
            transform: 'rotate(2deg)',
            transformOrigin: 'center',
          }}
        >
          <path
            d="M537.749 -25.8738C537.749 -25.8738 56.6915 174.312 70.8068 462.466C84.9222 750.619 850.632 902.127 850.632 902.127"
            stroke="#3E573D"
            strokeWidth="141"
            strokeLinecap="square"
          />
        </svg>

        <HeroHeader />

        <div className="relative z-10 mx-auto mt-14 w-full max-w-[1450px] px-4 lg:mt-16 lg:px-6">
          <div className="relative h-[284px] w-[236px] sm:ml-[45px]">
            <div className="absolute inset-0 rounded-[20px] bg-white shadow-xl" />
            <div className="absolute left-1/2 top-[5px] h-[147px] w-[227px] -translate-x-1/2">
              <img src={assets.productCardImage} alt="Daily offer" className="h-full w-full rounded-[18px] object-cover" />
              <div className="absolute left-[11px] top-[8px] flex flex-col gap-[6px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2b2e]">
                  <img src={assets.productCardHot} alt="" className="h-[19px] w-[19px] -rotate-[13deg] object-contain" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
                  <img src={assets.productCardRibbon} alt="" className="h-8 w-8 scale-110 object-cover" />
                </div>
              </div>
            </div>
            <div className="absolute left-[14px] top-[172px] flex items-center gap-1.5">
              <img src={assets.productCardStar} alt="" className="h-5 w-5 object-contain" />
              <p className="text-base font-medium leading-none text-[rgba(60,47,47,0.62)]">4.7</p>
            </div>
            <h2 className="absolute left-[14px] top-[194px] text-base font-bold leading-none text-[#3c2f2f]">
              <span className="block">Double</span>
              <span className="block">Cheeseburger</span>
            </h2>
            <p className="absolute left-[14px] top-[230px] text-base font-medium leading-none text-[#a1a1a1]">Բուրգեր</p>
            <span className="absolute right-[12px] top-[165px] inline-flex items-center rounded-[60px] bg-[#ff7f20] px-[17px] py-[8px] text-sm font-bold leading-none text-black">
              -30%
            </span>
            <span className="absolute right-[14px] top-[242px] font-['Montserrat_arm','Montserrat',sans-serif] text-[22px] font-[1000] leading-none tracking-[-0.3px] text-[#3c2f2f]">
              1200 Դ
            </span>
            <button
              type="button"
              className="absolute bottom-[-25px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center"
            >
              <img src={assets.productCardAddToCart} alt="Add to cart" className="h-[52px] w-[51px] object-contain" />
            </button>
            <div className="absolute -right-[88px] -top-[46px] h-[132px] w-[132px]">
              <img src={assets.offerBadge} alt="" className="absolute inset-0 h-full w-full object-contain" />
              <div className="absolute inset-0 flex items-center justify-center text-center text-[16px] font-black leading-[1.1] text-white">
                <span>
                  Օրվա
                  <br />
                  Առաջարկ
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="h-[700px] w-full rounded-t-[40px] bg-[#0c0d12] pb-14 pt-6">
        <div className="w-full px-4 md:px-8 ">
          <div className="flex items-center justify-between">
            <h2 className="translate-x-[70px] translate-y-[70px] text-4xl font-black text-white md:text-6xl">
              <span className="text-[#f66913]">Մենք ունենք </span>նորույթներ
            </h2>
            <Link href="/products" className="translate-x-[-115px] translate-y-[70px] inline-block rounded-full bg-[#ff7f20] px-6 py-4 text-lg font-bold text-white">
              Ավելին →
            </Link>
          </div>
          <div className="mt-[150px] flex flex-wrap justify-center gap-[10px] pb-8">
            {newsCards.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <div className="bg-black">
        <section className="rounded-t-[40px] bg-[#e6e6e8] px-4 pb-20 pt-10 md:px-8 lg:px-12">
          <div className="mx-auto max-w-[1280px]">
            <h2 className="mb-8 text-5xl font-black text-black md:text-6xl">Կատեգորիաներ</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((item) => (
                <CategoryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="bg-[#e6e6e8]">
        <footer className="overflow-hidden rounded-t-[40px] bg-[#121212] px-4 pb-10 pt-14 text-white md:px-8 lg:px-12 lg:pb-0 lg:pt-0">
          <div className="relative mx-auto max-w-[1280px] lg:h-[576px]">
            <img
              src={assets.footerPastaVisual}
              alt="Degusto footer visual"
              className="pointer-events-none absolute -right-[50px] top-[-200px] hidden h-[800px] w-[512px] -rotate-90 [aspect-ratio:90/173] object-contain lg:block"
            />

            <div className="relative z-10 grid gap-10 lg:grid-cols-[244px_283px_120px_1fr] lg:pt-[73px]">
              <div>
                <h3 className="mb-4 flex items-center gap-[6px] text-[20px] font-black leading-6 text-[#ff7f20]">
                  <img src={assets.footerAddressPinIcon} alt="" className="h-6 w-[18px] object-contain" />
                  <span>Հասցեներ</span>
                </h3>
                <p className="text-sm leading-[27px]">Պարույր Սևակի 92</p>
                <p className="text-sm leading-[27px]">Բագրատունյաց 11Ա</p>
                <p className="max-w-[246px] text-sm leading-[27px]">Ազատության 24/19, Coffee Studio by Degusto</p>
              </div>

              <div>
                <h3 className="mb-4 text-[20px] font-black uppercase tracking-[0.55px] text-[#ff7f20]">Պայմաններ</h3>
                <div className="space-y-2 text-sm text-white">
                  <p className="leading-5">Գաղտնիության քաղաքականություն</p>
                  <p className="leading-7">Առաքման քաղաքականություն</p>
                  <p className="leading-5">Վերադարձի քաղաքականություն</p>
                  <p className="leading-5">Պայմաններ և դրույթներ</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-[20px] font-black leading-6 text-[#ff7f20]">Հղումներ</h3>
                <div className="space-y-0 text-sm leading-[30px]">
                  <p>Գլխավոր</p>
                  <p>Խոհանոց</p>
                  <p>Կոմբոներ</p>
                  <p>Մեր մասին</p>
                </div>
              </div>

              <div className="hidden lg:block" />
            </div>

            <div className="relative z-10 mt-[18px] flex flex-col gap-3 lg:mt-8 lg:w-[472px]">
              <h3 className="text-[20px] font-black leading-6 text-[#ff7f20]">Կոնտակտներ</h3>

              <div className="flex items-center gap-3">
                <img src={assets.footerMailIcon} alt="" className="h-[25px] w-6 object-contain" />
                <p className="text-sm leading-[27px]">info@degusto.am</p>
              </div>

              <div className="flex items-start gap-[11px]">
                <img src={assets.footerPhoneIcon} alt="" className="mt-[1px] h-[25px] w-6 object-contain" />
                <p className="text-sm leading-[27px]">Հեռ. (060) 38-80-80 / (033)-80-80-80 / (010)-38-80-80</p>
              </div>

              <div className="mt-1 flex h-[41px] items-center gap-4">
                <img src={assets.footerInstagramIcon} alt="Instagram" className="h-10 w-10 object-contain" />
                <img src={assets.footerTikTokIcon} alt="TikTok" className="h-10 w-10 object-contain" />
                <img src={assets.footerTelegramIcon} alt="Telegram" className="h-10 w-10 object-contain" />
                <img src={assets.footerWhatsappIcon} alt="WhatsApp" className="h-10 w-10 object-contain" />
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7c1d]">
                  <img src={assets.footerViberIcon} alt="Viber" className="h-[22px] w-[22px] object-contain" />
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap justify-start gap-[5px] lg:absolute lg:bottom-[164px] lg:right-0 lg:mt-0">
              <img src={assets.footerAppStoreBadge} alt="Download on the App Store" className="h-10 w-auto object-contain" />
              <img src={assets.footerGooglePlayBadge} alt="Get it on Google Play" className="h-10 w-auto object-contain" />
            </div>

            <div className="relative z-10 mt-8 border-t border-white/20 pt-4 lg:absolute lg:bottom-[52px] lg:left-0 lg:right-0 lg:mt-0 lg:pt-[18px]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <img src={assets.footerBrandLogo} alt="Degusto" className="h-[42px] w-[117px] object-contain" />
                <p className="text-sm leading-[23px] text-white lg:pr-[24px]">
                  Copyright © 2026 | Բոլոր իրավունքները պաշտպանված են | Ստեղծվել է{' '}
                  <span className="font-black text-[#ff7f20]">Neetrino IT Company</span> կողմից
                </p>
                <div className="flex items-center gap-[11px]">
                  <span className="inline-flex h-[30px] w-[73px] items-center justify-center rounded-lg bg-white px-1">
                    <img src={assets.footerIdramLogo} alt="Idram" className="h-[17px] w-[66px] object-contain" />
                  </span>
                  <span className="inline-flex h-[30px] w-[73px] items-center justify-center rounded-lg bg-white px-1">
                    <img src={assets.footerFastshiftLogo} alt="Fastshift" className="h-4 w-[61px] object-contain" />
                  </span>
                  <span className="inline-flex h-[30px] w-[74px] items-center justify-center rounded-lg bg-white px-1">
                    <img src={assets.footerArcaLogo} alt="Arca" className="h-[13px] w-[50px] object-contain" />
                  </span>
                  <span className="inline-flex h-[30px] w-[73px] items-center justify-center rounded-lg bg-white px-1">
                    <img src={assets.footerVisaLogo} alt="Visa" className="h-[22px] w-12 object-contain" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
