/**
 * Flies a small product thumbnail from a source element toward the header cart target.
 * Respects `prefers-reduced-motion`. No-op on server or missing source.
 */

export type CartFlyAnimationOptions = {
  fromElement?: Element | null;
  imageUrl?: string | null;
};

const CART_FLY_TARGET_SELECTOR = '[data-cart-fly-target]';

/** Public so Header can match suppress-scroll duration to the fly animation. */
export const CART_FLY_ANIMATION_DURATION_MS = 680;

/** Header listens for this to briefly disable transform transitions during the fly (top bar scroll state unchanged). */
export const HEADER_REVEAL_FOR_CART_EVENT = 'header-reveal-for-cart';

function dispatchHeaderRevealForCart(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(HEADER_REVEAL_FOR_CART_EVENT));
}
const FLY_START_SIZE_PX = 52;
const FLY_END_SIZE_PX = 20;
const FLY_ARC_BOOST_PX = 64;
const FALLBACK_TOP_PX = 72;
const FALLBACK_RIGHT_INSET_PX = 24;
const FALLBACK_SIZE_PX = 40;

function hasNonZeroSize(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

function isTargetVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (typeof el.checkVisibility === 'function') {
    return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  }
  return hasNonZeroSize(el.getBoundingClientRect());
}

function findVisibleCartTargetRectWithin(root: ParentNode): DOMRect | null {
  const nodes = root.querySelectorAll(CART_FLY_TARGET_SELECTOR);
  for (const node of nodes) {
    if (!isTargetVisible(node)) continue;
    const rect = node.getBoundingClientRect();
    if (hasNonZeroSize(rect)) return rect;
  }
  return null;
}

function getVisibleCartTargetRect(): DOMRect | null {
  const mainNav = document.querySelector('header.fixed');
  if (mainNav) {
    const inMainNav = findVisibleCartTargetRectWithin(mainNav);
    if (inMainNav) return inMainNav;
  }
  return findVisibleCartTargetRectWithin(document);
}

function getFallbackTargetRect(): DOMRect {
  const left = window.innerWidth - FALLBACK_RIGHT_INSET_PX - FALLBACK_SIZE_PX;
  return new DOMRect(left, FALLBACK_TOP_PX, FALLBACK_SIZE_PX, FALLBACK_SIZE_PX);
}

/**
 * Measuring `[data-cart-fly-target]` in the same sync turn as the click can run
 * before layout; wait until after the next frame(s) so the committed DOM includes
 * the cart icon rect.
 */
function scheduleAfterHeaderLayoutCommit(run: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

/** Prefer the bitmap already painted in the product block (Next/Image → real <img>, correct srcset). */
function resolveFlyImageFromElement(fromElement: HTMLElement): {
  url: string;
  objectFit: string;
  objectPosition: string;
} | null {
  const MIN_AREA_PX = 16;
  const imgs = fromElement.querySelectorAll('img');
  let best: HTMLImageElement | null = null;
  let bestArea = 0;

  for (const node of imgs) {
    if (!(node instanceof HTMLImageElement)) continue;
    const rect = node.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area < MIN_AREA_PX) continue;

    const url = (node.currentSrc || node.src || '').trim();
    if (!url) continue;

    if (area > bestArea) {
      bestArea = area;
      best = node;
    }
  }

  if (!best) {
    return null;
  }

  const computed = window.getComputedStyle(best);
  return {
    url: (best.currentSrc || best.src).trim(),
    objectFit: computed.objectFit || 'cover',
    objectPosition: computed.objectPosition || '50% 50%',
  };
}

function appendFlyShell(
  imageUrl: string | null | undefined,
  display?: { objectFit: string; objectPosition: string } | null
): HTMLDivElement {
  const shell = document.createElement('div');
  shell.style.position = 'fixed';
  shell.style.borderRadius = '50%';
  shell.style.overflow = 'hidden';
  shell.style.zIndex = '10000';
  shell.style.pointerEvents = 'none';
  shell.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.18)';
  shell.setAttribute('aria-hidden', 'true');

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '';
    img.draggable = false;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = display?.objectFit ?? 'cover';
    img.style.objectPosition = display?.objectPosition ?? '50% 50%';
    img.style.display = 'block';
    shell.appendChild(img);
  } else {
    shell.style.background = 'linear-gradient(145deg, rgb(17 24 39) 0%, rgb(75 85 99) 100%)';
  }

  document.body.appendChild(shell);
  return shell;
}

/**
 * Plays the fly-to-cart animation. Safe to call from click handlers (client-only).
 */
export function playCartFlyAnimation(options: CartFlyAnimationOptions): void {
  dispatchHeaderRevealForCart();

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const source = options.fromElement;
  if (!(source instanceof HTMLElement)) {
    return;
  }

  const fromRect = source.getBoundingClientRect();
  if (!hasNonZeroSize(fromRect)) {
    return;
  }

  const startFly = () => {
    if (!source.isConnected) {
      return;
    }

    const from = source.getBoundingClientRect();
    if (!hasNonZeroSize(from)) {
      return;
    }

    const targetRect = getVisibleCartTargetRect() ?? getFallbackTargetRect();

    const fromCx = from.left + from.width / 2;
    const fromCy = from.top + from.height / 2;
    const toCx = targetRect.left + targetRect.width / 2;
    const toCy = targetRect.top + targetRect.height / 2;

    const startLeft = fromCx - FLY_START_SIZE_PX / 2;
    const startTop = fromCy - FLY_START_SIZE_PX / 2;
    const deltaX = toCx - fromCx;
    const deltaY = toCy - fromCy;

    const fromDomImage = resolveFlyImageFromElement(source);
    const resolvedUrl = fromDomImage?.url ?? options.imageUrl?.trim() ?? null;
    const shell = appendFlyShell(resolvedUrl, fromDomImage);
    shell.style.left = `${startLeft}px`;
    shell.style.top = `${startTop}px`;
    shell.style.width = `${FLY_START_SIZE_PX}px`;
    shell.style.height = `${FLY_START_SIZE_PX}px`;

    const scaleEnd = FLY_END_SIZE_PX / FLY_START_SIZE_PX;
    const midDx = deltaX * 0.52;
    const midDy = deltaY * 0.48 - FLY_ARC_BOOST_PX;

    const animation = shell.animate(
      [
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
        { transform: `translate(${midDx}px, ${midDy}px) scale(0.82)`, opacity: 1 },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleEnd})`, opacity: 0.92 },
      ],
      {
        duration: CART_FLY_ANIMATION_DURATION_MS,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      shell.remove();
    };
  };

  scheduleAfterHeaderLayoutCommit(startFly);
}
