import type { HTMLAttributes, ReactNode } from "react";

export function Surface({
  className = "",
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_4px_18px_rgba(15,31,51,0.06)] ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
