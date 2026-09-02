"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";

import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { googleMapsSearchUrl } from "@/lib/maps/google-maps-url";
import { staticAssetUrl } from "@/lib/media/static-asset-url";
import { splitPhoneLine } from "@/lib/phone/tel";

const FOOTER_LOGO = staticAssetUrl("/assets/footer/logo.webp");
const ICON_PIN = staticAssetUrl("/assets/footer/icon-pin.webp");
const ICON_MAIL = staticAssetUrl("/assets/footer/icon-mail.webp");
const ICON_PHONE = staticAssetUrl("/assets/footer/icon-phone.webp");

const SOCIAL_ICONS = [
  { key: "instagram", src: staticAssetUrl("/assets/footer/social-instagram.webp") },
  { key: "facebook", src: staticAssetUrl("/assets/footer/social-facebook.webp") },
] as const;

const PAYMENT_LOGOS = [
  { src: staticAssetUrl("/assets/footer/pay-idram.webp"), alt: "idram" },
  { src: staticAssetUrl("/assets/footer/pay-fastshift.webp"), alt: "fastshift" },
  { src: staticAssetUrl("/assets/footer/pay-arca.webp"), alt: "arca" },
  { src: staticAssetUrl("/assets/footer/pay-visa.webp"), alt: "visa" },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

type FooterCopy = Dictionary["footer"];

function headingClassName(): string {
  return "font-display text-[20px] leading-6 font-black tracking-wide text-brand";
}

type FooterAddressesBlockProps = {
  footer: FooterCopy;
  reduceMotion: boolean | null;
};

/** Animated addresses column for the storefront footer. */
export function FooterAddressesBlock({
  footer,
  reduceMotion,
}: FooterAddressesBlockProps) {
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
      <motion.ul
        variants={reduceMotion ? undefined : listVariants}
        className="flex flex-col gap-[5px]"
      >
        {footer.addresses.map((address) => (
          <motion.li
            key={address}
            variants={reduceMotion ? undefined : itemVariants}
          >
            <a
              href={googleMapsSearchUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm leading-[27px] text-white transition hover:text-brand"
            >
              {address}
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

type FooterContactsBlockProps = {
  footer: FooterCopy;
  social: FooterCopy["social"];
  reduceMotion: boolean | null;
};

/** Animated contacts + socials column for the storefront footer. */
export function FooterContactsBlock({
  footer,
  social,
  reduceMotion,
}: FooterContactsBlockProps) {
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
          <span className="flex flex-col">
            {splitPhoneLine(footer.phones).flatMap((part, index) =>
              part.kind === "tel"
                ? [
                    <a
                      key={`${part.href}-${index}`}
                      href={part.href}
                      className="transition hover:text-brand"
                    >
                      {part.display}
                    </a>,
                  ]
                : [],
            )}
          </span>
        </p>
        <motion.ul
          variants={reduceMotion ? undefined : listVariants}
          className="mt-1 flex flex-wrap items-center gap-4"
        >
          {SOCIAL_ICONS.map((item) => {
            const href = social[item.key];
            return (
              <motion.li
                key={item.key}
                variants={reduceMotion ? undefined : itemVariants}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.08,
                        transition: {
                          type: "spring",
                          stiffness: 320,
                          damping: 16,
                        },
                      }
                }
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.key}
                  className="block size-10 overflow-hidden rounded-full transition hover:brightness-110"
                >
                  <Image
                    src={item.src}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10"
                    aria-hidden
                  />
                </a>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </div>
  );
}

type FooterBottomBarProps = {
  brand: string;
  locale: Locale;
  year: number;
  footer: FooterCopy;
  reduceMotion: boolean | null;
};

/** Animated copyright / logo / payment row. */
export function FooterBottomBar({
  brand,
  locale,
  year,
  footer,
  reduceMotion,
}: FooterBottomBarProps) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
      className="mt-12 border-t border-white/20 pt-5"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <AppLink
          href={`/${locale}`}
          prefetchPolicy="intent"
          className="relative h-[42px] w-[117px] shrink-0"
          aria-label={brand}
        >
          <Image
            src={FOOTER_LOGO}
            alt={brand}
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

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reduceMotion ? undefined : listVariants}
          className="flex flex-wrap items-center gap-[11px]"
        >
          {PAYMENT_LOGOS.map((payment) => (
            <motion.li
              key={payment.alt}
              variants={reduceMotion ? undefined : itemVariants}
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.04 }}
              className="flex h-[30px] w-[73px] items-center justify-center overflow-hidden rounded-lg bg-white px-1"
            >
              <Image
                src={payment.src}
                alt={payment.alt}
                width={66}
                height={22}
                className="h-auto max-h-[22px] w-auto object-contain"
              />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}
