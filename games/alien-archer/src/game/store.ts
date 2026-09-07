import { create } from "zustand";
import type { AlienId, AmmoCan, WeaponId } from "./characters";
import { CHARACTERS } from "./characters";

export type Phase = "attract" | "playing" | "paused" | "dead";

export type MinimapDot = {
  x: number;
  z: number;
  kind: "enemy" | "pickup" | "island";
  r?: number;
};

export type GameHud = {
  phase: Phase;
  character: AlienId;
  weapon: WeaponId;
  ammoCan: AmmoCan;
  health: number;
  maxHealth: number;
  akAmmo: number;
  akMags: number;
  revAmmo: number;
  revSpare: number;
  reloading: number;
  score: number;
  highScore: number;
  wave: number;
  hint: string;
  muted: boolean;
  shake: boolean;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  grounded: boolean;
  minimap: MinimapDot[];
  kills: number;
  ready: boolean;
  hitFlash: number;
};

const HS_KEY = "planet-urf-hiscore-v2";

function readHighScore(): number {
  try {
    const raw = localStorage.getItem(HS_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function persistHighScore(score: number) {
  try {
    const prev = readHighScore();
    if (score > prev) localStorage.setItem(HS_KEY, String(score));
  } catch {
    /* ignore quota */
  }
}

export const initialHud: GameHud = {
  phase: "attract",
  character: "zix",
  weapon: "revolver",
  ammoCan: "pepsi",
  health: 120,
  maxHealth: 120,
  akAmmo: 30,
  akMags: 2,
  revAmmo: 6,
  revSpare: 24,
  reloading: 0,
  score: 0,
  highScore: 0,
  wave: 1,
  hint: "",
  muted: false,
  shake: true,
  playerX: 0,
  playerZ: 0,
  playerYaw: 0,
  grounded: true,
  minimap: [],
  kills: 0,
  ready: false,
  hitFlash: 0,
};

type Store = GameHud & {
  patch: (p: Partial<GameHud>) => void;
};

export const useGameStore = create<Store>((set) => ({
  ...initialHud,
  highScore: 0,
  patch: (p) => set(p),
}));

export function hydrateHighScore() {
  useGameStore.getState().patch({ highScore: readHighScore() });
}

export function applyCharacter(id: AlienId) {
  const def = CHARACTERS[id];
  useGameStore.getState().patch({
    character: id,
    maxHealth: def.hp,
    health: def.hp,
  });
}
