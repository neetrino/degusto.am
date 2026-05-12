'use client';

import Link from 'next/link';
import { useState } from 'react';

const assets = {
  logo: 'https://www.figma.com/api/mcp/asset/b684f5ca-5543-4689-be84-ac53b6c5d14c',
  loginIcon: 'https://www.figma.com/api/mcp/asset/78b21874-ca2c-4a82-ad97-53f6d15d758a',
  cartIcon: 'https://www.figma.com/api/mcp/asset/6af1086c-a9ef-4e40-a198-a1dc8ae19a1b',
  cartCounterBubble: 'https://www.figma.com/api/mcp/asset/92cf106e-719d-418a-9062-442c2c704c3a',
  searchBadge: 'https://www.figma.com/api/mcp/asset/717cf64a-7dc5-44fd-8730-e63c2abe5677',
  searchIcon: 'https://www.figma.com/api/mcp/asset/79afe4c8-e7f4-44f9-8a3e-d76365facd5a',
  switcherIcon: 'https://www.figma.com/api/mcp/asset/7e774d0a-9c34-437c-b6a6-eb0f02674821',
  switcherArrow: 'https://www.figma.com/api/mcp/asset/7eb0464d-351a-4497-9966-932e83d0dc1c',
};

export function UniversalHeader() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <div aria-hidden="true" className="h-[104px]" />
      <header className="fixed left-0 right-0 top-6 z-50 mx-auto flex h-20 w-full max-w-[1450px] items-center rounded-[120px] bg-black px-4 md:px-6 lg:px-7">
        <img src={assets.logo} alt="Degusto" className="h-12 w-[134px] shrink-0 object-contain" />
        <nav className="ml-8 mr-auto hidden items-center gap-[30px] whitespace-nowrap px-4 text-[18px] font-semibold leading-[30px] text-white lg:flex">
          <Link href="/" className="shrink-0">Գլխավոր</Link>
          <Link href="/products" className="shrink-0">Խոհանոց</Link>
          <Link href="/products" className="shrink-0">Կոմբոներ</Link>
          <Link href="/about" className="shrink-0">Մեր մասին</Link>
        </nav>
        <div className="relative ml-auto hidden h-12 w-[237px] items-center rounded-[90px] bg-white p-1 transition-all duration-300 ease-out hover:w-[380px] focus-within:w-[380px] md:flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
