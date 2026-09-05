import type { Metadata } from "next";
import Link from "next/link";
import TownGate from "./TownGate";
import "./penguin-town.css";

export const metadata: Metadata = {
  title: "Penguin Town",
  description: "A hex-grid civ-style board where the site starts going 3D.",
};

export default function PenguinTownPage() {
  return (
    <main className="penguin-town">
      <Link className="return-gate" href="/">
        ← RETURN TO THE SPLIT
      </Link>
      <TownGate />
    </main>
  );
}
