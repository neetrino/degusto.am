"use client";

import Image from "next/image";

import styles from "@/features/products/ui/shop/DietSwitcher.module.css";

export type DietSwitcherMode = "spicy" | "none" | "veg";

type DietSwitcherProps = {
  value: DietSwitcherMode;
  onChange: (next: DietSwitcherMode) => void;
  ariaLabel: string;
  spicyLabel: string;
  noneLabel: string;
  vegetarianLabel: string;
};

/** Horizontal offset (px) of the floating ball for each mode. */
const BALL_X: Record<DietSwitcherMode, number> = {
  spicy: 4,
  none: 53,
  veg: 101,
};

const LABEL_CLASS: Record<DietSwitcherMode, string> = {
  spicy: styles.labelSpicy ?? "",
  none: styles.labelNone ?? "",
  veg: styles.labelVeg ?? "",
};

/**
 * Figma Switcher (64:1692).
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
        aria-checked={value === "spicy"}
        aria-label={spicyLabel}
        className={`${styles.hotButton} ${value === "spicy" ? styles.optionHidden : ""}`}
        onClick={() => onChange("spicy")}
        tabIndex={value === "spicy" ? -1 : undefined}
        aria-hidden={value === "spicy"}
      >
        <span className={styles.hotIcon}>
          <span className={styles.hotPart1}>
            <Image
              src="/assets/shop/switcher-hot-1.webp"
              alt=""
              fill
              className="object-contain"
              aria-hidden
            />
          </span>
          <span className={styles.hotPart2}>
            <Image
              src="/assets/shop/switcher-hot-2.webp"
              alt=""
              fill
              className="object-contain"
              aria-hidden
            />
          </span>
          <span className={styles.hotPart3}>
            <Image
              src="/assets/shop/switcher-hot-3.webp"
              alt=""
              fill
              className="object-contain"
              aria-hidden
            />
          </span>
        </span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === "none"}
        aria-label={noneLabel}
        className={`${styles.iconButton} ${value === "none" ? styles.iconOnNeutral : styles.iconOnAccent}`}
        onClick={() => onChange("none")}
      >
        <svg
          className={styles.icon}
          width={22}
          height={22}
          viewBox="0 0 33 33"
          fill="none"
          aria-hidden
        >
          <path
            d="M26 6L7 26"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 6L26 26"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

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
        <Image
          src="/assets/shop/switcher-leaf.webp"
          alt=""
          width={26}
          height={29}
          className={styles.vectorIcon}
          aria-hidden
        />
      </button>
    </div>
  );
}
