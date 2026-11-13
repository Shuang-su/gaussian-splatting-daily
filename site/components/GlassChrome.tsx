"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { startGlassChrome } from "../lib/glass-chrome";
import "../app/glass.css";

export default function GlassChrome({ children }: { children: ReactNode }) {
  const optics = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (optics.current) return startGlassChrome(optics.current);
  }, []);
  return <>{children}<div ref={optics} data-glass-optics="" data-glass-state="loading" aria-hidden="true" inert /></>;
}
