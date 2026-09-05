import type { Metadata } from "next";
import Link from "next/link";
import HexBoard from "./HexBoard";
import "./penguin-town.css";

export const metadata: Metadata = {
  title: "Penguin Town · Hex Colony",
  description: "An experimental hex-grid civ-style board — a second take on Penguin Town, alongside the main 3D one.",
};

export default function PenguinTownPage() {
  return (
    <main className="penguin-town">
      <Link className="return-gate" href="/">
        ← RETURN TO THE SPLIT
      </Link>
      <HexBoard />
    </main>
  );
}
