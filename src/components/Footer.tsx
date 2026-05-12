'use client';

import Link from 'next/link';
const assets = {
  footerBrandLogo: '/api/r2/footer/20260512-5UxUa-QBsL.png',
  footerMailIcon: '/api/r2/footer/20260512-jlVRdFnMTr.png',
  footerPhoneIcon: '/api/r2/footer/20260512-twjLMqUm3Y.svg',
  footerInstagramIcon: '/api/r2/footer/20260512-HjrdY7iX1q.svg',
  footerTikTokIcon: '/api/r2/footer/20260512-07liy4Px-P.svg',
  footerTelegramIcon: '/api/r2/footer/20260512-qN7ozBdLsp.svg',
  footerWhatsappIcon: '/api/r2/footer/20260512-JrBQyAbN2Y.svg',
  footerViberIcon: '/api/r2/footer/20260512-WH7iCNEGQ0.svg',
  footerAppStoreBadge: '/api/r2/footer/20260512-7Y0hstI5iZ.png',
  footerGooglePlayBadge: '/api/r2/footer/20260512-5Bpvj-I9_s.png',
  footerIdramLogo: '/api/r2/footer/20260512-ub3JHF7EFG.png',
  footerFastshiftLogo: '/api/r2/footer/20260512-qDCxMfAZhD.png',
  footerArcaLogo: '/api/r2/footer/20260512-x5wZihjF6c.png',
  footerVisaLogo: '/api/r2/footer/20260512-gnkwj-t2Os.png',
  footerPastaVisual: '/api/r2/footer/20260512-HvrYIiCklw.png',
  footerAddressPinIcon: '/api/r2/footer/20260512--BIDvUK4Se.png',
};

export function Footer() {
  return (
    <footer className="hidden bg-white lg:block">
      <div className="overflow-hidden rounded-t-[40px] bg-[#121212] px-4 pb-10 pt-14 text-white md:px-8 lg:px-12 lg:pb-0 lg:pt-0">
        <div className="relative mx-auto max-w-[1280px] lg:h-[576px]">
          <img
            src={assets.footerPastaVisual}
            alt="Degusto footer visual"
            className="pointer-events-none absolute -right-[10px] top-[-115px] hidden h-[800px] w-[512px] -rotate-90 -scale-x-100 [aspect-ratio:90/173] object-contain lg:block"
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
                <Link href="/privacy" className="block leading-5 hover:text-[#ff7f20]">
                  Գաղտնիության քաղաքականություն
                </Link>
                <Link href="/delivery-terms" className="block leading-7 hover:text-[#ff7f20]">
                  Առաքման քաղաքականություն
                </Link>
                <Link href="/refund-policy" className="block leading-5 hover:text-[#ff7f20]">
                  Վերադարձի քաղաքականություն
                </Link>
                <Link href="/terms" className="block leading-5 hover:text-[#ff7f20]">
                  Պայմաններ և դրույթներ
                </Link>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[20px] font-black leading-6 text-[#ff7f20]">Հղումներ</h3>
              <div className="space-y-0 text-sm leading-[30px]">
                <Link href="/" className="block hover:text-[#ff7f20]">
                  Գլխավոր
                </Link>
                <Link href="/shop" className="block hover:text-[#ff7f20]">
                  Խոհանոց
                </Link>
                <Link href="/products" className="block hover:text-[#ff7f20]">
                  Կոմբոներ
                </Link>
                <Link href="/about" className="block hover:text-[#ff7f20]">
                  Մեր մասին
                </Link>
              </div>
            </div>

            <div className="hidden lg:block" />
          </div>

          <div className="relative z-10 mt-[18px] flex flex-col gap-3 lg:mt-8 lg:w-[472px]">
            <h3 className="text-[20px] font-black leading-6 text-[#ff7f20]">Կոնտակտներ</h3>

            <div className="flex items-center gap-3">
              <img src={assets.footerMailIcon} alt="" className="h-[25px] w-6 object-contain" />
              <a href="mailto:info@degusto.am" className="text-sm leading-[27px] hover:text-[#ff7f20]">
                info@degusto.am
              </a>
            </div>

            <div className="flex items-start gap-[11px]">
              <img src={assets.footerPhoneIcon} alt="" className="mt-[1px] h-[25px] w-6 object-contain" />
              <a href="tel:+37460388080" className="text-sm leading-[27px] hover:text-[#ff7f20]">
                Հեռ. (060) 38-80-80 / (033)-80-80-80 / (010)-38-80-80
              </a>
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
      </div>
    </footer>
  );
}

