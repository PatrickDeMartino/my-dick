"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SCREENS, SCREEN_EVENT } from "../lib/screenIds";

export default function ScreenReference() {
  const pathname = usePathname();
  const [mode, setMode] = useState("");
  useEffect(() => {
    setMode("");
    const update = (e: Event) => {
      const value = (e as CustomEvent).detail;
      if (typeof value === "string" && /^(?:[a-z]+(?:[0-9]+[a-z]*)*)?$/.test(value)) setMode(value);
    };
    const message = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== SCREEN_EVENT) return;
      const frames = [...document.querySelectorAll("iframe")];
      if (!frames.some(frame => frame.contentWindow === e.source)) return;
      update(new CustomEvent(SCREEN_EVENT, { detail: e.data.mode }));
    };
    window.addEventListener(SCREEN_EVENT, update);
    window.addEventListener("message", message);
    return () => { window.removeEventListener(SCREEN_EVENT, update); window.removeEventListener("message", message); };
  }, [pathname]);
  const number = SCREENS[pathname.replace(/\/$/, "") || "/"];
  return <span className="screen-reference" title="Temporary screen reference: number = screen; letters = mode; numbers = nested mode" aria-label={`Screen ${number ?? "unassigned"}${mode}`}>{number ?? "?"}{mode}</span>;
}
