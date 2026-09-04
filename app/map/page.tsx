"use client";

import { triggerSceneWarp } from "../lib/sceneWarp";

const NODES = [
  { id: "home", href: "/", icon: "🧭", label: "THE LANDING", hint: "where every trip begins", x: 50, y: 52 },
  { id: "urf", href: "/urf", icon: "🌍", label: "PLANET URF", hint: "spin the globe and throw a dart", x: 18, y: 18 },
  { id: "brain", href: "/brain-room", icon: "🧠", label: "THE BRAIN ROOM", hint: "squishy neural playroom", x: 78, y: 18 },
  { id: "bongo", href: "/bongo", icon: "🦧", label: "BONGO'S LAB", hint: "feed, beat, chat, and throw", x: 92, y: 46 },
  { id: "israel", href: "/israel", icon: "🥤", label: "YOO-HOO LOVE SHRINE", hint: "Prime Minister of My Heart", x: 79, y: 80 },
  { id: "anubis", href: "/anubis", icon: "☥", label: "ANUBIS TV ROOM", hint: "temple television", x: 39, y: 86 },
] as const;

const ROUTES = [
  "M 50 52 Q 32 30 18 18",
  "M 50 52 Q 64 29 78 18",
  "M 50 52 Q 80 36 92 46",
  "M 50 52 Q 70 68 79 80",
  "M 50 52 Q 45 72 39 86",
];

export default function MapRoomPage() {
  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    triggerSceneWarp(href);
  };

  return (
    <main className="chart-room">
      <a className="chart-room__back" href="/" onClick={(event) => goTo(event, "/")}>← THE LANDING</a>
      <header className="chart-room__title">
        <small>SHIP&apos;S CHART</small>
        <h1>Chart of the Labyrinth</h1>
        <p>Here be terrible decisions. Tap a shore to sail there.</p>
      </header>
      <div className="chart-room__parchment">
        <span className="chart-room__compass" aria-hidden="true">✦</span>
        <span className="chart-room__monster" aria-hidden="true">🐉</span>
        <svg className="chart-room__routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {ROUTES.map((route) => <path key={route} d={route} className="chart-room__route" />)}
        </svg>
        {NODES.map((node) => (
          <a key={node.id} className={`chart-room__node${node.id === "home" ? " is-home" : ""}`} href={node.href}
            style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={(event) => goTo(event, node.href)} aria-label={`Sail to ${node.label}`}>
            <span className="chart-room__icon" aria-hidden="true">{node.icon}</span>
            <span className="chart-room__label"><b>{node.label}</b><small>{node.hint}</small></span>
          </a>
        ))}
      </div>
    </main>
  );
}
