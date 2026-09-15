export type AlienId = "zix" | "pip" | "vex" | "pongo";
export type WeaponId = "ak" | "revolver" | "bow";

export type CharacterDef = {
  id: AlienId;
  name: string;
  epithet: string;
  blurb: string;
  hp: number;
  speed: number;
  jump: number;
  scale: number;
  followH: number;
  radius: number;
  recoil: number;
  pickupBonus: number;
  skin: number;
  skinDark: number;
  skinDeep: number;
  emissive: number;
};

export const CHARACTERS: Record<AlienId, CharacterDef> = {
  zix: {
    id: "zix",
    name: "ZIX",
    epithet: "THE TALL ONE",
    blurb: "Classic greentall. Long sightline, extra hide, slower feet.",
    hp: 120,
    speed: 0.88,
    jump: 1.02,
    scale: 1.16,
    followH: 2.55,
    radius: 0.36,
    recoil: 0.82,
    pickupBonus: 0,
    skin: 0x7cff3a,
    skinDark: 0x3aaa1c,
    skinDeep: 0x246814,
    emissive: 0x164a08,
  },
  pip: {
    id: "pip",
    name: "PIP",
    epithet: "THE SHORTWAVE",
    blurb: "Pocket raider. Giraffe antennas. Fast, jumpy, hard to hit.",
    hp: 80,
    speed: 1.24,
    jump: 1.32,
    scale: 0.72,
    followH: 1.85,
    radius: 0.26,
    recoil: 0.68,
    pickupBonus: 0,
    skin: 0x9dff4a,
    skinDark: 0x4aaa22,
    skinDeep: 0x2e7a16,
    emissive: 0x1c5a0c,
  },
  vex: {
    id: "vex",
    name: "VEX",
    epithet: "THE VIOLET",
    blurb: "Medium menace. Ammo magnet. Mean with a cylinder.",
    hp: 100,
    speed: 1.04,
    jump: 1.1,
    scale: 0.98,
    followH: 2.25,
    radius: 0.32,
    recoil: 0.9,
    pickupBonus: 1,
    skin: 0xb86aff,
    skinDark: 0x6a28b8,
    skinDeep: 0x4a1878,
    emissive: 0x3a1070,
  },
  pongo: {
    id: "pongo",
    name: "PONGO",
    epithet: "THE KNUCKLE",
    blurb: "Big dumb monkey. Knuckle-walks on long, long arms. Hits like a landslide.",
    hp: 140,
    speed: 0.95,
    jump: 0.92,
    scale: 1.05,
    followH: 2.4,
    radius: 0.4,
    recoil: 0.7,
    pickupBonus: 0,
    skin: 0xa8703a,
    skinDark: 0x6e4420,
    skinDeep: 0x4a2c14,
    emissive: 0x2a1608,
  },
};

export const CHARACTER_LIST: AlienId[] = ["zix", "pip", "vex", "pongo"];

export const WEAPONS: Record<
  WeaponId,
  { name: string; magSize: number; damage: number; cooldown: number; reload: number; speed: number; spread: number; auto: boolean }
> = {
  ak: {
    // Fires flying cans now, not bullets — slow and lobbed on purpose, so a shot is
    // trackable (and dodgeable, for PvP) across a long range instead of feeling hitscan.
    name: "AK-47",
    magSize: 30,
    damage: 1,
    cooldown: 0.095,
    reload: 1.55,
    speed: 20,
    spread: 0.028,
    auto: true,
  },
  revolver: {
    name: "REVOLVER",
    magSize: 6,
    damage: 2,
    cooldown: 0.38,
    reload: 1.7,
    speed: 15.5,
    spread: 0.008,
    auto: false,
  },
  bow: {
    // Urf Archer's bow — unlimited arrows, no reload, but a heavier draw so it
    // can't be spammed like the revolver. magSize: Infinity is the "never runs out" flag.
    name: "BOW",
    magSize: Infinity,
    damage: 3,
    cooldown: 0.62,
    reload: 0,
    speed: 24,
    spread: 0.004,
    auto: false,
  },
};
