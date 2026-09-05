"use client";

import { useEffect, useRef } from "react";

/**
 * "Thirst for Oil" — an analog dial that never settles: the needle
 * random-walks with an upward bias so it spends most of its time hovering
 * at or past the redline, and the digital readout underneath keeps
 * climbing past what the dial can even show, flashing "∞" whenever it
 * pegs past max. Driven entirely via refs/rAF (no React state) so it can
 * flutter every frame without re-rendering the banner.
 */
export function OilGauge() {
  const needleRef = useRef<SVGLineElement>(null);
  const digitsRef = useRef<HTMLSpanElement>(null);
  const pegRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      if (needleRef.current) needleRef.current.style.transform = "rotate(74deg)";
      if (digitsRef.current) digitsRef.current.textContent = "∞";
      return;
    }

    let raf = 0;
    let value = 0.82; // 0..1 fraction across the dial's sweep
    let pegCooldown = 0;

    function step() {
      raf = requestAnimationFrame(step);
      // Biased random walk: drifts up more than it drifts down, and the
      // ceiling is soft — it can shoot past 1 (visually pegged at the stop)
      // before easing back, so it reads as constantly redlining/overloading.
      value += (Math.random() - 0.3) * 0.045;
      value = Math.max(0.58, Math.min(1.12, value));
      const displayValue = Math.min(1, value);
      const angleDeg = -100 + displayValue * 200;
      if (needleRef.current) needleRef.current.style.transform = `rotate(${angleDeg}deg)`;

      pegCooldown -= 1;
      if (value >= 1.03 && pegCooldown <= 0) {
        pegCooldown = 35 + Math.random() * 70;
        pegRef.current?.classList.add("is-flashing");
        window.setTimeout(() => pegRef.current?.classList.remove("is-flashing"), 220 + Math.random() * 260);
      }

      if (digitsRef.current) {
        digitsRef.current.textContent = value >= 1 ? "∞" : String(Math.round(value * 9999)).padStart(4, "0");
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="trip-oil-gauge" aria-hidden="true">
      <svg viewBox="0 0 100 58" className="trip-oil-gauge-face">
        <path d="M6 54 A44 44 0 0 1 94 54" fill="none" stroke="#241708" strokeWidth="8" strokeLinecap="round" />
        <path d="M6 54 A44 44 0 0 1 50 10" fill="none" stroke="#4fae5c" strokeWidth="6" strokeLinecap="round" />
        <path d="M42 12.2 A44 44 0 0 1 78 22" fill="none" stroke="#e8c23f" strokeWidth="6" strokeLinecap="round" />
        <path d="M74 24 A44 44 0 0 1 94 54" fill="none" stroke="#e34b3f" strokeWidth="6" strokeLinecap="round" />
        <line ref={needleRef} x1="50" y1="54" x2="50" y2="15" stroke="#ffe9b0" strokeWidth="2.6" strokeLinecap="round" style={{ transformOrigin: "50px 54px" }} />
        <circle cx="50" cy="54" r="4.2" fill="#ffe9b0" stroke="#3a2a10" strokeWidth="1.4" />
      </svg>
      <div className="trip-oil-gauge-readout">
        <span ref={digitsRef}>9999</span>
        <div ref={pegRef} className="trip-oil-gauge-peg">MAX</div>
      </div>
    </div>
  );
}
