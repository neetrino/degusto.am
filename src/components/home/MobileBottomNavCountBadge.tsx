const MOBILE_BOTTOM_NAV_BADGE_MAX = 99;

function formatNavBadgeCount(count: number): string {
  return count > MOBILE_BOTTOM_NAV_BADGE_MAX ? `${MOBILE_BOTTOM_NAV_BADGE_MAX}+` : String(count);
}

interface MobileBottomNavCountBadgeProps {
  count: number;
}

/** Orange count pill for mobile bottom navigation (cart / wishlist). */
export function MobileBottomNavCountBadge({ count }: MobileBottomNavCountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-2 top-0 z-[2] inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#f66812] px-1"
    >
      <span className="text-[10px] font-bold leading-none text-white">
        {formatNavBadgeCount(count)}
      </span>
    </span>
  );
}
