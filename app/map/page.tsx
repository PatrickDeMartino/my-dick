"use client";

import Link from "next/link";
import { triggerSceneWarp } from "../lib/sceneWarp";

type ChartNode = {
  id: string;
  href: string;
  icon: string;
  label: string;
  hint: string;
  x: number;
  y: number;
};

const NODES: ChartNode[] = [
  { id: "home", href: "/", icon: "🧭", label: "THE LANDING", hint: "where every trip begins", x: 50, y: 54 },
  { id: "urf", href: "/urf", icon: "🌍", label: "PLANET URF", hint: "spin the globe · Antarctica's the only open shore", x: 20, y: 18 },
  { id: "brain", href: "/brain-room", icon: "🧠", label: "THE BRAIN ROOM", hint: "squishy neural playroom", x: 80, y: 20 },
  { id: "bongo", href: "/bongo", icon: "🦧", label: "BONGO'S LAB", hint: "standalone neural link, reached through the brain", x: 94, y: 46 },
  { id: "anubis", href: "/anubis", icon: "☥", label: "ANUBIS TV ROOM", hint: "temple television · smokes once a minute", x: 50, y: 88 },
];

const ROUTES: { from: string; to: string; via: string }[] = [
  { from: "home", to: "urf", via: "M 50 54 Q 32 30 20 18" },
  { from: "home", to: "brain", via: "M 50 54 Q 68 30 80 20" },
  { from: "home", to: "anubis", via: "M 50 54 Q 50 74 50 88" },
  { from: "brain", to: "bongo", via: "M 80 20 Q 90 32 94 46" },
];

export default function MapRoomPage() {
  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    triggerSceneWarp(href);
  };

  return (
    <main className="chart-room">
      <Link className="chart-room__back" href="/" onClick={(event) => goTo(event, "/")}>
        ← THE LANDING
      </Link>

      <header className="chart-room__title">
        <small>SHIP&apos;S CHART</small>
        <h1>Chart of the Labyrinth</h1>
        <p>Here be terrible decisions. Tap a shore to sail there.</p>
      </header>

      <div className="chart-room__parchment">
        <span className="chart-room__compass" aria-hidden="true">✦</span>
        <span className="chart-room__monster" aria-hidden="true">🐉</span>

        <svg className="chart-room__routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {ROUTES.map((route) => (
            <path key={`${route.from}-${route.to}`} d={route.via} className="chart-room__route" />
          ))}
        </svg>

        {NODES.map((node) => (
          <a
            key={node.id}
            className={`chart-room__node${node.id === "home" ? " is-home" : ""}`}
            href={node.href}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            onClick={(event) => goTo(event, node.href)}
            aria-label={`Sail to ${node.label}`}
          >
            <span className="chart-room__icon" aria-hidden="true">{node.icon}</span>
            <span className="chart-room__label">
              <b>{node.label}</b>
              <small>{node.hint}</small>
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
