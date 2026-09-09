export type AlienId = "zix" | "pip" | "vex";
export type WeaponId = "ak" | "revolver";

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
};

export const CHARACTER_LIST: AlienId[] = ["zix", "pip", "vex"];

export const WEAPONS: Record<
  WeaponId,
  { name: string; magSize: number; damage: number; cooldown: number; reload: number; speed: number; spread: number; auto: boolean }
> = {
  ak: {
    name: "AK-47",
    magSize: 30,
    damage: 1,
    cooldown: 0.095,
    reload: 1.55,
    speed: 78,
    spread: 0.028,
    auto: true,
  },
  revolver: {
    name: "REVOLVER",
    magSize: 6,
    damage: 2,
    cooldown: 0.38,
    reload: 1.7,
    speed: 52,
    spread: 0.008,
    auto: false,
  },
};
