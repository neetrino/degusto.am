/** Header wishlist heart fill (design spec). */
const WISHLIST_HEADER_HEART_FILL = '#F55C0A';

/**
 * MDI "heart" glyph (24dp) — matches MDI raster style; vector avoids black matte on white circles.
 */
const WISHLIST_HEADER_HEART_PATH_MDI =
  'M12,21.35L10.55,20.03C5.4,15.36,2,12.28,2,8.5C2,5.42,4.42,3,7.5,3C9.24,3,10.91,3.81,12,5.08C13.09,3.81,14.76,3,16.5,3C19.58,3,22,5.42,22,8.5C22,12.28,18.6,15.36,13.45,20.04L12,21.35Z';

export interface WishlistHeaderHeartIconProps {
  /** Tailwind size classes (default ~28px in a 48px header circle). */
  className?: string;
}

/**
 * Header wishlist glyph: MDI heart shape, solid `#F55C0A`.
 */
export function WishlistHeaderHeartIcon({ className = 'h-7 w-7' }: WishlistHeaderHeartIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d={WISHLIST_HEADER_HEART_PATH_MDI} fill={WISHLIST_HEADER_HEART_FILL} />
    </svg>
  );
}
