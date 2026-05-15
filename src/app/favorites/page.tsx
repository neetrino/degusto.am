import { permanentRedirect } from 'next/navigation';

/**
 * Legacy `/favorites` URL (bookmarks, old clients). Wishlist lives at `/wishlist`.
 * A real route avoids RSC prefetch 404s when config redirects are skipped or absent.
 */
export default function FavoritesLegacyRedirect() {
  permanentRedirect('/wishlist');
}
