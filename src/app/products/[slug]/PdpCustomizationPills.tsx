'use client';

import { ChevronDown, Minus, Plus } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import {
  PDP_CUSTOMIZATION_ADD_PILL_CLASS,
  PDP_CUSTOMIZATION_DROPDOWN_MAX_WIDTH_REM,
  PDP_CUSTOMIZATION_DROPDOWN_OFFSET_PX,
  PDP_CUSTOMIZATION_DROPDOWN_Z_CLASS,
  PDP_CUSTOMIZATION_EXCLUDE_PILL_CLASS,
  PDP_FIGMA_ORANGE,
  PDP_FIGMA_PILL_BG,
  PDP_PILL_RADIUS_CLASS,
} from '@/constants/pdp-figma-tokens';
import type { Product } from './types';
import {
  isCustomizationSelected,
  parseCustomizationSelection,
  stripConflictingCustomizationLabels,
  toggleCustomizationSelection,
} from './utils/pdp-customization-selection';
import {
  resolvePdpCustomizationIngredients,
  type PdpCustomizationIngredientOption,
} from './utils/resolve-pdp-customization-ingredients';

interface PdpCustomizationPillsProps {
  product: Product;
  language: LanguageCode;
  additions: string;
  exclusions: string;
  onAdditionsChange: (value: string) => void;
  onExclusionsChange: (value: string) => void;
}

type PillKind = 'additions' | 'exclusions';

type OppositeMarker = 'plus' | 'minus';

interface CustomizationPillProps {
  kind: PillKind;
  language: LanguageCode;
  value: string;
  options: PdpCustomizationIngredientOption[];
  oppositeSelectedLabels: string[];
  oppositeMarker: OppositeMarker;
  onChange: (value: string) => void;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

const PILL_SIZE_CLASS: Record<PillKind, string> = {
  additions: `${PDP_CUSTOMIZATION_ADD_PILL_CLASS} max-lg:w-full max-lg:max-w-[12.1875rem]`,
  exclusions: `${PDP_CUSTOMIZATION_EXCLUDE_PILL_CLASS} max-lg:w-full max-lg:max-w-[10.9375rem]`,
};

const DROPDOWN_MAX_WIDTH_PX = PDP_CUSTOMIZATION_DROPDOWN_MAX_WIDTH_REM * 16;

function CustomizationOppositeMarker({ marker }: { marker: OppositeMarker }) {
  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: PDP_FIGMA_ORANGE }}
      aria-hidden
    >
      {marker === 'plus' ? (
        <Plus className="h-2.5 w-2.5" strokeWidth={3} />
      ) : (
        <Minus className="h-2.5 w-2.5" strokeWidth={3} />
      )}
    </span>
  );
}

function usePortalTarget(): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.body);
  }, []);

  return target;
}

function useDropdownPosition(
  open: boolean,
  triggerRef: RefObject<HTMLButtonElement | null>
): DropdownPosition | null {
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }
      const rect = trigger.getBoundingClientRect();
      setPosition({
        top: rect.bottom + PDP_CUSTOMIZATION_DROPDOWN_OFFSET_PX,
        left: rect.left,
        width: Math.min(rect.width, DROPDOWN_MAX_WIDTH_PX),
      });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, triggerRef]);

  return position;
}

function CustomizationPill({
  kind,
  language,
  value,
  options,
  oppositeSelectedLabels,
  oppositeMarker,
  onChange,
}: CustomizationPillProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const portalTarget = usePortalTarget();
  const position = useDropdownPosition(open, triggerRef);
  const isAdditions = kind === 'additions';
  const label = isAdditions
    ? t(language, 'product.customizationAddShort')
    : t(language, 'product.customizationExcludeShort');
  const selectedCount = value.split(',').map((item) => item.trim()).filter(Boolean).length;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const dropdownPanel =
    open && portalTarget && position ? (
      <div
        ref={panelRef}
        id={panelId}
        className={`fixed ${PDP_CUSTOMIZATION_DROPDOWN_Z_CLASS} rounded-[1.25rem] border border-[#dedede] bg-white p-3 shadow-lg`}
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        <ul className="max-h-56 space-y-1 overflow-y-auto">
          {options.map((option) => {
            const inputId = `${panelId}-${option.id}`;
            const checked = isCustomizationSelected(value, option.label);
            const reservedInOpposite = oppositeSelectedLabels.includes(option.label);

            if (reservedInOpposite) {
              const reservedLabel =
                oppositeMarker === 'plus'
                  ? t(language, 'product.customizationAddShort')
                  : t(language, 'product.customizationExcludeShort');
              return (
                <li key={option.id}>
                  <div
                    className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-[#868686]"
                    aria-label={`${option.label} — ${reservedLabel}`}
                  >
                    <CustomizationOppositeMarker marker={oppositeMarker} />
                    <span>{option.label}</span>
                  </div>
                </li>
              );
            }

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
                    onChange={() => onChange(toggleCustomizationSelection(value, option.label))}
                    className="pdp-preference-checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  return (
    <div className={`relative min-w-0 shrink-0 ${open ? PDP_CUSTOMIZATION_DROPDOWN_Z_CLASS : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex shrink-0 items-center ${PILL_SIZE_CLASS[kind]} ${PDP_PILL_RADIUS_CLASS}`}
        style={{ backgroundColor: PDP_FIGMA_PILL_BG }}
      >
        <span
          className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: PDP_FIGMA_ORANGE }}
          aria-hidden
        >
          {isAdditions ? (
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          ) : (
            <Minus className="h-5 w-5" strokeWidth={2.5} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate pl-2 text-left text-base font-medium text-black">
          {label}
          {selectedCount > 0 ? ` (${selectedCount})` : ''}
        </span>
        <ChevronDown
          className={`mr-2 h-[30px] w-[30px] shrink-0 text-black transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
      {dropdownPanel && portalTarget ? createPortal(dropdownPanel, portalTarget) : null}
    </div>
  );
}

export function PdpCustomizationPills({
  product,
  language,
  additions,
  exclusions,
  onAdditionsChange,
  onExclusionsChange,
}: PdpCustomizationPillsProps) {
  const ingredientOptions = resolvePdpCustomizationIngredients(product, language);
  if (ingredientOptions.length === 0) {
    return null;
  }

  const additionLabels = parseCustomizationSelection(additions);
  const exclusionLabels = parseCustomizationSelection(exclusions);

  const handleAdditionsChange = (next: string) => {
    onAdditionsChange(next);
    onExclusionsChange(stripConflictingCustomizationLabels(exclusions, parseCustomizationSelection(next)));
  };

  const handleExclusionsChange = (next: string) => {
    onExclusionsChange(next);
    onAdditionsChange(stripConflictingCustomizationLabels(additions, parseCustomizationSelection(next)));
  };

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
      <CustomizationPill
        kind="additions"
        language={language}
        value={additions}
        options={ingredientOptions}
        oppositeSelectedLabels={exclusionLabels}
        oppositeMarker="minus"
        onChange={handleAdditionsChange}
      />
      <CustomizationPill
        kind="exclusions"
        language={language}
        value={exclusions}
        options={ingredientOptions}
        oppositeSelectedLabels={additionLabels}
        oppositeMarker="plus"
        onChange={handleExclusionsChange}
      />
    </div>
  );
}
