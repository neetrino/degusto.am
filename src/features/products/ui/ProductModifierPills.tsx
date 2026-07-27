"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ProductModifierOption = {
  id: string;
  label: string;
  /** Optional surcharge label, e.g. "+550 Դ". */
  priceLabel?: string;
};

type ModifierKind = "add" | "exclude";

type ProductModifierPillsProps = {
  addLabel: string;
  excludeLabel: string;
  emptyLabel: string;
  addOptions?: ReadonlyArray<ProductModifierOption>;
  excludeOptions?: ReadonlyArray<ProductModifierOption>;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * PDP Ավելացնել / Բացառել preference pills (UI-only; selections do not
 * affect cart until a product-modifier API exists).
 */
export function ProductModifierPills({
  addLabel,
  excludeLabel,
  emptyLabel,
  addOptions = [],
  excludeOptions = [],
}: ProductModifierPillsProps) {
  const [open, setOpen] = useState<ModifierKind | null>(null);
  const [selectedAdd, setSelectedAdd] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [selectedExclude, setSelectedExclude] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
      <ModifierPill
        label={addLabel}
        emptyLabel={emptyLabel}
        options={addOptions}
        selected={selectedAdd}
        open={open === "add"}
        onOpenChange={(next) => setOpen(next ? "add" : null)}
        onToggle={(id) => {
          setSelectedAdd((prev) => toggleId(prev, id));
        }}
        widthClassName="w-[12.1875rem] max-lg:w-full max-lg:max-w-[12.1875rem]"
        icon={<Plus className="size-5" strokeWidth={2.5} aria-hidden />}
      />
      <ModifierPill
        label={excludeLabel}
        emptyLabel={emptyLabel}
        options={excludeOptions}
        selected={selectedExclude}
        open={open === "exclude"}
        onOpenChange={(next) => setOpen(next ? "exclude" : null)}
        onToggle={(id) => {
          setSelectedExclude((prev) => toggleId(prev, id));
        }}
        widthClassName="w-[10.9375rem] max-lg:w-full max-lg:max-w-[10.9375rem]"
        icon={<Minus className="size-5" strokeWidth={2.5} aria-hidden />}
      />
    </div>
  );
}

type ModifierPillProps = {
  label: string;
  emptyLabel: string;
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
  options,
  selected,
  open,
  onOpenChange,
  onToggle,
  widthClassName,
  icon,
}: ModifierPillProps) {
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition(): void {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 280);
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

      {typeof document !== "undefined" && open && position
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={label}
              className="fixed z-[9999] overflow-x-hidden rounded-[1.25rem] border border-[#dedede] bg-white p-3 shadow-lg"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
              }}
            >
              {options.length === 0 ? (
                <p className="px-2 py-2 text-sm text-[#717182]">{emptyLabel}</p>
              ) : (
                <ul className="max-h-56 space-y-1 overflow-x-hidden overflow-y-auto">
                  {options.map((option) => {
                    const checked = selected.has(option.id);
                    const inputId = `${listId}-${option.id}`;
                    return (
                      <li key={option.id}>
                        <label
                          htmlFor={inputId}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-[#3c2f2f] hover:bg-[#f7f7f7]"
                        >
                          <input
                            id={inputId}
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(option.id)}
                            className="size-4 shrink-0 accent-[#ff7f20]"
                          />
                          <span className="min-w-0 flex-1 break-words">
                            {option.label}
                          </span>
                          {option.priceLabel ? (
                            <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                              {option.priceLabel}
                            </span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>,
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
