"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

const ACTION_EVENT = "trip-bongo-action";
const GRAVITY = 980;
const BOUNCE = 0.48;
const AIR_DRAG = 0.996;
const FLOOR_DRAG = 0.84;

type Position = { x: number; y: number };
type Velocity = { x: number; y: number };
type BongoAction = "feed" | "beat";
type DragState = {
  pointerId: number;
  x: number;
  y: number;
  time: number;
};

function characterBaseWidth() {
  if (typeof window === "undefined") return 220;
  if (window.innerWidth <= 620) return Math.min(210, Math.max(130, window.innerWidth * 0.42));
  return Math.min(300, Math.max(170, window.innerWidth * 0.2));
}

export default function OrangutanWidget() {
  const playfieldRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position>({ x: 40, y: 80 });
  const velocityRef = useRef<Velocity>({ x: 0, y: 0 });
  const dragRef = useRef<DragState | null>(null);
  const initializedRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const sequenceRef = useRef(0);

  const [baseWidth, setBaseWidth] = useState(220);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [reaction, setReaction] = useState<"idle" | "eating" | "hit">("idle");
  const [snack, setSnack] = useState<number | null>(null);
  const [bat, setBat] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("Dr. Bongo is ready.");

  const writePosition = useCallback((next: Position) => {
    positionRef.current = next;
    characterRef.current?.style.setProperty("--bongo-x", `${next.x}px`);
    characterRef.current?.style.setProperty("--bongo-y", `${next.y}px`);
  }, []);

  const constrain = useCallback((next: Position) => {
    const field = playfieldRef.current;
    const character = characterRef.current;
    if (!field || !character) return next;
    return {
      x: Math.min(Math.max(next.x, 0), Math.max(0, field.clientWidth - character.offsetWidth)),
      y: Math.min(Math.max(next.y, 0), Math.max(0, field.clientHeight - character.offsetHeight)),
    };
  }, []);

  const clearActionTimers = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    const onResize = () => setBaseWidth(characterBaseWidth());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const field = playfieldRef.current;
      const character = characterRef.current;
      if (!field || !character) return;

      if (!initializedRef.current) {
        initializedRef.current = true;
        writePosition(constrain({
          x: Math.max(10, field.clientWidth * 0.29 - character.offsetWidth / 2),
          y: Math.max(10, field.clientHeight * 0.2),
        }));
      } else {
        writePosition(constrain(positionRef.current));
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [baseWidth, scale, constrain, writePosition]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();

    const step = (now: number) => {
      frame = window.requestAnimationFrame(step);
      const dt = Math.min((now - previous) / 1000, 1 / 30);
      previous = now;
      if (dragRef.current) return;

      const field = playfieldRef.current;
      const character = characterRef.current;
      if (!field || !character) return;

      const velocity = velocityRef.current;
      const next = {
        x: positionRef.current.x + velocity.x * dt,
        y: positionRef.current.y + velocity.y * dt,
      };
      velocity.y += GRAVITY * dt;
      velocity.x *= Math.pow(AIR_DRAG, dt * 60);

      const maxX = Math.max(0, field.clientWidth - character.offsetWidth);
      const maxY = Math.max(0, field.clientHeight - character.offsetHeight);

      if (next.x < 0) {
        next.x = 0;
        velocity.x = Math.abs(velocity.x) * BOUNCE;
      } else if (next.x > maxX) {
        next.x = maxX;
        velocity.x = -Math.abs(velocity.x) * BOUNCE;
      }

      if (next.y < 0) {
        next.y = 0;
        velocity.y = Math.abs(velocity.y) * BOUNCE;
      } else if (next.y > maxY) {
        next.y = maxY;
        velocity.y = Math.abs(velocity.y) > 48 ? -Math.abs(velocity.y) * BOUNCE : 0;
        velocity.x *= FLOOR_DRAG;
      }

      character.style.setProperty("--bongo-tilt", `${Math.max(-11, Math.min(11, velocity.x * 0.018))}deg`);
      writePosition(next);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [writePosition]);

  useEffect(() => {
    const queueTimer = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay);
      timersRef.current.push(timer);
    };

    const onAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: BongoAction }>).detail?.action;
      if (action !== "feed" && action !== "beat") return;
      clearActionTimers();
      sequenceRef.current += 1;

      if (action === "feed") {
        setBat(null);
        setSnack(sequenceRef.current);
        setReaction("eating");
        setAnnouncement("Dr. Bongo catches and eats a banana.");
        velocityRef.current.y = Math.min(velocityRef.current.y, -120);
        queueTimer(() => {
          setScale((current) => Math.min(1.45, Number((current + 0.05).toFixed(2))));
          setAnnouncement("Dr. Bongo grew slightly from the banana.");
        }, 760);
        queueTimer(() => {
          setSnack(null);
          setReaction("idle");
        }, 1450);
        return;
      }

      setSnack(null);
      setBat(sequenceRef.current);
      setReaction("hit");
      setAnnouncement("A baseball bat bonks Dr. Bongo.");
      const field = playfieldRef.current;
      const character = characterRef.current;
      const characterCenter = positionRef.current.x + (character?.offsetWidth ?? 0) / 2;
      const fieldCenter = (field?.clientWidth ?? window.innerWidth) / 2;
      velocityRef.current.x = characterCenter < fieldCenter ? -410 : 410;
      velocityRef.current.y = -300;
      queueTimer(() => {
        setScale((current) => Math.max(0.65, Number((current - 0.05).toFixed(2))));
        setAnnouncement("Dr. Bongo shrank slightly and is deeply offended.");
      }, 340);
      queueTimer(() => {
        setBat(null);
        setReaction("idle");
      }, 1050);
    };

    window.addEventListener(ACTION_EVENT, onAction);
    return () => {
      window.removeEventListener(ACTION_EVENT, onAction);
      clearActionTimers();
    };
  }, [clearActionTimers]);

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
    velocityRef.current = { x: 0, y: 0 };
    setDragging(true);
    setAnnouncement("Dr. Bongo has been picked up.");
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const elapsed = Math.max(16, now - drag.time) / 1000;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    velocityRef.current = {
      x: Math.max(-1500, Math.min(1500, dx / elapsed)),
      y: Math.max(-1500, Math.min(1500, dy / elapsed)),
    };
    writePosition(constrain({ x: positionRef.current.x + dx, y: positionRef.current.y + dy }));
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: now };
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    setAnnouncement("Dr. Bongo has been thrown into the laboratory.");
  }

  function nudge(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 4 : 18;
    writePosition(constrain({
      x: positionRef.current.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0),
      y: positionRef.current.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0),
    }));
  }

  return (
    <div className="bongo-playfield" ref={playfieldRef} aria-label="Dr. Bongo full-screen play area">
      <div
        ref={characterRef}
        className={`bongo-character${dragging ? " is-dragging" : ""}${reaction !== "idle" ? ` is-${reaction}` : ""}`}
        style={{ width: `${baseWidth * scale}px` }}
        role="img"
        aria-label="Interactive 3D Dr. Bongo ragdoll with an exposed cybernetic brain. Drag and throw him around the screen."
        tabIndex={0}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={nudge}
      >
        <span className="bongo-character__shadow" aria-hidden="true" />
        <span className="bongo-character__aura" aria-hidden="true" />
        <img
          className="bongo-character__body"
          src="/media/dr-bongo-v3.png"
          alt=""
          draggable={false}
          onLoad={() => writePosition(constrain(positionRef.current))}
        />
        {snack !== null && (
          <span className="bongo-snack" key={`snack-${snack}`} aria-hidden="true">
            <i className="bongo-banana" />
          </span>
        )}
        {bat !== null && (
          <span className="bongo-bat-swing" key={`bat-${bat}`} aria-hidden="true">
            <i className="bongo-baseball-bat" />
          </span>
        )}
      </div>
      <p className="bongo-announcer" aria-live="polite">{announcement}</p>
    </div>
  );
}
