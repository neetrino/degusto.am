'use client';

import { ChevronDown, Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { t } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import {
  PDP_CUSTOMIZATION_ADD_PILL_CLASS,
  PDP_CUSTOMIZATION_EXCLUDE_PILL_CLASS,
  PDP_FIGMA_ORANGE,
  PDP_FIGMA_PILL_BG,
  PDP_PILL_RADIUS_CLASS,
} from '@/constants/pdp-figma-tokens';

interface PdpCustomizationPillsProps {
  language: LanguageCode;
  additions: string;
  exclusions: string;
  onAdditionsChange: (value: string) => void;
  onExclusionsChange: (value: string) => void;
}

type PillKind = 'additions' | 'exclusions';

interface CustomizationPillProps {
  kind: PillKind;
  language: LanguageCode;
  value: string;
  onChange: (value: string) => void;
}

const PILL_SIZE_CLASS: Record<PillKind, string> = {
  additions: `${PDP_CUSTOMIZATION_ADD_PILL_CLASS} max-lg:w-full max-lg:max-w-[12.1875rem]`,
  exclusions: `${PDP_CUSTOMIZATION_EXCLUDE_PILL_CLASS} max-lg:w-full max-lg:max-w-[10.9375rem]`,
};

function CustomizationPill({ kind, language, value, onChange }: CustomizationPillProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const isAdditions = kind === 'additions';
  const label = isAdditions
    ? t(language, 'product.customizationAddShort')
    : t(language, 'product.customizationExcludeShort');
  const placeholder = isAdditions
    ? t(language, 'product.additionsPlaceholder')
    : t(language, 'product.exclusionsPlaceholder');

  return (
    <div className="min-w-0 shrink-0">
      <button
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
        </span>
        <ChevronDown
          className={`mr-2 h-[30px] w-[30px] shrink-0 text-black transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="mt-2 w-full min-w-[12.1875rem] max-w-[20rem]">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#3c2f2f] outline-none transition focus:border-[#ff7f20] focus:ring-2 focus:ring-[#ff7f20]/20"
          />
        </div>
      ) : null}
    </div>
  );
}

export function PdpCustomizationPills({
  language,
  additions,
  exclusions,
  onAdditionsChange,
  onExclusionsChange,
}: PdpCustomizationPillsProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
      <CustomizationPill
        kind="additions"
        language={language}
        value={additions}
        onChange={onAdditionsChange}
      />
      <CustomizationPill
        kind="exclusions"
        language={language}
        value={exclusions}
        onChange={onExclusionsChange}
      />
    </div>
  );
}
