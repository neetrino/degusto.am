"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  FooterAddressesBlock,
  FooterBottomBar,
  FooterContactsBlock,
} from "@/components/layout/SiteFooterBlocks";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

const FOOTER_DISH = staticAssetUrl("/assets/footer/dish.webp");

const EASE = [0.22, 1, 0.36, 1] as const;

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: EASE },
  },
};

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

type SiteFooterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

function headingClassName(): string {
  return "font-display text-[20px] leading-6 font-black tracking-wide text-brand";
}

function linkClassName(): string {
  return "text-sm leading-[27px] text-white transition hover:text-brand";
}

/** Degusto storefront footer — Motion entrance + continuous dish parallax. */
export function SiteFooter({ dictionary, locale }: SiteFooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const year = new Date().getFullYear();
  const footer = dictionary.footer;

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    mass: 0.45,
  });

  const dishY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["18%", "-6%"],
  );
  const glowOpacity = useTransform(
    progress,
    [0, 0.45, 1],
    reduceMotion ? [0.35, 0.35, 0.35] : [0.12, 0.5, 0.28],
  );

  const navLinks = [
    { href: `/${locale}/products`, label: dictionary.nav.shop },
    { href: `/${locale}/combo`, label: dictionary.nav.combos },
    { href: `/${locale}/about`, label: dictionary.nav.about },
    { href: `/${locale}/contact`, label: dictionary.nav.contact },
  ] as const;

  const legalLinks = [
    { href: `/${locale}/legal/privacy`, label: footer.privacyPolicy },
    { href: `/${locale}/legal/returns`, label: footer.returnPolicy },
    { href: `/${locale}/legal/terms`, label: footer.terms },
  ] as const;

  return (
    <div className="storefront-footer relative left-1/2 right-1/2 z-10 mt-auto -ml-[50vw] -mr-[50vw] hidden w-screen bg-surface-muted md:block">
      <motion.footer
        ref={footerRef}
        initial={reduceMotion ? false : { y: 48, opacity: 0.85 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: EASE }}
        className="relative overflow-hidden rounded-t-[40px] bg-surface-dark text-white"
      >
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(246,104,18,0.28)_0%,_transparent_68%)] blur-3xl"
        />

        <motion.img
          src={FOOTER_DISH}
          alt=""
          width={512}
          height={800}
          style={{ y: dishY }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
          className="pointer-events-none absolute -right-[10px] top-[-35px] z-0 hidden h-[min(800px,90vh)] w-[min(512px,42vw)] max-w-none -rotate-90 -scale-x-100 object-contain will-change-transform [aspect-ratio:90/173] lg:block xl:top-[-115px] xl:h-[800px] xl:w-[512px]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-[1280px] px-4 pt-[73px] pb-10 sm:px-6 lg:px-8 xl:px-0">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
                    },
                  }
            }
            className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8"
          >
            <motion.div
              variants={reduceMotion ? undefined : columnVariants}
              className="flex flex-col gap-10 lg:col-span-4"
            >
              <FooterAddressesBlock
                footer={footer}
                reduceMotion={reduceMotion}
              />
              <div>
                <h2 className={`${headingClassName()} uppercase`}>
                  {footer.termsTitle}
                </h2>
                <motion.ul
                  variants={reduceMotion ? undefined : listVariants}
                  className="mt-4 flex flex-col gap-2"
                >
                  {legalLinks.map((item) => (
                    <motion.li
                      key={item.label}
                      variants={reduceMotion ? undefined : itemVariants}
                    >
                      <AppLink
                        href={item.href}
                        prefetchPolicy="intent"
                        className={linkClassName()}
                      >
                        {item.label}
                      </AppLink>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </motion.div>

            <motion.div
              variants={reduceMotion ? undefined : columnVariants}
              className="lg:col-span-3 lg:-translate-x-8 xl:-translate-x-12"
            >
              <FooterContactsBlock
                footer={footer}
                social={footer.social}
                reduceMotion={reduceMotion}
              />
            </motion.div>

            <motion.div
              variants={reduceMotion ? undefined : columnVariants}
              className="lg:col-span-2 lg:-translate-x-12 xl:-translate-x-20"
            >
              <h2 className={headingClassName()}>{footer.linksTitle}</h2>
              <motion.ul
                variants={reduceMotion ? undefined : listVariants}
                className="mt-2 flex flex-col"
              >
                {navLinks.map((item) => (
                  <motion.li
                    key={item.href}
                    variants={reduceMotion ? undefined : itemVariants}
                  >
                    <AppLink
                      href={item.href}
                      prefetchPolicy="intent"
                      className={`${linkClassName()} leading-[30px]`}
                    >
                      {item.label}
                    </AppLink>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              variants={reduceMotion ? undefined : columnVariants}
              className="relative mx-auto mb-4 h-[200px] w-full max-w-[360px] lg:hidden"
            >
              <Image
                src={FOOTER_DISH}
                alt=""
                width={360}
                height={200}
                className="mx-auto h-[200px] w-auto max-w-full object-contain"
              />
            </motion.div>
          </motion.div>

          <FooterBottomBar
            brand={dictionary.brand}
            locale={locale}
            year={year}
            footer={footer}
            reduceMotion={reduceMotion}
          />
        </div>
      </motion.footer>
    </div>
  );
}
