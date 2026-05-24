'use client';

import { LanguageCurrencySwitcher } from '../LanguageCurrencySwitcher';

type MobileHomeHeaderActionsProps = {
  switcherIconSrc: string;
};

export function MobileHomeHeaderActions({ switcherIconSrc }: MobileHomeHeaderActionsProps) {
  return (
    <LanguageCurrencySwitcher variant="mobile" iconSrc={switcherIconSrc} />
  );
}
