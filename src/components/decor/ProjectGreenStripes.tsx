/** Default framing (home + PDP baseline): same path, rotation, stroke. */
/** lg/xl: less negative top + inset left so the arc shows in the top-left corner. */
const FIRST_STRIPE_TOP_DEFAULT = 'top-[-200px] xl:top-[-340px] 2xl:top-[-450px]';
const FIRST_STRIPE_HEIGHT_DEFAULT = 'h-[1512.29px]';
/**
 * PDP only: shift first stroke up and give the SVG a bit more height so more of the
 * same curve shows above — same asset/styling, not a different “look”.
 */
const FIRST_STRIPE_TOP_EXTENDED_UP = 'top-[-320px] xl:top-[-460px] 2xl:top-[-580px]';
const FIRST_STRIPE_HEIGHT_EXTENDED_UP = 'h-[1680px]';

/** lg–xl (iPad landscape / compact desktop): smaller strokes; full Figma size from 2xl. */
const STRIPE_COMPACT_SCALE_CLASS = 'scale-[0.52] xl:scale-[0.68] 2xl:scale-100';
const FIRST_STRIPE_POSITION_CLASS =
  'left-0 origin-top-left xl:left-[-72px] 2xl:left-[-120px]';
const SECOND_STRIPE_POSITION_CLASS =
  'right-[-96px] origin-top-right xl:right-[-130px] 2xl:right-[-170px]';

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
        className={`pointer-events-none absolute ${FIRST_STRIPE_POSITION_CLASS} ${firstTop} z-[1] ${firstHeight} w-[678.855px] ${STRIPE_COMPACT_SCALE_CLASS} rotate-[20deg] opacity-100`}
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
        className={`pointer-events-none absolute ${SECOND_STRIPE_POSITION_CLASS} top-[-1px] z-[1] h-[979.275px] w-[611.208px] ${STRIPE_COMPACT_SCALE_CLASS} rotate-[2deg] opacity-100`}
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
