import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-paper shadow-[0_1px_2px_rgba(27,26,23,0.25)] hover:bg-[#2e2c27] active:bg-black",
  secondary:
    "bg-surface text-ink border border-line-strong/80 shadow-[0_1px_1px_rgba(27,26,23,0.04)] hover:bg-paper hover:border-line-strong",
  ghost: "text-ink-soft hover:text-ink hover:bg-paper-deep/60",
  danger: "bg-danger text-white hover:bg-[#8a3027]",
  accent: "bg-accent-soft text-accent-strong hover:bg-[#dcebe1]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-9.5 px-3.5 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-sm rounded-xl gap-2",
  icon: "size-9 rounded-lg",
  "icon-sm": "size-7 rounded-md",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
