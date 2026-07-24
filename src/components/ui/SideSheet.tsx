"use client";

import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/** Must match `.animate-side-sheet-panel-*` duration in globals.css. */
export const SIDE_SHEET_ANIMATION_MS = 300;

type SideSheetProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  /** Width classes applied to the docked panel (default: `w-full max-w-md`). */
  panelClassName?: string;
  side?: "left" | "right";
  zIndexClassName?: string;
  /** External circle (default) or MaMarie-style edge tab. */
  closeVariant?: "circle" | "edge-tab";
  /** Soften backdrop (cart-style). */
  backdropBlur?: boolean;
};

/**
 * Full-viewport-height side sheet docked to the left/right edge.
 * Open/close use the same 300ms keyframe motion (mirrored slide).
 */
export function SideSheet({
  open,
  onClose,
  ariaLabel,
  children,
  panelClassName = "w-full max-w-md",
  side = "right",
  zIndexClassName = "z-50",
  closeVariant = "circle",
  backdropBlur = false,
}: SideSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [displayAriaLabel, setDisplayAriaLabel] = useState(ariaLabel);
  const exitDoneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDisplayChildren(children);
    setDisplayAriaLabel(ariaLabel);
  }, [open, children, ariaLabel]);

  useEffect(() => {
    if (open) {
      exitDoneRef.current = false;
      setExiting(false);
      setRendered(true);
      return;
    }

    if (!rendered) return;

    setExiting(true);
    const timer = window.setTimeout(() => {
      finishExit();
    }, SIDE_SHEET_ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rendered, onClose]);

  function finishExit(): void {
    if (exitDoneRef.current) return;
    exitDoneRef.current = true;
    setRendered(false);
    setExiting(false);
  }

  function handlePanelAnimationEnd(
    event: AnimationEvent<HTMLDivElement>,
  ): void {
    if (event.target !== event.currentTarget) return;
    if (!event.animationName.includes("side-sheet-panel-out")) return;
    finishExit();
  }

  if (!mounted || !rendered) return null;

  const isRight = side === "right";
  const edgeClass = isRight ? "right-0" : "left-0";
  const panelRadius = isRight
    ? "rounded-l-[var(--radius)]"
    : "rounded-r-[var(--radius)]";
  const closePosition = isRight ? "right-full" : "left-full";
  const CloseChevron = isRight ? ChevronLeft : ChevronRight;

  const backdropClass = exiting
    ? "animate-sheet-backdrop-out"
    : "animate-sheet-backdrop-in";
  const panelMotionClass = exiting
    ? isRight
      ? "animate-side-sheet-panel-out-right"
      : "animate-side-sheet-panel-out-left"
    : isRight
      ? "animate-side-sheet-panel-in-right"
      : "animate-side-sheet-panel-in-left";

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label={displayAriaLabel}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 ${
          backdropBlur ? "backdrop-blur-sm" : ""
        } ${backdropClass}`}
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 ${edgeClass} z-[1] flex h-dvh max-h-dvh ${panelMotionClass} ${panelClassName}`}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        {closeVariant === "edge-tab" ? (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-1/2 ${closePosition} z-10 flex h-[38px] w-10 -translate-y-1/2 items-center justify-center bg-gray-900 text-white transition-transform hover:scale-105 ${
              isRight
                ? "rounded-l-full rounded-r-none"
                : "rounded-r-full rounded-l-none"
            }`}
            aria-label="Close"
          >
            <CloseChevron className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-5 ${closePosition} z-10 flex h-10 w-10 shrink-0 items-center justify-center bg-gray-900 text-white transition-colors hover:bg-black ${
              isRight
                ? "rounded-l-full rounded-r-none"
                : "rounded-r-full rounded-l-none"
            }`}
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
        <div
          className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-white shadow-2xl ${panelRadius}`}
          onClick={(event) => event.stopPropagation()}
        >
          {displayChildren}
        </div>
      </div>
    </div>,
    document.body,
  );
}
