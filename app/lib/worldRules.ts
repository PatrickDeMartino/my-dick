export type PlayerCharacter = "zix" | "pip" | "vex" | "pongo";
export const WORLD_PLAYER_KEY = "triptotropic.player.v1";

export function loadPlayer(fallback: PlayerCharacter = "zix"): PlayerCharacter {
  try {
    const value = localStorage.getItem(WORLD_PLAYER_KEY);
    return value === "zix" || value === "pip" || value === "vex" || value === "pongo" ? value : fallback;
  } catch { return fallback; }
}

export function savePlayer(player: PlayerCharacter) {
  try { localStorage.setItem(WORLD_PLAYER_KEY, player); } catch { /* storage is optional */ }
  window.dispatchEvent(new CustomEvent("trip:player-change", { detail: { player } }));
}
