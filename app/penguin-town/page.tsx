import type { Metadata } from "next";
import Link from "next/link";
import ProfileGate from "../components/ProfileGate";
import HexBoard from "./HexBoard";
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
      <ProfileGate
        title="Who's building?"
        tagline="Penguin Town remembers plots by whoever claims them. Pick Instagram or X and drop a handle — no password, nothing verified."
      >
        {(profile, signOut) => <HexBoard profile={profile} signOut={signOut} />}
      </ProfileGate>
    </main>
  );
}
