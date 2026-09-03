"use client";

import { useEffect, useRef } from "react";

export type JellyButtonSpec = {
  key: string;
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger" | "gold";
};

type ButtonState = { x: number; y: number; vx: number; vy: number; r: number; squish: number };

/**
 * A small circular-button playground: each button drifts slowly, bounces off
 * the field's walls and off each other, and squishes on impact like a soft
 * blob of jelly. Falls back to a plain static row when the visitor prefers
 * reduced motion, or while the buttons haven't measured themselves yet.
 */
export function JellyButtons({ buttons, minHeight = 132 }: { buttons: JellyButtonSpec[]; minHeight?: number }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const statesRef = useRef<Map<string, ButtonState>>(new Map());

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = field.clientWidth || 260;
    const height = field.clientHeight || minHeight;
    const states = statesRef.current;

    // (Re)seed any button we don't already have a physics state for, so
    // buttons that appear/disappear (owned items, upgraded telescope, etc.)
    // don't reset everyone else's position.
    for (const spec of buttons) {
      if (states.has(spec.key)) continue;
      const node = buttonRefs.current.get(spec.key);
      const r = Math.max(30, (node?.offsetWidth ?? 64) / 2);
      states.set(spec.key, {
        x: Math.random() * Math.max(1, width - r * 2) + r,
        y: Math.random() * Math.max(1, height - r * 2) + r,
        vx: (Math.random() - 0.5) * 0.045,
        vy: (Math.random() - 0.5) * 0.045,
        r,
        squish: 0,
      });
    }
    for (const key of [...states.keys()]) {
      if (!buttons.some((spec) => spec.key === key)) states.delete(key);
    }

    if (reduceMotion) return;

    let raf = 0;
    let last = performance.now();

    function step(now: number) {
      raf = requestAnimationFrame(step);
      const dt = Math.min(48, now - last);
      last = now;
      const w = field!.clientWidth || width;
      const h = field!.clientHeight || height;
      const entries = [...states.entries()];

      for (const [, state] of entries) {
        state.x += state.vx * dt;
        state.y += state.vy * dt;
        if (state.x - state.r < 0) { state.x = state.r; state.vx = Math.abs(state.vx); state.squish = 1; }
        if (state.x + state.r > w) { state.x = w - state.r; state.vx = -Math.abs(state.vx); state.squish = 1; }
        if (state.y - state.r < 0) { state.y = state.r; state.vy = Math.abs(state.vy); state.squish = 1; }
        if (state.y + state.r > h) { state.y = h - state.r; state.vy = -Math.abs(state.vy); state.squish = 1; }
      }

      for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
          const a = entries[i][1];
          const b = entries[j][1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const minDist = a.r + b.r;
          if (dist >= minDist) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const relVx = b.vx - a.vx;
          const relVy = b.vy - a.vy;
          const along = relVx * nx + relVy * ny;
          if (along < 0) continue;
          a.vx += nx * along; a.vy += ny * along;
          b.vx -= nx * along; b.vy -= ny * along;
          a.squish = 1; b.squish = 1;
        }
      }

      for (const [key, state] of entries) {
        state.squish *= 0.9;
        const node = buttonRefs.current.get(key);
        if (!node) continue;
        const speed = Math.hypot(state.vx, state.vy);
        const stretch = 1 + Math.min(0.32, state.squish * 0.3 + speed * 1.4);
        const squeeze = 1 - Math.min(0.24, state.squish * 0.22 + speed * 1.1);
        const angle = Math.atan2(state.vy, state.vx) * (180 / Math.PI);
        node.style.transform = `translate(${state.x - state.r}px, ${state.y - state.r}px) rotate(${angle}deg) scaleX(${stretch}) scaleY(${squeeze}) rotate(${-angle}deg)`;
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [buttons, minHeight]);

  const reduceMotionStatic = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="jelly-field" ref={fieldRef} style={{ minHeight }}>
      {buttons.map((spec) => (
        <button
          key={spec.key}
          type="button"
          ref={(node) => {
            if (node) buttonRefs.current.set(spec.key, node);
            else buttonRefs.current.delete(spec.key);
          }}
          className={`jelly-btn jelly-btn-${spec.tone ?? "default"}${reduceMotionStatic ? " jelly-btn-static" : ""}`}
          disabled={spec.disabled}
          onClick={spec.onClick}
        >
          {spec.label}
        </button>
      ))}
    </div>
  );
}
