import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chart of the Labyrinth | Triptotropic",
  description: "A hand-drawn chart of every room in the Triptotropic labyrinth and how they connect.",
};

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
  { id: "home", href: "/", icon: "🧭", label: "THE LANDING", hint: "where every trip begins", x: 50, y: 50 },
  { id: "urf3d", href: "/urf-3d", icon: "👽", label: "PLANET URF · 3D", hint: "spin globe, satellite, playable archer", x: 15, y: 14 },
  { id: "urf", href: "/urf", icon: "🗺️", label: "URF TOWN", hint: "sweatshop, dog-fighting, telescope", x: 85, y: 14 },
  { id: "town", href: "/penguin-town", icon: "🐧", label: "PENGUIN TOWN", hint: "3D ragdoll island · found via Antarctica", x: 8, y: 50 },
  { id: "townhex", href: "/penguin-town-hex", icon: "⬡", label: "PENGUIN TOWN · HEX", hint: "experimental hex-grid take, sign in to build", x: 25, y: 80 },
  { id: "yoohoo", href: "/bb-yoohoo-room", icon: "🥤", label: "BB'S YOO-HOO ROOM", hint: "found by hitting Middle East", x: 50, y: 92 },
  { id: "brain", href: "/brain-room", icon: "🧠", label: "THE BRAIN ROOM", hint: "squishy neural playroom", x: 92, y: 50 },
  { id: "bongo", href: "/bongo", icon: "🦧", label: "BONGO'S LAB", hint: "standalone neural link", x: 85, y: 80 },
  { id: "anubis", href: "/anubis", icon: "☥", label: "ANUBIS TV ROOM", hint: "temple television, smokes once a minute", x: 8, y: 88 },
];

const ROUTES: { from: string; to: string; via: string }[] = [
  { from: "home", to: "urf3d", via: "M 50 50 Q 30 30 15 14" },
  { from: "home", to: "urf", via: "M 50 50 Q 70 30 85 14" },
  { from: "home", to: "town", via: "M 50 50 Q 26 50 8 50" },
  { from: "home", to: "brain", via: "M 50 50 Q 74 50 92 50" },
  { from: "home", to: "yoohoo", via: "M 50 50 Q 50 74 50 92" },
  { from: "brain", to: "bongo", via: "M 92 50 Q 90 68 85 80" },
  { from: "urf3d", to: "town", via: "M 15 14 Q 10 32 8 50" },
  { from: "town", to: "townhex", via: "M 8 50 Q 12 66 25 80" },
  { from: "anubis", to: "yoohoo", via: "M 8 88 Q 30 91 50 92" },
];

export default function MapPage() {
  return (
    <main className="chart-room">
      <Link className="chart-room__back" href="/">
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
          <Link
            key={node.id}
            className={`chart-room__node${node.id === "home" ? " is-home" : ""}`}
            href={node.href}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            aria-label={`Sail to ${node.label}`}
          >
            <span className="chart-room__icon" aria-hidden="true">{node.icon}</span>
            <span className="chart-room__label">
              <b>{node.label}</b>
              <small>{node.hint}</small>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
