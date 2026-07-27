import { Heart } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { Locale } from "@/lib/i18n/config";

type WishlistHeaderLinkProps = {
  locale: Locale;
  label: string;
  count: number;
  className?: string;
  iconClassName?: string;
};

export function WishlistHeaderLink({
  locale,
  label,
  count,
  className = "relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition-colors duration-150 hover:text-gray-900",
  iconClassName = "h-5 w-5",
}: WishlistHeaderLinkProps) {
  return (
    <AppLink
      href={`/${locale}/wishlist`}
      prefetchPolicy="intent"
      aria-label={label}
      className={`relative ${className}`}
    >
      <Heart className={iconClassName} aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </AppLink>
  );
}
