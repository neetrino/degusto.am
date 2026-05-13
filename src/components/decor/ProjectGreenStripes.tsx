/** Default framing (home + PDP baseline): same path, rotation, stroke. */
const FIRST_STRIPE_TOP_DEFAULT = 'top-[-450px]';
const FIRST_STRIPE_HEIGHT_DEFAULT = 'h-[1512.29px]';
/**
 * PDP only: shift first stroke up and give the SVG a bit more height so more of the
 * same curve shows above — same asset/styling, not a different “look”.
 */
const FIRST_STRIPE_TOP_EXTENDED_UP = 'top-[-580px]';
const FIRST_STRIPE_HEIGHT_EXTENDED_UP = 'h-[1680px]';

export type ProjectGreenStripesProps = {
  /** Reveal more of the upper part of the first stroke (same SVG, stronger negative `top`). */
  extendFirstStrokeUp?: boolean;
};

/**
 * Decorative green strokes from the home hero (Figma), stroke `#3E573D`.
 * Place inside a `relative` container; sits under content via sibling `z-10`.
 */
export function ProjectGreenStripes({ extendFirstStrokeUp = false }: ProjectGreenStripesProps) {
  const firstTop = extendFirstStrokeUp ? FIRST_STRIPE_TOP_EXTENDED_UP : FIRST_STRIPE_TOP_DEFAULT;
  const firstHeight = extendFirstStrokeUp ? FIRST_STRIPE_HEIGHT_EXTENDED_UP : FIRST_STRIPE_HEIGHT_DEFAULT;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="725"
        height="450"
        viewBox="0 0 725 450"
        fill="none"
        aria-hidden
        className={`pointer-events-none absolute left-[-120px] ${firstTop} z-0 ${firstHeight} w-[678.855px] origin-center rotate-[20deg] opacity-100`}
      >
        <path
          d="M-387.936 202.028C-387.936 202.028 119.69 546.315 464.803 275C809.917 3.68502 577.568 -962.001 577.568 -962.001"
          stroke="#3E573D"
          strokeWidth="141"
          strokeLinecap="square"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="211"
        height="985"
        viewBox="0 0 211 985"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute right-[-170px] top-[-1px] z-0 h-[979.275px] w-[611.208px] origin-center rotate-[2deg] opacity-100"
      >
        <path
          d="M537.749 -25.8738C537.749 -25.8738 56.6915 174.312 70.8068 462.466C84.9222 750.619 850.632 902.127 850.632 902.127"
          stroke="#3E573D"
          strokeWidth="141"
          strokeLinecap="square"
        />
      </svg>
    </>
  );
}
