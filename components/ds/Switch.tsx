import type { ReactNode } from "react";
import { Switch as RacSwitch, type SwitchProps } from "react-aria-components";

export function Switch({
  children,
  description,
  className = "",
  ...props
}: Omit<SwitchProps, "children" | "className"> & {
  children: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <RacSwitch
      {...props}
      className={({ isSelected, isFocusVisible }) =>
        [
          "group flex min-h-10 cursor-pointer items-center justify-between gap-4 rounded-[10px] px-1 py-1 outline-none max-sm:min-h-11",
          isFocusVisible ? "ring-3 ring-[rgb(46_89_132/0.18)]" : "",
          className,
        ].join(" ")
      }
    >
      {({ isSelected }) => (
        <>
          <span className="min-w-0">
            <span className="block text-[0.9rem] font-bold text-[var(--navy-700)]">
              {children}
            </span>
            {description && (
              <span className="mt-0.5 block text-[0.75rem] leading-5 text-[var(--muted)]">
                {description}
              </span>
            )}
          </span>
          <span
            aria-hidden
            className={[
              "pointer-events-none flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
              isSelected ? "bg-[var(--navy-700)]" : "bg-[#c7cdd5]",
            ].join(" ")}
          >
            <span
              className={[
                "h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(15,31,51,0.28)] transition-transform",
                isSelected ? "-translate-x-4" : "translate-x-0",
              ].join(" ")}
            />
          </span>
        </>
      )}
    </RacSwitch>
  );
}
