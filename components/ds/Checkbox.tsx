import type { ReactNode } from "react";
import { Checkbox as RacCheckbox, type CheckboxProps } from "react-aria-components";

export function Checkbox({
  children,
  className = "",
  variant = "default",
  ...props
}: Omit<CheckboxProps, "children" | "className"> & {
  children: ReactNode;
  className?: string;
  variant?: "default" | "card";
}) {
  return (
    <RacCheckbox
      {...props}
      className={({ isSelected, isFocusVisible }) =>
        [
          "group flex cursor-pointer items-center gap-2 text-[0.88rem] font-semibold text-[var(--text)] outline-none transition max-sm:min-h-11",
          variant === "card"
            ? "min-h-10 flex-1 rounded-[10px] border px-3 py-2"
            : "",
          variant === "card" && isSelected
            ? "border-[var(--navy-600)] bg-[#f1f5f9]"
            : variant === "card"
              ? "border-[var(--border)] bg-white data-[hovered]:border-[#c6cdd6]"
              : "",
          isFocusVisible ? "ring-3 ring-[rgb(46_89_132/0.18)]" : "",
          className,
        ].join(" ")
      }
    >
      {({ isSelected }) => (
        <>
          <span
            aria-hidden
            className={[
              "pointer-events-none inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors",
              isSelected
                ? "border-[var(--navy-700)] bg-[var(--navy-700)] text-white"
                : "border-[#b8c0ca] bg-white",
            ].join(" ")}
          >
            {isSelected && (
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
              </svg>
            )}
          </span>
          <span>{children}</span>
        </>
      )}
    </RacCheckbox>
  );
}
