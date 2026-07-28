export const ABOUT_HERO_IMAGE = "/assets/about/about-hero.webp";
export const ABOUT_MISSION_IMAGE = "/assets/about/about-mission-interior.webp";

export const ABOUT_STAT_ICONS = {
  users: "/assets/about/about-stats-users.webp",
  cloche: "/assets/about/about-stats-cloche.webp",
  star: "/assets/about/about-stats-star.webp",
  location: "/assets/about/about-stats-location.webp",
} as const;

export type AboutStatIconKey = keyof typeof ABOUT_STAT_ICONS;
