import { describe, expect, it } from "vitest";
import { readVisualViewportFrame } from "@/lib/visual-viewport";

describe("readVisualViewportFrame", () => {
  it("uses the visual viewport when the keyboard shrinks the visible area", () => {
    expect(
      readVisualViewportFrame({
        innerHeight: 780,
        visualViewport: { height: 360, offsetTop: 12 } as VisualViewport,
      })
    ).toEqual({ height: 360, offsetTop: 12 });
  });

  it("falls back to the layout viewport when visualViewport is unavailable", () => {
    expect(
      readVisualViewportFrame({
        innerHeight: 780,
        visualViewport: null,
      })
    ).toEqual({ height: 780, offsetTop: 0 });
  });
});
