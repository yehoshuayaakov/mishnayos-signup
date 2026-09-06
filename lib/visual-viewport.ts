"use client";

import { useEffect, useState } from "react";

export type VisualViewportFrame = {
  height: number;
  offsetTop: number;
};

export function readVisualViewportFrame(
  view: Pick<Window, "visualViewport" | "innerHeight"> = window
): VisualViewportFrame {
  const viewport = view.visualViewport;
  if (!viewport) {
    return { height: view.innerHeight, offsetTop: 0 };
  }
  return { height: viewport.height, offsetTop: viewport.offsetTop };
}

export function useVisualViewportFrame(): VisualViewportFrame {
  const [frame, setFrame] = useState<VisualViewportFrame>({
    height: typeof window === "undefined" ? 0 : window.innerHeight,
    offsetTop: 0,
  });

  useEffect(() => {
    const update = () => setFrame(readVisualViewportFrame());
    update();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return frame;
}
