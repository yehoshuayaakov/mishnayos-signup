import type { ReactNode } from "react";

const tones = {
  success:
    "border-[var(--green-border)] bg-[var(--green-bg)] text-[var(--green-700)]",
  error: "border-[#ebcece] bg-[#fff7f7] text-[#8b3838]",
  info: "border-[var(--border)] bg-white text-[var(--text)]",
} as const;

export function Banner({
  tone = "info",
  href,
  hrefLabel,
  className = "",
  children,
}: {
  tone?: keyof typeof tones;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-4 rounded-xl border px-4 py-3 text-[0.92rem] leading-6 font-medium ${tones[tone]} ${className}`}
    >
      {children}
      {href && (
        <>
          {" "}
          <a className="font-bold underline underline-offset-2" href={href}>
            {hrefLabel ?? href}
          </a>
        </>
      )}
    </div>
  );
}
