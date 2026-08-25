"use client";

import Image from "next/image";

import { SHOW_DIET_UI } from "@/features/products/diet-ui";
import styles from "@/features/products/ui/shop/DietSwitcher.module.css";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

export type DietSwitcherMode = "spicy" | "none" | "veg";

type DietSwitcherProps = {
  value: DietSwitcherMode;
  onChange: (next: DietSwitcherMode) => void;
  ariaLabel: string;
  spicyLabel: string;
  noneLabel: string;
  vegetarianLabel: string;
};

/** Ball translate from `left: 4px` — centers over equal flex thirds. */
const BALL_X: Record<DietSwitcherMode, number> = {
  veg: 4,
  none: 49,
  spicy: 94,
};

const LABEL_CLASS: Record<DietSwitcherMode, string> = {
  spicy: styles.labelSpicy ?? "",
  none: styles.labelNone ?? "",
  veg: styles.labelVeg ?? "",
};

/**
 * Figma Switcher (64:1692) — leaf | none | spicy.
 * White ball floats to the selected option via CSS transform.
 */
export function DietSwitcher({
  value,
  onChange,
  ariaLabel,
  spicyLabel,
  noneLabel,
  vegetarianLabel,
}: DietSwitcherProps) {
  if (!SHOW_DIET_UI) {
    return null;
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={styles.switcher}
    >
      <div className={styles.label} aria-hidden>
        <div className={`${styles.label2} ${LABEL_CLASS[value]}`} />
      </div>

      <div
        className={styles.ball}
        style={{ transform: `translate3d(${BALL_X[value]}px, 0, 0)` }}
        aria-hidden
      />

      <button
        type="button"
        role="radio"
        aria-checked={value === "veg"}
        aria-label={vegetarianLabel}
        className={`${styles.vectorButton} ${value === "veg" ? styles.optionHidden : ""}`}
        onClick={() => onChange("veg")}
        tabIndex={value === "veg" ? -1 : undefined}
        aria-hidden={value === "veg"}
      >
        <span className={styles.leafIcon} aria-hidden />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === "none"}
        aria-label={noneLabel}
        className={`${styles.iconButton} ${value === "none" ? styles.iconOnNeutral : styles.iconOnAccent}`}
        onClick={() => onChange("none")}
      >
        <span className={styles.icon} aria-hidden />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === "spicy"}
        aria-label={spicyLabel}
        className={`${styles.hotButton} ${value === "spicy" ? styles.optionHidden : ""}`}
        onClick={() => onChange("spicy")}
        tabIndex={value === "spicy" ? -1 : undefined}
        aria-hidden={value === "spicy"}
      >
        <Image
          src={staticAssetUrl("/assets/shop/switcher-chili.webp")}
          alt=""
          width={24}
          height={24}
          className={styles.chiliIcon}
          aria-hidden
        />
      </button>
    </div>
  );
}
