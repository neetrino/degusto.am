import { staticAssetUrl } from "@/lib/media/static-asset-url";

export const ABOUT_HERO_IMAGE = staticAssetUrl("/assets/about/about-hero.webp");
export const ABOUT_MISSION_IMAGE = staticAssetUrl("/assets/about/about-mission-interior.webp");

export const ABOUT_STAT_ICONS = {
  users: staticAssetUrl("/assets/about/about-stats-users.webp"),
  cloche: staticAssetUrl("/assets/about/about-stats-cloche.webp"),
  star: staticAssetUrl("/assets/about/about-stats-star.webp"),
  location: staticAssetUrl("/assets/about/about-stats-location.webp"),
} as const;

export type AboutStatIconKey = keyof typeof ABOUT_STAT_ICONS;
