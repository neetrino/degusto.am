import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1f3a22] text-[#fffdf8] hover:bg-[#19311c] focus:ring-[#1f3a22]",
  secondary:
    "border border-[#ead7bf] bg-white text-[#1f1a17] hover:bg-[#fff4eb] focus:ring-[#ff7f20]",
  outline:
    "border border-[#ead7bf] bg-transparent text-[#1f1a17] hover:bg-[#fff4eb] focus:ring-[#ff7f20]",
  ghost:
    "bg-transparent text-[#1f1a17] hover:bg-[#fff4eb] focus:ring-[#ff7f20]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`cursor-pointer rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
