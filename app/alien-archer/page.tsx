import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Alien Archer | Triptotropic",
  description: "Launch from Planet Urf into the alien archer world.",
};

export default function AlienArcherPage() {
  return (
    <main className="alien-archer-screen">
      <Link className="alien-archer-back" href="/urf-3d">← PLANET URF</Link>
      <iframe
        className="alien-archer-frame"
        src="/alien-archer-game/index.html"
        title="Alien Archer game world"
        allow="fullscreen; autoplay"
      />
    </main>
  );
}
