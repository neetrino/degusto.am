"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  ProductModifierOptionRow,
  type ProductModifierOption,
} from "@/features/products/ui/ProductModifierOptionRow";

export type { ProductModifierOption };

type ModifierKind = "add" | "exclude";

type ProductModifierPillsProps = {
  addLabel: string;
  excludeLabel: string;
  /** Explains that exclude options are base ingredients to leave out. */
  excludeHint?: string;
  emptyAddLabel: string;
  emptyExcludeLabel: string;
  addOptions?: ReadonlyArray<ProductModifierOption>;
  excludeOptions?: ReadonlyArray<ProductModifierOption>;
  /** Fires when addition selection changes (for live unit-price updates). */
  onSelectedAddChange?: (selectedIds: ReadonlySet<string>) => void;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * PDP Ավելացնել / Բացառել pills.
 * Exclude options are the dish’s base ingredients; checking one means
 * leave it out of the prepared product (UI-only until cart API wires it).
 */
export function ProductModifierPills({
  addLabel,
  excludeLabel,
  excludeHint,
  emptyAddLabel,
  emptyExcludeLabel,
  addOptions = [],
  excludeOptions = [],
  onSelectedAddChange,
}: ProductModifierPillsProps) {
  const [open, setOpen] = useState<ModifierKind | null>(null);
  const [selectedAdd, setSelectedAdd] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [selectedExclude, setSelectedExclude] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const showAdd = addOptions.length > 0;
  const showExclude = excludeOptions.length > 0;
  if (!showAdd && !showExclude) {
    return null;
  }

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
      {showAdd ? (
        <ModifierPill
          label={addLabel}
          emptyLabel={emptyAddLabel}
          options={addOptions}
          selected={selectedAdd}
          open={open === "add"}
          onOpenChange={(next) => setOpen(next ? "add" : null)}
          onToggle={(id) => {
            const next = toggleId(selectedAdd, id);
            setSelectedAdd(next);
            onSelectedAddChange?.(next);
          }}
          widthClassName="w-full sm:w-[12.1875rem]"
          icon={<Plus className="size-5" strokeWidth={2.5} aria-hidden />}
        />
      ) : null}
      {showExclude ? (
        <ModifierPill
          label={excludeLabel}
          emptyLabel={emptyExcludeLabel}
          hint={excludeHint}
          options={excludeOptions}
          selected={selectedExclude}
          open={open === "exclude"}
          onOpenChange={(next) => setOpen(next ? "exclude" : null)}
          onToggle={(id) => {
            setSelectedExclude((prev) => toggleId(prev, id));
          }}
          widthClassName="w-full sm:w-[10.9375rem]"
          icon={<Minus className="size-5" strokeWidth={2.5} aria-hidden />}
        />
      ) : null}
    </div>
  );
}

type ModifierPillProps = {
  label: string;
  emptyLabel: string;
  hint?: string;
  options: ReadonlyArray<ProductModifierOption>;
  selected: ReadonlySet<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
  widthClassName: string;
  icon: ReactNode;
};

function ModifierPill({
  label,
  emptyLabel,
  hint,
  options,
  selected,
  open,
  onOpenChange,
  onToggle,
  widthClassName,
  icon,
}: ModifierPillProps) {
  const listId = useId();
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition(): void {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 300);
      const maxLeft = window.innerWidth - width - 12;
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(Math.max(12, rect.left), maxLeft),
        width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const selectedCount = selected.size;
  const displayLabel =
    selectedCount > 0 ? `${label} (${selectedCount})` : label;

  return (
    <div className="relative min-w-0 shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => onOpenChange(!open)}
        className={`relative flex h-12 shrink-0 items-center rounded-[70px] ${widthClassName}`}
        style={{ backgroundColor: "rgb(228, 228, 228)" }}
      >
        <span
          className="ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: "rgb(255, 127, 32)" }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate pl-2 text-left text-base font-medium text-black">
          {displayLabel}
        </span>
        <ChevronDown
          className={`mr-3 size-5 shrink-0 text-black transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && position ? (
                <motion.div
                  ref={menuRef}
                  id={listId}
                  role="listbox"
                  aria-label={label}
                  className="fixed z-[9999] overflow-hidden rounded-[1.5rem] border border-[#e8e8e8] bg-[#f3f3f3] p-3 shadow-[0_22px_50px_-20px_rgba(60,47,47,0.45)]"
                  style={{
                    top: position.top,
                    left: position.left,
                    width: position.width,
                  }}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: -10, scale: 0.96, filter: "blur(8px)" }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { opacity: 0, y: -8, scale: 0.97, filter: "blur(5px)" }
                  }
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                >
                  {options.length === 0 ? (
                    <p className="px-3 py-2.5 text-sm text-[#717182]">
                      {emptyLabel}
                    </p>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-2">
                      {hint ? (
                        <p className="px-1 text-xs leading-relaxed text-[#717182]">
                          {hint}
                        </p>
                      ) : null}
                      <ul className="flex max-h-56 flex-col gap-2.5 overflow-y-auto overflow-x-hidden">
                        {options.map((option, index) => (
                          <ProductModifierOptionRow
                            key={option.id}
                            option={option}
                            checked={selected.has(option.id)}
                            index={index}
                            onToggle={() => onToggle(option.id)}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

function toggleId(
  prev: ReadonlySet<string>,
  id: string,
): ReadonlySet<string> {
  const next = new Set(prev);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
