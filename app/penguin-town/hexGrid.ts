// Flat-top axial hex grid. Shared by the board UI and, eventually, by
// whatever board comes after Penguin Town when the site spreads outward.
export const BOARD_RADIUS = 3;
export const HEX_SIZE = 54; // px, center to corner

export type Axial = { q: number; r: number };

export function boardHexes(radius: number): Axial[] {
  const hexes: Axial[] = [];
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) hexes.push({ q, r });
  }
  return hexes;
}

export function axialToPixel(q: number, r: number, size = HEX_SIZE) {
  return {
    x: size * 1.5 * q,
    y: size * Math.sqrt(3) * (r + q / 2),
  };
}

export function hexKey(q: number, r: number) {
  return `${q}:${r}`;
}

export const BUILDING_TYPES = [
  { id: "igloo", label: "Igloo", emoji: "🧊" },
  { id: "fish-shack", label: "Fish Shack", emoji: "🐟" },
  { id: "ice-rink", label: "Ice Rink", emoji: "🏒" },
  { id: "snow-fort", label: "Snow Fort", emoji: "❄️" },
  { id: "aurora-tower", label: "Aurora Tower", emoji: "🌌" },
] as const;

export type BuildingId = (typeof BUILDING_TYPES)[number]["id"];

export const COLORWAYS = [
  { id: "ice", label: "Ice", color: "#69f8ff" },
  { id: "aurora", label: "Aurora", color: "#b9ff39" },
  { id: "coral", label: "Coral", color: "#ff6b81" },
  { id: "kelp", label: "Kelp", color: "#4bd97b" },
  { id: "dusk", label: "Dusk", color: "#a68bff" },
] as const;

export type ColorwayId = (typeof COLORWAYS)[number]["id"];

export function buildingMeta(id: string) {
  return BUILDING_TYPES.find((building) => building.id === id) ?? BUILDING_TYPES[0];
}

export function colorwayMeta(id: string) {
  return COLORWAYS.find((colorway) => colorway.id === id) ?? COLORWAYS[0];
}
