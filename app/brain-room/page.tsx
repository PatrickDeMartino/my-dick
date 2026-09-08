"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BrainRoomHandle, CharacterId } from "./brainRoomEngine";

type Message = { role: "user" | "assistant"; content: string };
const opening: Message = { role: "assistant", content: "Bongo online. The room is a brain, the brain is a room, and I still require bananas." };

const CHARACTERS: { id: CharacterId; label: string; icon: string }[] = [
  { id: "bongo", label: "DR. BONGO", icon: "🦧" },
  { id: "rat", label: "LAB RAT", icon: "🐀" },
  { id: "alien", label: "ALIEN", icon: "👽" },
  { id: "penguin", label: "PENGUIN", icon: "🐧" },
];

export default function BrainRoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<BrainRoomHandle | null>(null);
  const stickRef = useRef({ active: false, id: -1, cx: 0, cy: 0 });
  const [character, setCharacter] = useState<CharacterId>("bongo");
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [zone, setZone] = useState<"window" | "beanbag" | "portal" | null>(null);
  const [roomEvent, setRoomEvent] = useState("WASD / ARROWS TO EXPLORE");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([opening]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    // This dev environment can fire this effect's setup considerably more
    // than React's usual StrictMode double-invoke (observed: five setup
    // calls, one matching cleanup) without reliably pairing each with a
    // cleanup in between. A plain "cancelled" flag captured at effect-setup
    // time can't track that: a later setup call's resolution could still
    // see the earlier one's `cancelled` as false and overwrite worldRef with
    // a handle whose underlying engine instance has already self-evicted
    // (see the generation guard in brainRoomEngine.ts) — the UI would then
    // control a dead instance while a different one silently keeps
    // rendering. Instead, every resolution here unconditionally takes over
    // as the current handle and disposes whatever it's replacing, so
    // worldRef.current always tracks whichever instance was created most
    // recently — which is also the one the generation guard leaves alive.
    let effectTornDown = false;

    import("./brainRoomEngine")
      .then(({ createBrainRoom }) =>
        createBrainRoom(canvas, {
          onEvent: (text) => setRoomEvent(text),
          onZone: (next) => setZone(next),
        }),
      )
      .then((created) => {
        if (effectTornDown) {
          created?.dispose();
          return;
        }
        if (worldRef.current && worldRef.current !== created) worldRef.current.dispose();
        worldRef.current = created;
        setReady(Boolean(created));
        if (process.env.NODE_ENV !== "production" && created) {
          (window as unknown as { __brainRoomDebug?: unknown }).__brainRoomDebug = created.debug;
        }
      })
      .catch((error: unknown) => {
        console.error("Brain room unavailable", error);
        setReady(false);
      });

    const resize = new ResizeObserver(([entry]) => {
      worldRef.current?.setSize(entry.contentRect.width, entry.contentRect.height);
    });
    resize.observe(frame);

    return () => {
      effectTornDown = true;
      worldRef.current?.dispose();
      worldRef.current = null;
      resize.disconnect();
    };
  }, []);

  useEffect(() => {
    worldRef.current?.setCharacter(character);
  }, [character]);

  useEffect(() => {
    // Tracks every currently-held movement key rather than reacting to one
    // key at a time — releasing just one of two simultaneously-held keys
    // (e.g. W+D for a diagonal) used to zero out movement on both axes
    // instead of just the one that was let go.
    const held = new Set<string>();
    const applyMove = () => {
      const x = (held.has("d") || held.has("arrowright") ? 1 : 0) - (held.has("a") || held.has("arrowleft") ? 1 : 0);
      const y = (held.has("w") || held.has("arrowup") ? 1 : 0) - (held.has("s") || held.has("arrowdown") ? 1 : 0);
      worldRef.current?.setMove(x, y);
    };
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === " " || key === "enter" || key === "e") {
        worldRef.current?.interact();
        return;
      }
      if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) return;
      held.add(key);
      applyMove();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.key.toLowerCase());
      applyMove();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const clampUnit = (value: number) => Math.max(-1, Math.min(1, value));
  const moveStick = (clientX: number, clientY: number) => {
    if (!stickRef.current.active) return;
    const reach = 36;
    const x = clampUnit((clientX - stickRef.current.cx) / reach);
    const y = clampUnit((clientY - stickRef.current.cy) / reach);
    setStick({ x, y });
    worldRef.current?.setMove(x, -y);
  };
  const endStick = () => {
    stickRef.current.active = false;
    setStick({ x: 0, y: 0 });
    worldRef.current?.setMove(0, 0);
  };

  async function transmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || thinking) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setDraft("");
    setThinking(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await response.json() as { reply?: string };
      setMessages((current) => [...current, { role: "assistant", content: data.reply || "The implant received only static and one banana emoji." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Neural signal scrambled. Try again, human." }]);
    } finally {
      setThinking(false);
    }
  }

  const zoneLabel = zone === "window" ? "PRESS SPACE / E TO JUMP OUT THE WINDOW"
    : zone === "beanbag" ? "PRESS SPACE / E TO SINK INTO THE BEAN BAG"
    : zone === "portal" ? "PRESS SPACE / E TO RETURN TO THE BRAIN ROOM"
    : null;

  return (
    <main className="brain-room3d">
      <Link className="brain-room__back" href="/">← HOME</Link>
      <header className="brain-room__title"><small>NEURAL PLAYROOM</small><h1>Walk the cortex</h1></header>

      <div className="brain-room3d__stage" ref={frameRef}>
        <canvas ref={canvasRef} className="brain-room3d__canvas" aria-label="Playable 3D brain room" />
        {!ready && <div className="brain-room3d__loading">GROWING TISSUE…</div>}
      </div>

      <nav className="brain-room3d__characters" aria-label="Choose who to play as">
        {CHARACTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={character === entry.id}
            onClick={() => setCharacter(entry.id)}
          >
            <span aria-hidden="true">{entry.icon}</span>
            {entry.label}
          </button>
        ))}
      </nav>

      <p className="brain-room__event">{zoneLabel ?? roomEvent}</p>

      <div
        className="brain-room3d__stick"
        aria-label="Movement joystick"
        onPointerDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          stickRef.current = { active: true, id: event.pointerId, cx: bounds.left + bounds.width / 2, cy: bounds.top + bounds.height / 2 };
          event.currentTarget.setPointerCapture(event.pointerId);
          moveStick(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => moveStick(event.clientX, event.clientY)}
        onPointerUp={endStick}
        onPointerCancel={endStick}
      >
        <i style={{ transform: `translate(${stick.x * 30}px, ${stick.y * 30}px)` }} />
      </div>

      <button
        className="brain-room3d__interact"
        type="button"
        onClick={() => worldRef.current?.interact()}
        disabled={!zoneLabel}
      >
        {zone === "window" ? "JUMP" : zone === "beanbag" ? "SIT" : zone === "portal" ? "RETURN" : "•"}
      </button>

      {consoleOpen && (
        <aside className="brain-bongo-console" aria-label="Dr. Bongo cybernetics console">
          <header>
            <div><small>CYBERNETIC LINK</small><b>DR. BONGO</b></div>
            <button type="button" aria-label="Close Bongo console" onClick={() => setConsoleOpen(false)}>×</button>
          </header>
          <div className="brain-bongo-console__messages" aria-live="polite">
            {messages.slice(-4).map((message, index) => (
              <p className={message.role} key={index}><b>{message.role === "assistant" ? "BONGO" : "YOU"}</b>{message.content}</p>
            ))}
            {thinking && <p className="assistant"><b>BONGO</b>thinking in bananas…</p>}
          </div>
          <form onSubmit={transmit}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Talk to his AI cybernetics…" maxLength={600} />
            <button disabled={!draft.trim() || thinking}>SEND</button>
          </form>
        </aside>
      )}
      {!consoleOpen && <button className="brain-console-reopen" type="button" onClick={() => setConsoleOpen(true)}>OPEN BONGO LINK</button>}
    </main>
  );
}
