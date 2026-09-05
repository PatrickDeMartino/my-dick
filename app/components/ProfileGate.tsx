"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

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

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `urf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Site-wide pseudo sign-in. No password, nothing verified against the real
 * platform — a visitor just claims the Instagram or X handle they go by so
 * their builds (starting with Penguin Town) can be attributed to them.
 */
export default function ProfileGate({
  title,
  tagline,
  children,
}: {
  title: string;
  tagline: string;
  children: (profile: Profile, signOut: () => void) => ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null | "loading">("loading");
  const [platform, setPlatform] = useState<"instagram" | "x">("instagram");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reads localStorage, which doesn't exist during SSR — this can only run
    // client-side, after mount, so the "loading" sentinel above is what
    // renders (nothing) on the server and on the client's first paint,
    // avoiding a hydration mismatch between "no profile yet" and "signed in".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(readStoredProfile());
  }, []);

  function signOut() {
    window.localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }

  async function claim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const id = newId();
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, platform, handle, displayName }),
      });
      const data = (await response.json()) as { profile?: Profile; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error ?? "Could not save profile");

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.profile));
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (profile === "loading") return null;

  if (profile) return <>{children(profile, signOut)}</>;

  return (
    <div className="profile-gate">
      <form className="profile-gate-card" onSubmit={claim}>
        <h2>{title}</h2>
        <p className="profile-gate-tagline">{tagline}</p>

        <div className="profile-gate-platform" role="radiogroup" aria-label="Platform">
          <button
            type="button"
            className={platform === "instagram" ? "is-active" : ""}
            onClick={() => setPlatform("instagram")}
            aria-pressed={platform === "instagram"}
          >
            Instagram
          </button>
          <button
            type="button"
            className={platform === "x" ? "is-active" : ""}
            onClick={() => setPlatform("x")}
            aria-pressed={platform === "x"}
          >
            X
          </button>
        </div>

        <label className="profile-gate-field">
          <span>@ username</span>
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder={platform === "instagram" ? "your.igname" : "yourxhandle"}
            maxLength={30}
            required
            autoComplete="off"
          />
        </label>

        <label className="profile-gate-field">
          <span>Display name (optional)</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="What Penguin Town calls you"
            maxLength={40}
            autoComplete="off"
          />
        </label>

        {error && <p className="profile-gate-error">{error}</p>}

        <button type="submit" disabled={submitting || !handle.trim()}>
          {submitting ? "Claiming…" : "Claim your spot"}
        </button>
        <p className="profile-gate-note">
          Self-reported, not verified against {platform === "instagram" ? "Instagram" : "X"}. No password, ever.
        </p>
      </form>
    </div>
  );
}
