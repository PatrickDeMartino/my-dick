import type { Territory as GlobeTerritory, Point } from "../urf/globe3d";

/**
 * Real-world lon/lat boxes for the invisible arrow target board.
 *
 * Order matters: small / nested regions are tested first so Madagascar is
 * never scored as Africa, Israel is never Saudi, and the Himalayas win over
 * the broader India/China plates. A hit that misses every box falls through
 * to nearest-center as a last resort.
 */
export type TerritoryBox = {
  name: string;
  /** Display pin on the 2D overlay. Small countries stay unnamed until hit. */
  pin: boolean;
  unlocked: boolean;
  center: Point;
  /** Inclusive west..east in degrees (−180..180). west > east means wrap. */
  west: number;
  east: number;
  south: number;
  north: number;
};

export const TERRITORY_BOXES: TerritoryBox[] = [
  { name: "Antarctica", pin: false, unlocked: true, center: [0, -84], west: -180, east: 180, south: -90, north: -60 },
  { name: "Madagascar", pin: true, unlocked: false, center: [47, -19], west: 43, east: 51, south: -26, north: -11.5 },
  { name: "Israel", pin: false, unlocked: false, center: [35.2, 31.5], west: 34.1, east: 35.9, south: 29.4, north: 33.5 },
  { name: "Saudi", pin: false, unlocked: false, center: [45, 24], west: 34.4, east: 55.7, south: 16.2, north: 32.3 },
  { name: "Persian Wasteland", pin: false, unlocked: false, center: [53.5, 32.5], west: 44, east: 63.4, south: 24.8, north: 39.9 },
  { name: "The Great Free Democratic People Republic of North Korea", pin: false, unlocked: false, center: [127.2, 40.2], west: 124.1, east: 130.8, south: 37.6, north: 43.1 },
  { name: "South Korea", pin: false, unlocked: false, center: [127.8, 36.4], west: 125.0, east: 129.7, south: 33.1, north: 38.7 },
  { name: "Japan", pin: false, unlocked: false, center: [138.2, 36.5], west: 129.3, east: 146.2, south: 30.2, north: 45.6 },
  { name: "Himalayas", pin: false, unlocked: false, center: [84, 29.5], west: 72.5, east: 96.2, south: 26.4, north: 37.2 },
  { name: "India", pin: false, unlocked: false, center: [79, 22], west: 68, east: 89.5, south: 6.6, north: 35.6 },
  { name: "Southeast Asia", pin: false, unlocked: false, center: [115, 8], west: 92, east: 141, south: -11.2, north: 23.4 },
  { name: "China", pin: false, unlocked: false, center: [104, 35], west: 73.4, east: 134.8, south: 18.1, north: 53.6 },
  { name: "Middle East", pin: true, unlocked: false, center: [44, 28], west: 32, east: 65, south: 12, north: 42 },
  { name: "Europe", pin: true, unlocked: false, center: [15, 50], west: -11, east: 40, south: 35, north: 72 },
  { name: "Africa", pin: true, unlocked: false, center: [19, 4], west: -18, east: 52, south: -35, north: 37.5 },
  { name: "America", pin: true, unlocked: false, center: [-100, 45], west: -168, east: -52, south: 14, north: 84 },
  { name: "South America", pin: true, unlocked: false, center: [-60, -17], west: -82, east: -34, south: -56, north: 13 },
  { name: "Russia", pin: true, unlocked: false, center: [90, 62], west: 27, east: -169, south: 46, north: 82 },
  { name: "Asia", pin: true, unlocked: false, center: [90, 40], west: 60, east: 150, south: 5, north: 56 },
];

export const TERRITORIES: GlobeTerritory[] = TERRITORY_BOXES.map((box) => ({
  name: box.name,
  center: box.center,
  unlocked: box.unlocked,
}));

export const PIN_MARKERS = TERRITORY_BOXES.filter((box) => box.pin && !box.unlocked);

const wrapLon = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;

function lonInRange(lon: number, west: number, east: number) {
  const wrapped = wrapLon(lon);
  if (west <= east) return wrapped >= west && wrapped <= east;
  return wrapped >= west || wrapped <= east;
}

export function territoryFromLonLat(lon: number, lat: number): TerritoryBox | null {
  for (const box of TERRITORY_BOXES) {
    if (lat >= box.south && lat <= box.north && lonInRange(lon, box.west, box.east)) {
      return box;
    }
  }
  return null;
}

export const LAND_COLOR_PRESETS: { id: string; label: string; hex: number }[] = [
  { id: "original", label: "URF", hex: 0xffffff },
  { id: "acid", label: "ACID", hex: 0xb9ff39 },
  { id: "dusk", label: "DUSK", hex: 0xff7ad4 },
  { id: "ice", label: "ICE", hex: 0x88e7ff },
  { id: "lava", label: "LAVA", hex: 0xff5a32 },
  { id: "gold", label: "GOLD", hex: 0xf1c86e },
];
