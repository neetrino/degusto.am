import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { FooterDishBackdrop, FooterDishVisual } from "@/components/layout/FooterDishVisual";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

const FOOTER_LOGO = "/assets/footer/logo.webp";
const ICON_PIN = "/assets/footer/icon-pin.webp";
const ICON_MAIL = "/assets/footer/icon-mail.webp";
const ICON_PHONE = "/assets/footer/icon-phone.webp";

const SOCIAL_ICONS = [
  { key: "instagram", src: "/assets/footer/social-instagram.webp" },
  { key: "facebook", src: "/assets/footer/social-facebook.webp" },
  { key: "telegram", src: "/assets/footer/social-telegram.webp" },
  { key: "whatsapp", src: "/assets/footer/social-whatsapp.webp" },
  { key: "viber", src: "/assets/footer/social-viber.webp" },
] as const;

const PAYMENT_LOGOS = [
  { src: "/assets/footer/pay-idram.webp", alt: "idram" },
  { src: "/assets/footer/pay-fastshift.webp", alt: "fastshift" },
  { src: "/assets/footer/pay-arca.webp", alt: "arca" },
  { src: "/assets/footer/pay-visa.webp", alt: "visa" },
] as const;

type SiteFooterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type FooterCopy = Dictionary["footer"];

function headingClassName(): string {
  return "font-display text-[20px] leading-6 font-black tracking-wide text-brand";
}

function linkClassName(): string {
  return "text-sm leading-[27px] text-white transition hover:text-brand";
}

/** Degusto storefront footer — Figma FOOTER node 1:989. */
export function SiteFooter({ dictionary, locale }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const footer = dictionary.footer;
  const social = footer.social;

  const navLinks = [
    { href: `/${locale}`, label: dictionary.nav.home },
    { href: `/${locale}/products`, label: dictionary.nav.shop },
    { href: `/${locale}/combo`, label: dictionary.nav.combos },
    { href: `/${locale}/about`, label: dictionary.nav.about },
  ] as const;

  const legalLinks = [
    { href: `/${locale}/legal/privacy`, label: footer.privacyPolicy },
    { href: `/${locale}/legal/terms`, label: footer.shippingPolicy },
    { href: `/${locale}/legal/terms`, label: footer.returnPolicy },
    { href: `/${locale}/legal/terms`, label: footer.terms },
  ] as const;

  return (
    <div className="storefront-footer relative left-1/2 right-1/2 z-10 mt-auto -ml-[50vw] -mr-[50vw] w-screen bg-surface-muted">
      <footer className="relative overflow-hidden rounded-t-[40px] bg-surface-dark text-white">
        <FooterDishBackdrop />
        <div className="relative z-10 mx-auto max-w-[1280px] px-4 pt-[73px] pb-10 sm:px-6 lg:px-8 xl:px-0">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-10 lg:col-span-4">
            <AddressesBlock footer={footer} />
            <ContactsBlock footer={footer} social={social} />
          </div>

          <div className="lg:col-span-3 lg:-translate-x-8 xl:-translate-x-12">
            <h2 className={`${headingClassName()} uppercase`}>{footer.termsTitle}</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <AppLink
                    href={item.href}
                    prefetchPolicy="intent"
                    className={linkClassName()}
                  >
                    {item.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 lg:-translate-x-8 xl:-translate-x-12">
            <h2 className={headingClassName()}>{footer.linksTitle}</h2>
            <ul className="mt-2 flex flex-col">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <AppLink
                    href={item.href}
                    prefetchPolicy="intent"
                    className={`${linkClassName()} leading-[30px]`}
                  >
                    {item.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>

          <FooterDishVisual />
        </div>

        <div className="mt-12 border-t border-white/20 pt-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <AppLink
              href={`/${locale}`}
              prefetchPolicy="intent"
              className="relative h-[42px] w-[117px] shrink-0"
              aria-label={dictionary.brand}
            >
              <Image
                src={FOOTER_LOGO}
                alt={dictionary.brand}
                fill
                sizes="117px"
                className="object-contain object-left"
              />
            </AppLink>

            <p className="max-w-xl text-sm leading-[23px] text-white lg:flex-1 lg:px-6">
              {footer.copyrightLead.replace("{year}", String(year))}{" "}
              <a
                href={footer.neetrinoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-brand hover:underline"
              >
                {footer.copyrightBrand}
              </a>
              {footer.copyrightTrail ? ` ${footer.copyrightTrail}` : null}
            </p>

            <ul className="flex flex-wrap items-center gap-[11px]">
              {PAYMENT_LOGOS.map((payment) => (
                <li
                  key={payment.alt}
                  className="flex h-[30px] w-[73px] items-center justify-center overflow-hidden rounded-lg bg-white px-1"
                >
                  <Image
                    src={payment.src}
                    alt={payment.alt}
                    width={66}
                    height={22}
                    className="h-auto max-h-[22px] w-auto object-contain"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      </footer>
    </div>
  );
}

function AddressesBlock({ footer }: { footer: FooterCopy }) {
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-[17px]">
      <div className="flex items-center gap-1.5">
        <Image
          src={ICON_PIN}
          alt=""
          width={18}
          height={24}
          className="h-6 w-[18px] object-contain"
          aria-hidden
        />
        <h2 className={headingClassName()}>{footer.addressesTitle}</h2>
      </div>
      <ul className="flex flex-col gap-[5px]">
        {footer.addresses.map((address) => (
          <li key={address} className="text-sm leading-[27px] text-white">
            {address}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactsBlock({
  footer,
  social,
}: {
  footer: FooterCopy;
  social: FooterCopy["social"];
}) {
  return (
    <div className="flex w-full max-w-[472px] flex-col gap-[18px]">
      <h2 className={headingClassName()}>{footer.contactsTitle}</h2>
      <div className="flex flex-col gap-[9px]">
        <a
          href={`mailto:${footer.email}`}
          className="flex items-center gap-3 text-sm leading-[27px] text-white transition hover:text-brand"
        >
          <Image
            src={ICON_MAIL}
            alt=""
            width={24}
            height={25}
            className="h-6 w-6 object-contain"
            aria-hidden
          />
          {footer.email}
        </a>
        <p className="flex items-start gap-[11px] text-sm leading-[27px] text-white">
          <Image
            src={ICON_PHONE}
            alt=""
            width={24}
            height={25}
            className="mt-0.5 h-6 w-6 shrink-0 object-contain"
            aria-hidden
          />
          <span>{footer.phones}</span>
        </p>
        <ul className="mt-1 flex flex-wrap items-center gap-4">
          {SOCIAL_ICONS.map((item) => {
            const href = social[item.key];
            const isViber = item.key === "viber";
            return (
              <li key={item.key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.key}
                  className={
                    isViber
                      ? "flex size-10 items-center justify-center rounded-full bg-brand transition hover:brightness-110"
                      : "block size-10 overflow-hidden rounded-full transition hover:brightness-110"
                  }
                >
                  <Image
                    src={item.src}
                    alt=""
                    width={isViber ? 20 : 40}
                    height={isViber ? 22 : 40}
                    className={isViber ? "h-[22px] w-5" : "size-10"}
                    aria-hidden
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
