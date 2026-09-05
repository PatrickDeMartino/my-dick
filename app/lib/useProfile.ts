"use client";

import { useCallback, useEffect, useState } from "react";

export type Profile = {
  id: string;
  platform: "instagram" | "x";
  handle: string;
  displayName: string | null;
};

const STORAGE_KEY = "urf.profile";

function readStoredProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    return parsed?.id && parsed?.handle ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Site-wide pseudo identity. Nothing about the site requires it — it's
 * purely so a visitor can *optionally* attach the Instagram/X handle they
 * go by to something they do (claim a Penguin Town plot, etc). No password,
 * nothing verified against the real platform, and nowhere does its absence
 * block viewing or navigating anything.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists client-side
    setProfile(readStoredProfile());
    setReady(true);
  }, []);

  const save = useCallback((next: Profile) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* The in-memory profile still works this visit even if storage is unavailable. */
    }
    setProfile(next);
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Nothing to clean up if storage was never available. */
    }
    setProfile(null);
  }, []);

  return { profile, ready, save, signOut };
}
