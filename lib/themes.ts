import type { CSSProperties } from "react";

// Per-campaign color presets. Each theme overrides the primary "navy" ramp
// (used by the hero gradient, buttons, and headings) via CSS custom properties
// on a wrapper element. The gold accent stays consistent across themes.
export const THEME_NAMES = ["navy", "forest", "burgundy", "slate"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

const THEMES: Record<ThemeName, Record<string, string>> = {
  // Default look (matches :root); empty means fall back to the base variables.
  navy: {},
  forest: {
    "--navy-900": "#0f2419",
    "--navy-800": "#143020",
    "--navy-700": "#1d4531",
    "--navy-600": "#2b6146",
  },
  burgundy: {
    "--navy-900": "#2a1015",
    "--navy-800": "#37151f",
    "--navy-700": "#52202d",
    "--navy-600": "#743142",
  },
  slate: {
    "--navy-900": "#1a212a",
    "--navy-800": "#242d37",
    "--navy-700": "#36444f",
    "--navy-600": "#536679",
  },
};

function isThemeName(value: string): value is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(value);
}

// Returns inline CSS custom properties for the given theme, to spread onto a
// wrapper element's style. Unknown/empty themes fall back to the default.
export function themeStyle(theme: string | null | undefined): CSSProperties {
  const name: ThemeName = theme && isThemeName(theme) ? theme : "navy";
  return THEMES[name] as CSSProperties;
}
