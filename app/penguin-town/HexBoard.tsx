"use client";

import { FormEvent, type CSSProperties, useEffect, useMemo, useState } from "react";
import type { Profile } from "../components/ProfileGate";
import {
  BOARD_RADIUS,
  BUILDING_TYPES,
  COLORWAYS,
  HEX_SIZE,
  axialToPixel,
  boardHexes,
  buildingMeta,
  colorwayMeta,
  hexKey,
  type BuildingId,
  type ColorwayId,
} from "./hexGrid";

type Claim = {
  id: string;
  boardId: string;
  q: number;
  r: number;
  ownerId: string;
  buildingType: string;
  colorway: string;
  label: string;
};

const BOARD_ID = "penguin-town";
const HEXES = boardHexes(BOARD_RADIUS);

export default function HexBoard({ profile, signOut }: { profile: Profile; signOut: () => void }) {
  const [claims, setClaims] = useState<Record<string, Claim>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ q: number; r: number } | null>(null);
  const [buildingType, setBuildingType] = useState<BuildingId>("igloo");
  const [colorway, setColorway] = useState<ColorwayId>("ice");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/hex?board=${BOARD_ID}`)
      .then((response) => response.json())
      .then((data: { claims?: Claim[] }) => {
        if (cancelled) return;
        const byKey: Record<string, Claim> = {};
        for (const claim of data.claims ?? []) byKey[hexKey(claim.q, claim.r)] = claim;
        setClaims(byKey);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const bounds = useMemo(() => {
    const points = HEXES.map(({ q, r }) => axialToPixel(q, r));
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      width: Math.max(...xs) - Math.min(...xs) + HEX_SIZE * 3,
      height: Math.max(...ys) - Math.min(...ys) + HEX_SIZE * 3,
      offsetX: -Math.min(...xs) + HEX_SIZE * 1.5,
      offsetY: -Math.min(...ys) + HEX_SIZE * 1.5,
    };
  }, []);

  const selectedClaim = selected ? claims[hexKey(selected.q, selected.r)] : undefined;
  const isTownHall = selected?.q === 0 && selected?.r === 0;
  const isMine = selectedClaim?.ownerId === profile.id;
  const isEmpty = selected && !selectedClaim && !isTownHall;

  function openHex(q: number, r: number) {
    const claim = claims[hexKey(q, r)];
    setSelected({ q, r });
    setBuildingType((claim?.buildingType as BuildingId) ?? "igloo");
    setColorway((claim?.colorway as ColorwayId) ?? "ice");
    setLabel(claim?.label ?? "");
    setError(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/hex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: BOARD_ID,
          q: selected.q,
          r: selected.r,
          ownerId: profile.id,
          buildingType,
          colorway,
          label,
        }),
      });
      const data = (await response.json()) as { claim?: Claim; error?: string };
      if (!response.ok || !data.claim) throw new Error(data.error ?? "Could not save");
      setClaims((current) => ({ ...current, [hexKey(selected.q, selected.r)]: data.claim as Claim }));
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function release() {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/hex", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: BOARD_ID, q: selected.q, r: selected.r, ownerId: profile.id }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Could not release");
      setClaims((current) => {
        const next = { ...current };
        delete next[hexKey(selected.q, selected.r)];
        return next;
      });
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="penguin-board-shell">
      <header className="penguin-board-header">
        <div>
          <h1>Penguin Town</h1>
          <p>A civ-style hex board. Claim a plot, build on it — this is the first patch of a site that&apos;s slowly going 3D.</p>
        </div>
        <div className="penguin-board-identity">
          <span className="penguin-board-handle">
            @{profile.handle} <i>{profile.platform === "instagram" ? "IG" : "X"}</i>
          </span>
          <button type="button" onClick={signOut}>
            switch profile
          </button>
        </div>
      </header>

      <div className="penguin-board-viewport" aria-busy={loading}>
        <div className="penguin-board" style={{ width: bounds.width, height: bounds.height }}>
          {HEXES.map(({ q, r }) => {
            const { x, y } = axialToPixel(q, r);
            const claim = claims[hexKey(q, r)];
            const townHall = q === 0 && r === 0;
            const building = townHall ? { emoji: "🐧", label: "Town Hall" } : claim ? buildingMeta(claim.buildingType) : null;
            const colorMeta = claim ? colorwayMeta(claim.colorway) : null;

            return (
              <button
                key={hexKey(q, r)}
                type="button"
                className={`hex-tile${claim ? " hex-claimed" : ""}${townHall ? " hex-town-hall" : ""}${
                  selected?.q === q && selected?.r === r ? " hex-selected" : ""
                }`}
                style={{
                  left: x + bounds.offsetX,
                  top: y + bounds.offsetY,
                  "--hex-color": colorMeta?.color,
                } as CSSProperties}
                onClick={() => !townHall && openHex(q, r)}
                disabled={townHall}
                aria-label={
                  townHall ? "Town Hall" : claim ? `${claim.label || building?.label} by @${claim.ownerId === profile.id ? "you" : ""}` : `Empty plot ${q},${r}`
                }
              >
                <span className="hex-face">
                  {building ? <span className="hex-emoji">{building.emoji}</span> : <span className="hex-plus">+</span>}
                  {claim && <span className="hex-label">{claim.label || building?.label}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="hex-panel-backdrop"
          role="button"
          tabIndex={0}
          aria-label="Close"
          onClick={() => setSelected(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setSelected(null);
          }}
        >
          {/* onClick here only stops the backdrop's close-click from bubbling
              up through the panel — it adds no interaction of its own, so
              there's no keyboard equivalent to provide. */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
          <form className="hex-panel" onClick={(event) => event.stopPropagation()} onSubmit={save}>
            <h2>
              {isEmpty ? "Build here" : isMine ? "Edit your plot" : "Taken"} <small>({selected.q}, {selected.r})</small>
            </h2>

            {!isMine && !isEmpty && selectedClaim ? (
              <p className="hex-panel-note">
                Built by another player. Pick a different empty hex to build your own.
              </p>
            ) : (
              <>
                <label className="profile-gate-field">
                  <span>Building</span>
                  <select value={buildingType} onChange={(event) => setBuildingType(event.target.value as BuildingId)}>
                    {BUILDING_TYPES.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.emoji} {building.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="hex-colorway-picker" role="radiogroup" aria-label="Colorway">
                  {COLORWAYS.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={colorway === option.id ? "is-active" : ""}
                      style={{ "--swatch": option.color } as CSSProperties}
                      onClick={() => setColorway(option.id)}
                      aria-pressed={colorway === option.id}
                      aria-label={option.label}
                    />
                  ))}
                </div>

                <label className="profile-gate-field">
                  <span>Label (optional)</span>
                  <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={24} placeholder="Name your plot" />
                </label>

                {error && <p className="profile-gate-error">{error}</p>}

                <div className="hex-panel-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? "Saving…" : isMine ? "Save changes" : "Claim plot"}
                  </button>
                  {isMine && (
                    <button type="button" className="hex-panel-release" onClick={release} disabled={saving}>
                      Release
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
