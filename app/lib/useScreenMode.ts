"use client";
import { useEffect } from "react";
import { setScreenMode } from "./screenIds";
export function useScreenMode(mode: string) {
  useEffect(() => { const frame = requestAnimationFrame(() => setScreenMode(mode)); return () => cancelAnimationFrame(frame); }, [mode]);
}
