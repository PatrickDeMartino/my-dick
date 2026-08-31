"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type RatMotion = { x: number; y: number; vx: number; vy: number };

export default function BrainRoom() {
  const roomRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointer: number; dx: number; dy: number; lastX: number; lastY: number; lastTime: number } | null>(null);
  const motionRef = useRef<RatMotion>({ x: 62, y: 45, vx: 0, vy: 0 });
  const [ratActive, setRatActive] = useState(false);
  const [ratMotion, setRatMotion] = useState(motionRef.current);

  useEffect(() => {
    if (!ratActive) return;
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .035);
      previous = now;
      if (!dragRef.current) {
        const next = { ...motionRef.current };
        next.vy += 52 * dt;
        next.x += next.vx * dt;
        next.y += next.vy * dt;
        next.vx *= Math.pow(.985, dt * 60);
        if (next.x < 4 || next.x > 82) { next.x = Math.max(4, Math.min(82, next.x)); next.vx *= -.72; }
        if (next.y < 4 || next.y > 72) { next.y = Math.max(4, Math.min(72, next.y)); next.vy *= -.66; }
        motionRef.current = next;
        setRatMotion(next);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [ratActive]);

  return (
    <main className="brain-room" ref={roomRef}>
      <picture className="brain-room__backdrop">
        <source media="(max-width: 620px)" srcSet="/brain-room/brain-room-mobile.jpg" />
        <img src="/brain-room/brain-room-desktop.jpg" alt="A warm surreal sitting room built inside a living brain" />
      </picture>
      <div className="brain-room__shade" aria-hidden="true" />
      <Link className="brain-room__back" href="/">← HOME</Link>
      <header className="brain-room__title"><small>NEURAL PLAYROOM</small><h1>Choose a test subject</h1></header>
      <nav className="brain-room__controls" aria-label="Brain room experiments">
        <Link href="/bongo"><img src="/media/dr-bongo-model-icon-v1.png" alt="" /><span><b>DR. BONGO</b><small>Open the original ragdoll lab</small></span></Link>
        <button type="button" onClick={() => setRatActive((active) => !active)}><img src="/media/lab-rat-v1.png" alt="" /><span><b>LAB RAT</b><small>{ratActive ? "Return rat to cage" : "Activate physics rat"}</small></span></button>
      </nav>
      {ratActive && (
        <button
          type="button"
          className="brain-room__rat"
          aria-label="Drag and throw the laboratory rat"
          style={{ left: `${ratMotion.x}%`, top: `${ratMotion.y}%`, transform: `rotate(${Math.max(-24, Math.min(24, ratMotion.vx * .6))}deg)` }}
          onPointerDown={(event) => {
            const bounds = roomRef.current?.getBoundingClientRect();
            if (!bounds) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = { pointer: event.pointerId, dx: event.clientX - bounds.left - bounds.width * ratMotion.x / 100, dy: event.clientY - bounds.top - bounds.height * ratMotion.y / 100, lastX: event.clientX, lastY: event.clientY, lastTime: performance.now() };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            const bounds = roomRef.current?.getBoundingClientRect();
            if (!drag || drag.pointer !== event.pointerId || !bounds) return;
            const now = performance.now();
            const elapsed = Math.max(now - drag.lastTime, 8);
            const next = { x: Math.max(3, Math.min(83, (event.clientX - bounds.left - drag.dx) / bounds.width * 100)), y: Math.max(3, Math.min(73, (event.clientY - bounds.top - drag.dy) / bounds.height * 100)), vx: (event.clientX - drag.lastX) / bounds.width * 100000 / elapsed, vy: (event.clientY - drag.lastY) / bounds.height * 100000 / elapsed };
            drag.lastX = event.clientX; drag.lastY = event.clientY; drag.lastTime = now;
            motionRef.current = next; setRatMotion(next);
          }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
        ><img src="/media/lab-rat-v1.png" alt="A mischievous laboratory rat" draggable={false} /></button>
      )}
      {ratActive && <p className="brain-room__hint">DRAG · THROW · BOUNCE</p>}
    </main>
  );
}
