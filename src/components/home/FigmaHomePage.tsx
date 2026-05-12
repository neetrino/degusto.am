'use client';

import Link from 'next/link';
import { FigmaHomePageMobile } from './FigmaHomePageMobile';
import { UniversalHeader } from '../UniversalHeader';
import { Footer } from '../Footer';

const assets = {
  heroBg: '/api/r2/hero/20260512-tOKhBzyB6u.png',
  offerBadge: '/api/r2/assets/20260512-3dEN1cAZhG.svg',
  product: '/api/r2/product/20260512-5XM6tLjCRv.png',
  productCardImage: '/api/r2/product/20260512-D3w_teddze.png',
  productCardAddToCart: '/api/r2/product/20260512-g67zkm13ZH.svg',
  productCardHot: '/api/r2/product/20260512-dWv7-ZfxP1.svg',
  productCardRibbon: '/api/r2/product/20260512-lmzrYlGD39.svg',
  productCardStar: '/api/r2/product/20260512-7jf6Wihrew.svg',
  categorySoup: '/api/r2/category/20260512-27SeUi_ujs.png',
  categorySalad: '/api/r2/category/20260512-Np6RG2GuNi.png',
  categoryShawarma: '/api/r2/category/20260512-UOlekxqQyh.png',
  categoryPizza: '/api/r2/category/20260512-j5QKmShMEM.png',
};

export type HomeFeaturedProduct = {
  id: string;
  title: string;
  subtitle: string;
  price: number | null;
  oldPrice: number | null;
  image: string | null;
  discountPercent: number | null;
};

export type HomeCategoryItem = {
  id: string;
  title: string;
  count: number;
  image: string;
};

const fallbackFeaturedProducts: HomeFeaturedProduct[] = [
  {
    id: 'featured-fallback-1',
    title: 'Double Cheeseburger',
    subtitle: 'Բուրգեր',
    price: 1200,
    oldPrice: 1500,
    image: assets.product,
    discountPercent: 30,
  },
];

const fallbackCategories: HomeCategoryItem[] = [
  { id: 'cat-fallback-1', title: 'Ապուրներ եւ տաք ուտեստներ', count: 78, image: assets.categorySoup },
  { id: 'cat-fallback-2', title: 'Աղցաններ', count: 41, image: assets.categorySalad },
  { id: 'cat-fallback-3', title: 'Շաուրմա', count: 18, image: assets.categoryShawarma },
  { id: 'cat-fallback-4', title: 'Պիցցա', count: 44, image: assets.categoryPizza },
];

function formatPrice(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }
  return `${Math.round(value).toLocaleString('en-US')} ֏`;
}

function NewsCard({ item }: { item: HomeFeaturedProduct }) {
  const hasDiscount = typeof item.discountPercent === 'number' && item.discountPercent > 0;
  const imageSrc = item.image || assets.product;

  return (
    <article className="relative h-[284px] w-[236px] shrink-0 rounded-[20px] border-[1.5px] border-[#dedede] bg-white">
      <div className="absolute left-1/2 top-1 h-[147px] w-[227px] -translate-x-1/2">
        <img src={imageSrc} alt={item.title} className="h-full w-full rounded-[18px] object-cover" />
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
        <span className="block">{item.title}</span>
      </h3>
      <p className="absolute left-[14px] top-[230px] text-base font-medium leading-none text-[#a1a1a1]">{item.subtitle}</p>
      {hasDiscount ? (
        <span className="absolute right-px top-[170px] inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black">
          -{Math.round(item.discountPercent)}%
        </span>
      ) : null}
      <p className="absolute right-[14px] top-[236px] text-[20px] font-black leading-none text-[#3c2f2f]">{formatPrice(item.price)}</p>
      {item.oldPrice ? (
        <p className="absolute right-[14px] top-[262px] text-sm font-light leading-none text-[#3c2f2f] line-through">
          {formatPrice(item.oldPrice)}
        </p>
      ) : null}
      <button
        type="button"
        className="absolute -bottom-[25px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center"
      >
        <img src={assets.productCardAddToCart} alt="Add to cart" className="h-[52px] w-[51px] object-contain" />
      </button>
    </article>
  );
}

function CategoryCard({ item }: { item: HomeCategoryItem }) {
  return (
    <article className="rounded-[22px] bg-[#0c0d12] p-4">
      <h3 className="min-h-[56px] text-2xl font-black leading-tight text-white">{item.title}</h3>
      <p className="mb-2 mt-1 text-sm text-white/80">({item.count} ապրանք)</p>
      <img src={item.image} alt={item.title} className="mx-auto h-[190px] w-full max-w-[240px] object-contain" />
    </article>
  );
}

export function FigmaHomePage({
  featuredProducts,
  categories,
}: {
  featuredProducts: HomeFeaturedProduct[];
  categories: HomeCategoryItem[];
}) {
  const homeFeaturedProducts = featuredProducts.length > 0 ? featuredProducts : fallbackFeaturedProducts;
  const homeCategories = categories.length > 0 ? categories : fallbackCategories;
  const heroProduct = homeFeaturedProducts[0];

  return (
    <>
      <div className="lg:hidden">
        <FigmaHomePageMobile />
      </div>
      <div className="hidden min-h-screen overflow-x-hidden bg-[var(--project-color)] lg:block">
      <section className="relative w-full overflow-hidden bg-[var(--project-color)] pb-56 pt-8 lg:h-[930px] lg:pb-0 lg:[aspect-ratio:231/130]">
        <img
          src={assets.heroBg}
          alt="Degusto hero"
          className="absolute inset-x-0 top-[92px] h-[900px] w-full object-contain object-top lg:h-full"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
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

        <UniversalHeader spacerBackgroundClassName="bg-[#F66812]" />

        <div className="relative z-10 mx-auto mt-14 w-full max-w-[1450px] px-4 lg:mt-16 lg:px-6">
          <div className="relative h-[284px] w-[236px] sm:ml-[45px]">
            <div className="absolute inset-0 rounded-[20px] bg-white shadow-xl" />
            <div className="absolute left-1/2 top-[5px] h-[147px] w-[227px] -translate-x-1/2">
              <img src={heroProduct?.image || assets.productCardImage} alt="Daily offer" className="h-full w-full rounded-[18px] object-cover" />
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
              <span className="block">{heroProduct?.title || 'Double Cheeseburger'}</span>
            </h2>
            <p className="absolute left-[14px] top-[230px] text-base font-medium leading-none text-[#a1a1a1]">{heroProduct?.subtitle || 'Բուրգեր'}</p>
            <span className="absolute right-[12px] top-[165px] inline-flex items-center rounded-[60px] bg-[#ff7f20] px-[17px] py-[8px] text-sm font-bold leading-none text-black">
              -{Math.round(heroProduct?.discountPercent || 30)}%
            </span>
            <span className="absolute right-[14px] top-[242px] font-['Montserrat_arm','Montserrat',sans-serif] text-[22px] font-[1000] leading-none tracking-[-0.3px] text-[#3c2f2f]">
              {formatPrice(heroProduct?.price || 1200)}
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
              <span className="text-[#f66913]">Ակցիաներ և </span>հատուկ առաջարկներ
            </h2>
            <Link href="/products" className="translate-x-[-115px] translate-y-[70px] inline-block rounded-full bg-[#ff7f20] px-6 py-4 text-lg font-bold text-white">
              Ավելին →
            </Link>
          </div>
          <div className="mt-[150px] flex flex-wrap justify-center gap-[10px] pb-8">
            {homeFeaturedProducts.map((item) => (
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
              {homeCategories.map((item) => (
                <CategoryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
      </div>
    </>
  );
}
