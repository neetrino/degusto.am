/** Figma node 10:2587 — mdi:heart in wishlist pill (10:2278). */
const PDP_HEART_PATH =
  'M14.5 25.7979L12.7479 24.2029C6.525 18.56 2.41667 14.8262 2.41667 10.2708C2.41667 6.53708 5.34083 3.625 9.0625 3.625C11.165 3.625 13.1829 4.60375 14.5 6.13833C15.8171 4.60375 17.835 3.625 19.9375 3.625C23.6592 3.625 26.5833 6.53708 26.5833 10.2708C26.5833 14.8262 22.475 18.56 16.2521 24.2029L14.5 25.7979Z';

export function PdpActionHeartIcon() {
  return (
    <svg
      width={29}
      height={29}
      viewBox="0 0 29 29"
      className="shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d={PDP_HEART_PATH} fill="currentColor" />
    </svg>
  );
}
