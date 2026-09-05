"use client";

import ProfileGate from "../components/ProfileGate";
import HexBoard from "./HexBoard";

export default function TownGate() {
  return (
    <ProfileGate
      title="Who's building?"
      tagline="Penguin Town remembers plots by whoever claims them. Pick Instagram or X and drop a handle — no password, nothing verified."
    >
      {(profile, signOut) => <HexBoard profile={profile} signOut={signOut} />}
    </ProfileGate>
  );
}
