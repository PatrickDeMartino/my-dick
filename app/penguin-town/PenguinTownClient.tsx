"use client";

import ProfileGate from "../components/ProfileGate";
import HexBoard from "./HexBoard";

// A render-prop (children as a function) can't cross the server/client RSC
// boundary — React can't serialize a function from a Server Component into
// a Client Component's props. Keeping this whole tree client-side, with
// page.tsx staying a plain server component for its `metadata` export,
// avoids that crash entirely.
export default function PenguinTownClient() {
  return (
    <ProfileGate
      title="Who's building?"
      tagline="Penguin Town remembers plots by whoever claims them. Pick Instagram or X and drop a handle — no password, nothing verified."
    >
      {(profile, signOut) => <HexBoard profile={profile} signOut={signOut} />}
    </ProfileGate>
  );
}
