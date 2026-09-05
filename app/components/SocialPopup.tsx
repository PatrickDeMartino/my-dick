"use client";

import { FormEvent, useState } from "react";
import type { Profile } from "../lib/useProfile";

// Matches the server's validation in app/api/profile/route.ts. Stripped live
// as you type (not just rejected on submit) so nothing that could ever read
// as a link — no periods, no slashes, no "@" mid-string — is typeable here.
const sanitizeHandle = (raw: string) => raw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30);
const sanitizeDisplayName = (raw: string) => raw.replace(/[^a-zA-Z0-9_ '!?-]/g, "").slice(0, 40);

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `urf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * A dismissible corner popup, not a gate — closing it (the × or clicking
 * past it) never blocks anything. It only ever asks; it never requires.
 */
export default function SocialPopup({
  title,
  tagline,
  onClose,
  onSaved,
}: {
  title: string;
  tagline: string;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [platform, setPlatform] = useState<"instagram" | "x">("instagram");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
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
      if (!response.ok || !data.profile) throw new Error(data.error ?? "Could not save");
      onSaved(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="social-popup" role="dialog" aria-label={title}>
      <button type="button" className="social-popup__close" aria-label="Close, no thanks" onClick={onClose}>×</button>
      <form className="social-popup__form" onSubmit={submit}>
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
            onChange={(event) => setHandle(sanitizeHandle(event.target.value))}
            placeholder={platform === "instagram" ? "yourigname" : "yourxhandle"}
            maxLength={30}
            required
            autoComplete="off"
          />
        </label>

        <label className="profile-gate-field">
          <span>Display name (optional)</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(sanitizeDisplayName(event.target.value))}
            placeholder="What to call you"
            maxLength={40}
            autoComplete="off"
          />
        </label>

        {error && <p className="profile-gate-error">{error}</p>}

        <div className="social-popup__actions">
          <button type="submit" disabled={submitting || !handle.trim()}>
            {submitting ? "Sending…" : "Send"}
          </button>
          <button type="button" className="social-popup__skip" onClick={onClose}>Skip</button>
        </div>
        <p className="profile-gate-note">
          Letters, numbers and underscores only — no periods, no links, no uploads. Self-reported, not verified,
          no password, ever — and totally optional.
        </p>
      </form>
    </div>
  );
}
