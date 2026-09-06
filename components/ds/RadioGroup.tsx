import type { ReactNode } from "react";
import {
  Label,
  Radio as RacRadio,
  RadioGroup as RacRadioGroup,
  type RadioGroupProps,
  type RadioProps,
} from "react-aria-components";

export function RadioGroup({
  label,
  children,
  className = "",
  layout = "wrap",
  ...props
}: Omit<RadioGroupProps, "children"> & {
  label: string;
  children: ReactNode;
  layout?: "wrap" | "stack" | "grid";
}) {
  const layouts = {
    wrap: "flex flex-wrap gap-2",
    stack: "flex flex-col gap-2",
    grid: "grid grid-cols-1 gap-2 sm:grid-cols-3",
  };

  return (
    <RacRadioGroup {...props} className={`flex flex-col gap-2 ${className}`}>
      <Label className="text-[0.82rem] font-bold text-[var(--navy-700)]">{label}</Label>
      <div className={layouts[layout]}>{children}</div>
    </RacRadioGroup>
  );
}

export function Radio({
  children,
  className = "",
  variant = "default",
  ...props
}: Omit<RadioProps, "children" | "className"> & {
  children: ReactNode;
  className?: string;
  variant?: "default" | "card";
}) {
  return (
    <RacRadio
      {...props}
      className={({ isSelected, isFocusVisible }) =>
        [
          "group flex cursor-pointer items-center gap-2 text-[0.86rem] font-medium text-[var(--text)] outline-none transition max-sm:min-h-11",
          variant === "card"
            ? "min-h-10 rounded-[10px] border px-3 py-2"
            : "rounded-lg px-2 py-1.5",
          variant === "card" && isSelected
            ? "border-[var(--navy-600)] bg-[#f1f5f9] font-bold text-[var(--navy-800)]"
            : variant === "card"
              ? "border-[var(--border)] bg-white data-[hovered]:border-[#c6cdd6]"
              : "data-[hovered]:bg-[#f4f6f8]",
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
              "pointer-events-none inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]",
              isSelected ? "border-[var(--navy-700)]" : "border-[#b8c0ca] bg-white",
            ].join(" ")}
          >
            {isSelected && <span className="h-2 w-2 rounded-full bg-[var(--navy-700)]" />}
          </span>
          <span>{children}</span>
        </>
      )}
    </RacRadio>
  );
}
