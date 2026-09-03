export const OPEN_CART_DRAWER_EVENT = "degusto:open-cart-drawer";

type OpenCartDrawerSource = "reorder" | "unknown";

type OpenCartDrawerEventDetail = {
  source: OpenCartDrawerSource;
};

export function requestOpenCartDrawer(source: OpenCartDrawerSource): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OpenCartDrawerEventDetail>(OPEN_CART_DRAWER_EVENT, {
      detail: { source },
    }),
  );
}
