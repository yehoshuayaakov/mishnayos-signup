"use client";

import type { ReactNode } from "react";
import {
  Button as RacButton,
  type ButtonProps as RacButtonProps,
} from "react-aria-components";
import { Spinner } from "@/components/ds/Spinner";

const variants = {
  primary:
    "border-transparent bg-[var(--navy-700)] text-white shadow-[0_1px_3px_rgba(15,31,51,0.25)] data-[hovered]:bg-[var(--navy-600)]",
  confirm:
    "border-transparent bg-[var(--green-700)] text-white data-[hovered]:bg-[#185736]",
  cancel: "border-transparent bg-[#eceef1] text-[var(--text)] data-[hovered]:bg-[#e2e5ea]",
  ghost:
    "border-[var(--border)] bg-transparent text-[var(--muted)] data-[hovered]:border-[var(--navy-600)] data-[hovered]:bg-[#f5f7fa] data-[hovered]:text-[var(--navy-700)]",
  danger:
    "border-transparent bg-[#8b3a3a] text-white data-[hovered]:bg-[#732f2f]",
} as const;

export type ButtonVariant = keyof typeof variants;

export function buttonClassName(variant: ButtonVariant = "primary") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold no-underline outline-none transition focus-visible:ring-3 focus-visible:ring-[rgb(46_89_132/0.18)] ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  isPending = false,
  isDisabled,
  children,
  ...props
}: RacButtonProps & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  isPending?: boolean;
}) {
  const sizes = {
    sm: "min-h-8 px-2.5 py-1 text-[0.82rem]",
    md: "min-h-9 px-4 py-[7px] text-[0.9rem]",
    lg: "min-h-10 px-5 py-2 text-[0.95rem]",
  };

  return (
    <RacButton
      {...props}
      isDisabled={isPending || isDisabled}
      aria-busy={isPending || undefined}
      className={[
        "inline-flex cursor-pointer appearance-none items-center justify-center gap-2 rounded-full border font-[inherit] font-semibold outline-none transition max-sm:min-h-11",
        "data-[focus-visible]:ring-3 data-[focus-visible]:ring-[rgb(46_89_132/0.18)]",
        isPending
          ? "cursor-progress"
          : "data-[disabled]:cursor-default data-[disabled]:opacity-60",
        sizes[size],
        variants[variant],
        className,
      ].join(" ")}
    >
      {isPending ? <Spinner /> : null}
      {children as ReactNode}
    </RacButton>
  );
}
