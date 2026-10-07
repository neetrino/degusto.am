const DOCK_PATH =
  "M48 0H98C110 0 119 5 128 14C142 28 160 39 187.5 39C215 39 233 28 247 14C256 5 265 0 277 0H327A37 37 0 0 1 327 74H48A37 37 0 0 1 48 0Z";

/**
 * Dark dock background with a notch for the center shop disc; notch shoulders are rounded.
 */
export function MobileBottomNavDock() {
  return (
    <svg
      viewBox="0 0 375 80"
      width={375}
      height={80}
      className="absolute bottom-0 left-0 h-20 w-[375px] max-w-none drop-shadow-[0_4px_10px_rgb(0_0_0/0.12)]"
      aria-hidden
      focusable="false"
    >
      <path d={DOCK_PATH} fill="#0b0b0b" />
    </svg>
  );
}
