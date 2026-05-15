/** MDI heart glyph (24dp) — matches header / related cards. */
const WISHLIST_HEART_PATH_MDI =
  'M12,21.35L10.55,20.03C5.4,15.36,2,12.28,2,8.5C2,5.42,4.42,3,7.5,3C9.24,3,10.91,3.81,12,5.08C13.09,3.81,14.76,3,16.5,3C19.58,3,22,5.42,22,8.5C22,12.28,18.6,15.36,13.45,20.04L12,21.35Z';

export interface WishlistHeartIconProps {
  filled: boolean;
  size: number;
}

/**
 * Product-card heart: outline when empty, solid when saved (uses `currentColor`).
 */
export function WishlistHeartIcon({ filled, size }: WishlistHeartIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d={WISHLIST_HEART_PATH_MDI}
        fill={filled ? 'currentColor' : 'none'}
        stroke={filled ? 'none' : 'currentColor'}
        strokeWidth={filled ? 0 : 1.65}
        strokeLinejoin="round"
      />
    </svg>
  );
}
