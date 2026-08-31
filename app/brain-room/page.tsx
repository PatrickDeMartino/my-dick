"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import OrangutanWidget from "../bongo/OrangutanWidget";

type Subject = "bongo" | "rat";
type Motion = { x: number; y: number; vx: number; vy: number };
type Message = { role: "user" | "assistant"; content: string };
const opening: Message = { role: "assistant", content: "Bongo online. The room is a brain, the brain is a room, and I still require bananas." };

export default function BrainRoom() {
  const roomRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointer: number; dx: number; dy: number; lastX: number; lastY: number; lastTime: number } | null>(null);
  const motionRef = useRef<Motion>({ x: 55, y: 40, vx: 0, vy: 0 });
  const [subject, setSubject] = useState<Subject | null>(null);
  const [ratMotion, setRatMotion] = useState(motionRef.current);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [pov, setPov] = useState(false);
  const [walker, setWalker] = useState({ x: 50, y: 66 });
  const [roomEvent, setRoomEvent] = useState("WASD / ARROWS TO EXPLORE");
  const [messages, setMessages] = useState<Message[]>([opening]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  const chooseSubject = (next: Subject) => {
    setSubject((current) => current === next ? null : next);
    setPov(false);
    setRoomEvent("DRAG · THROW · BOUNCE");
    if (next === "bongo") setConsoleOpen(true);
  };

  useEffect(() => {
    if (subject !== "rat" || pov) return;
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .035);
      previous = now;
      if (!dragRef.current) {
        const next = { ...motionRef.current };
        next.vy += 52 * dt; next.x += next.vx * dt; next.y += next.vy * dt;
        next.vx *= Math.pow(.985, dt * 60);
        if (next.x < 2 || next.x > 78) { next.x = Math.max(2, Math.min(78, next.x)); next.vx *= -.72; }
        if (next.y < 2 || next.y > 70) { next.y = Math.max(2, Math.min(70, next.y)); next.vy *= -.66; }
        motionRef.current = next; setRatMotion(next);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [subject, pov]);

  useEffect(() => {
    if (!pov) return;
    const move = (dx: number, dy: number) => setWalker((current) => ({ x: Math.max(7, Math.min(90, current.x + dx)), y: Math.max(34, Math.min(78, current.y + dy)) }));
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "a"].includes(key)) move(-3, 0);
      if (["arrowright", "d"].includes(key)) move(3, 0);
      if (["arrowup", "w"].includes(key)) move(0, -2.4);
      if (["arrowdown", "s"].includes(key)) move(0, 2.4);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pov]);

  async function transmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || thinking) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setDraft(""); setThinking(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await response.json() as { reply?: string };
      setMessages((current) => [...current, { role: "assistant", content: data.reply || "The implant received only static and one banana emoji." }]);
    } catch { setMessages((current) => [...current, { role: "assistant", content: "Neural signal scrambled. Try again, human." }]); }
    finally { setThinking(false); }
  }

  const moveWalker = (dx: number, dy: number) => setWalker((current) => ({ x: Math.max(7, Math.min(90, current.x + dx)), y: Math.max(34, Math.min(78, current.y + dy)) }));
  const cameraTransform = pov ? `perspective(1100px) translate3d(${(50 - walker.x) * .18}vw, ${(58 - walker.y) * .08}vh, 55px) scale(1.17)` : undefined;

  return <main className={`brain-room${pov ? " is-pov" : ""}${subject ? ` has-${subject}` : ""}`} ref={roomRef}>
    <div className="brain-room__backdrop" style={{ transform: cameraTransform }} data-mobile-background="/brain-room/brain-room-mobile.jpg" role="img" aria-label="A warm surreal sitting room built inside a living brain" />
    <div className="brain-room__shade" aria-hidden="true" />
    <a className="brain-room__back" href="/">← HOME</a>
    <header className="brain-room__title"><small>NEURAL PLAYROOM</small><h1>{pov ? "Walk the cortex" : "Choose a test subject"}</h1></header>

    {!pov && <nav className="brain-room__controls" aria-label="Brain room experiments">
      <button type="button" aria-pressed={subject === "bongo"} onClick={() => chooseSubject("bongo")}><img src="/media/dr-bongo-model-icon-v1.png" alt="" /><span><b>DR. BONGO</b><small>{subject === "bongo" ? "Return Bongo to containment" : "Activate full-room physics ragdoll"}</small></span></button>
      <button type="button" aria-pressed={subject === "rat"} onClick={() => chooseSubject("rat")}><img src="/media/lab-rat-ragdoll-v2.png" alt="" /><span><b>LAB RAT</b><small>{subject === "rat" ? "Return rat to cage" : "Activate articulated physics rat"}</small></span></button>
    </nav>}
    {!pov && <a className="brain-room__full-lab" href="/bongo">OPEN STANDALONE BONGO LAB ↗</a>}

    {subject && <button className="brain-room__pov" type="button" onClick={() => setPov((value) => !value)}>{pov ? "EXIT POV" : "SWITCH TO POV"}</button>}
    {subject === "bongo" && !pov && <div className="brain-room__bongo"><OrangutanWidget /></div>}

    {subject === "rat" && !pov && <button type="button" className={`brain-room__rat${Math.abs(ratMotion.vx) + Math.abs(ratMotion.vy) > 7 ? " is-flying" : ""}`} aria-label="Drag and throw the articulated laboratory rat" style={{ left: `${ratMotion.x}%`, top: `${ratMotion.y}%`, transform: `rotate(${Math.max(-28, Math.min(28, ratMotion.vx * .6))}deg)` }}
      onPointerDown={(event) => { const bounds = roomRef.current?.getBoundingClientRect(); if (!bounds) return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { pointer: event.pointerId, dx: event.clientX - bounds.left - bounds.width * ratMotion.x / 100, dy: event.clientY - bounds.top - bounds.height * ratMotion.y / 100, lastX: event.clientX, lastY: event.clientY, lastTime: performance.now() }; }}
      onPointerMove={(event) => { const drag = dragRef.current; const bounds = roomRef.current?.getBoundingClientRect(); if (!drag || drag.pointer !== event.pointerId || !bounds) return; const now = performance.now(); const elapsed = Math.max(now - drag.lastTime, 8); const next = { x: Math.max(2, Math.min(78, (event.clientX - bounds.left - drag.dx) / bounds.width * 100)), y: Math.max(2, Math.min(70, (event.clientY - bounds.top - drag.dy) / bounds.height * 100)), vx: (event.clientX - drag.lastX) / bounds.width * 100000 / elapsed, vy: (event.clientY - drag.lastY) / bounds.height * 100000 / elapsed }; drag.lastX = event.clientX; drag.lastY = event.clientY; drag.lastTime = now; motionRef.current = next; setRatMotion(next); }}
      onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
      <span className="rat-joint rat-tail" /><span className="rat-joint rat-ear" /><span className="rat-joint rat-paw rat-paw-one" /><span className="rat-joint rat-paw rat-paw-two" />
      <img src="/media/lab-rat-ragdoll-v2.png" alt="A realistic white laboratory rat" draggable={false} />
    </button>}

    {pov && subject && <section className="brain-room__pov-world" aria-label="Navigable third-person brain room">
      <button className="brain-hotspot brain-window" type="button" onClick={() => { setRoomEvent("VOID ACCEPTED · RESPAWNING SUBJECT"); setWalker({ x: 50, y: 66 }); }}>JUMP OUT WINDOW <small>(suicide)</small></button>
      <button className="brain-hotspot brain-beanbag" type="button" onClick={() => { setRoomEvent("GOOD · NEURAL COMFORT +1"); setWalker({ x: 73, y: 64 }); }}>SIT IN BEAN BAG <small>(good)</small></button>
      <div className={`brain-room__walker is-${subject}`} style={{ left: `${walker.x}%`, top: `${walker.y}%`, transform: `translate(-50%,-100%) scale(${.66 + walker.y / 125})` }}><img src={subject === "bongo" ? "/media/dr-bongo-model-icon-v1.png" : "/media/lab-rat-ragdoll-v2.png"} alt={subject === "bongo" ? "Dr. Bongo" : "Laboratory rat"} /></div>
      <p className="brain-room__event">{roomEvent}</p>
      <div className="brain-room__dpad" aria-label="Movement controls"><button onClick={() => moveWalker(0,-3)}>▲</button><button onClick={() => moveWalker(-4,0)}>◀</button><button onClick={() => moveWalker(0,3)}>▼</button><button onClick={() => moveWalker(4,0)}>▶</button></div>
    </section>}

    {subject && !pov && <p className="brain-room__hint">DRAG · THROW · BOUNCE</p>}
    {subject === "bongo" && consoleOpen && <aside className="brain-bongo-console" aria-label="Dr. Bongo cybernetics console"><header><div><small>CYBERNETIC LINK</small><b>DR. BONGO</b></div><button type="button" aria-label="Close Bongo console" onClick={() => setConsoleOpen(false)}>×</button></header><div className="brain-bongo-console__messages" aria-live="polite">{messages.slice(-4).map((message, index) => <p className={message.role} key={index}><b>{message.role === "assistant" ? "BONGO" : "YOU"}</b>{message.content}</p>)}{thinking && <p className="assistant"><b>BONGO</b>thinking in bananas…</p>}</div><form onSubmit={transmit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Talk to his AI cybernetics…" maxLength={600} /><button disabled={!draft.trim() || thinking}>SEND</button></form></aside>}
    {subject === "bongo" && !consoleOpen && <button className="brain-console-reopen" type="button" onClick={() => setConsoleOpen(true)}>OPEN BONGO LINK</button>}
  </main>;
}

