import type { CSSProperties } from "react";

function blendHex(from: string, to: string, t: number): string {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const u = Math.min(1, Math.max(0, t));
  const r = Math.round(((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * u));
  const g = Math.round(((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * u));
  const bl = Math.round((a & 255) + (((b & 255) - (a & 255)) * u));
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/** Gold fill — lighter at low progress, darker as more tractates are taken. */
export function progressFillStyle(pct: number): CSSProperties {
  const p = Math.min(100, Math.max(0, pct)) / 100;
  const light = blendHex("#ede4c8", "#d8bd72", p);
  const dark = blendHex("#d8bd72", "#9a7832", p);
  return {
    width: `${pct}%`,
    background: `linear-gradient(to left, ${light}, ${dark})`,
  };
}
