import type { ReactNode } from "react";

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn";
  title?: string;
  children: ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "border-[#ebcece] bg-[#fff8f7] text-[#7c3333]"
      : "border-[#e3d6b4] bg-[#fcfaf4] text-[var(--navy-800)]";
  return (
    <div className={`flex gap-2.5 rounded-[10px] border px-3 py-2.5 ${styles}`}>
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
      >
        {tone === "warn" ? (
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M10 6v4.5M10 14h.01" strokeLinecap="round" />
            <path d="M8.7 3.1 2.4 14a2 2 0 0 0 1.7 3h11.8a2 2 0 0 0 1.7-3L11.3 3.1a1.5 1.5 0 0 0-2.6 0Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="10" cy="10" r="7.25" />
            <path d="M10 9v4M10 6.5h.01" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <div className="min-w-0">
        {title && <p className="mb-0.5 text-[0.82rem] font-bold">{title}</p>}
        <div className="text-[0.78rem] leading-5 font-medium">{children}</div>
      </div>
    </div>
  );
}
