// Shared grid/terrain/building data for Penguin Town, used by both the React
// UI shell (dialogs, currency, inventory) in page.tsx and the 3D renderer in
// PenguinTownScene3D.tsx. Keeping this in one place means the terrain the
// player sees always agrees with the terrain the placement rules check.

export type TownBuilding = {
  id: string;
  label: string;
  hint: string;
  terrain: PlaceableTerrain;
  footprint: { width: number; height: number };
  sheet: { column: number; row: number };
  image?: string;
  upgradeImage?: string;
  start: { column: number; row: number };
  visualScale: number;
  /**
   * Optional path to a Blender-exported .glb model (glTF Binary) for the 3D
   * scene. Until a building has one, PenguinTownScene3D falls back to a
   * placeholder block so the game stays fully playable while models are
   * still being made.
   */
  model?: string;
};

export const GRID_COLUMN_MIN = -12;
export const GRID_COLUMN_MAX = 47;
export const GRID_ROW_MIN = -12;
export const GRID_ROW_MAX = 47;
export const GRID_COLUMNS = GRID_COLUMN_MAX - GRID_COLUMN_MIN;
export const GRID_ROWS = GRID_ROW_MAX - GRID_ROW_MIN;
export const ISO_ORIGIN_X = 50;
export const ISO_ORIGIN_Y = 28.5;
export const ISO_CELL_X = 2.65;
// This 2.94:1 percentage ratio renders as a roughly 2:1 isometric diamond
// inside the map's 2:3 portrait frame, matching the painted cliff edges.
export const ISO_CELL_Y = 0.9;

export type TerrainType = "land" | "ocean" | "cliff" | "blocked";
export type PlaceableTerrain = Exclude<TerrainType, "blocked">;
export type TerrainPoint = readonly [x: number, y: number];

export type TerrainRegion = Readonly<{
  surface: readonly TerrainPoint[];
  bounds: readonly TerrainPoint[];
}>;

export const BACKGROUND_OCEAN_EDGE: readonly TerrainPoint[] = [
  [-25, 33], [0, 32], [15, 31.5], [30, 29.5], [45, 28], [60, 26.5], [75, 26], [90, 29], [100, 32], [125, 33],
];
// The editor controls occupy the foreground below this line on both desktop
// and the shorter mobile map, so those covered tiles are intentionally blocked.
export const FOREGROUND_BUILD_LIMIT_Y = 84.5;
// How far past the original 0–100 painted-art strip the open-ocean band now
// reaches on each side — widened alongside the bigger island so there's a
// proportionally bigger ring of buildable/dock-able ocean tiles around it.
export const OCEAN_BAND_X_MIN = -25;
export const OCEAN_BAND_X_MAX = 125;

// Scaled up ~1.2x from the originally painted 2:3 art (anchored near the
// upper island so growth pushes outward into open ocean on the sides/top
// rather than deeper under the foreground UI band) — more buildable land,
// more coastline, and correspondingly more open ocean around it once the
// blocked-boundary check below is widened to match.
export const TERRAIN_REGIONS = {
  upperPlateau: {
    surface: [[59.6, 31.2], [62.7, 27.7], [68.9, 24.8], [76.3, 26], [81.3, 30], [83.8, 34.7], [81.3, 38.1], [73.8, 37.6], [66.4, 34.7], [60.2, 34.1]],
    bounds: [[57.7, 31.8], [61.4, 26.5], [68.9, 24.2], [76.9, 25.4], [83.1, 30], [86.2, 37.6], [85, 43.4], [80, 45.7], [72.6, 41], [65.2, 37.6], [59, 37]],
  },
  lowerIsland: {
    surface: [[40.4, 34.1], [56.5, 32.3], [65.2, 34.7], [73.8, 37], [81.3, 38.7], [83.8, 42.2], [86.2, 50.3], [85, 57.3], [90, 63.1], [97.4, 68.3], [103.6, 72.4], [103.6, 77], [96.2, 79.9], [86.2, 84], [76.3, 92.1], [66.4, 92.1], [57.7, 88.6], [50.3, 84], [41.6, 82.8], [37.9, 79.3], [42.8, 73.5], [42.8, 70], [32.9, 71.2], [25.5, 68.9], [21.8, 65.4], [19.3, 60.8], [16.8, 55], [14.3, 51.5], [11.8, 46.8], [11.8, 42.2], [21.8, 38.7], [32.9, 37]],
    bounds: [[39.1, 34.1], [56.5, 31.2], [66.4, 34.1], [75.1, 36.4], [82.5, 37.6], [86.2, 41], [88.7, 50.3], [87.5, 58.4], [92.4, 64.2], [101.1, 68.9], [106.1, 73.5], [106.1, 78.2], [98.6, 82.8], [88.7, 86.3], [77.6, 94.4], [66.4, 95.6], [56.5, 90.9], [49, 87.4], [40.4, 86.3], [35.4, 82.8], [36.6, 77], [40.4, 72.4], [31.7, 74.7], [24.2, 72.4], [19.3, 68.9], [16.8, 64.2], [14.3, 58.4], [11.8, 53.8], [9.4, 49.2], [8.1, 44.5], [11.8, 39.9], [21.8, 37.6], [31.7, 35.8]],
  },
} as const satisfies Record<string, TerrainRegion>;

export const buildings: TownBuilding[] = [
  { id: "plane", label: "PLANE", hint: "Flight deck · 3×2", terrain: "land", footprint: { width: 3, height: 2 }, sheet: { column: 0, row: 0 }, image: "/buildings/plane.png", start: { column: 3, row: 12 }, visualScale: 2.05 },
  { id: "telescope", label: "TELESCOPE", hint: "Observatory · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 1, row: 0 }, image: "/buildings/telescope-wood.png", upgradeImage: "/buildings/telescope-metal.png", start: { column: 3, row: -4 }, visualScale: 2.18 },
  { id: "magic", label: "CIRCUS", hint: "Questionable entertainment · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 0, row: 1 }, image: "/buildings/circus.png", start: { column: 15, row: 6 }, visualScale: 1.9 },
  { id: "igloo", label: "IGLOO", hint: "Housing · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 1, row: 1 }, image: "/buildings/igloo.png", start: { column: 28, row: 16 }, visualScale: 1.9 },
  { id: "sweatshop", label: "SWEATSHOP", hint: "Production · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 0, row: 2 }, image: "/buildings/sweatshop.png", start: { column: 14, row: 19 }, visualScale: 2.15 },
  { id: "docks", label: "DOCKS & CARGO", hint: "Ocean route · 3×2", terrain: "ocean", footprint: { width: 3, height: 2 }, sheet: { column: 1, row: 2 }, image: "/buildings/cargo-ship-v2.png", start: { column: 10, row: -6 }, visualScale: 2.3 },
  { id: "arena", label: "DOG-FIGHT ARENA", hint: "Fight club · 3×2", terrain: "land", footprint: { width: 3, height: 2 }, sheet: { column: 0, row: 3 }, image: "/buildings/dogfight-arena.png", start: { column: 31, row: 27 }, visualScale: 2.2 },
];

export type TownDialogSubject = Pick<TownBuilding, "id" | "label">;
export const flipperFlappington: TownDialogSubject = { id: "flipper", label: "FLIPPER FLAPPINGTON" };

export const BUILDING_STORIES: Record<string, { character: string; name: string; role: string; description: string }> = {
  plane: { character: "/evil-penguin.jpg", name: "CAPTAIN FLAPS", role: "UNLICENSED BUSH PILOT", description: "A ski-biplane held together with wire, spite, and aviation crimes." },
  telescope: { character: "/media/alien-astronomer-v1.png", name: "ZORB", role: "ALIEN PEEPING-TOM", description: "A giant brass eye aimed directly at whatever the government denies." },
  magic: { character: "/evil-penguin.jpg", name: "RINGMASTER WADDLES", role: "BLACK-MARKET RINGMASTER", description: "Questionable creatures, weaponized drones, and absolutely no refunds." },
  igloo: { character: "/media/dr-bongo-model-icon-v1.png", name: "DR. BONGO", role: "DRONE WARLORD", description: "A warm igloo, a cold laboratory, and an ape planning air superiority." },
  sweatshop: { character: "/penguinaroo.png", name: "PENGUINAROO", role: "SWEATSHOP TYRANT", description: "Cheap shit goes in. Profitable shit comes out. Nobody gets a lunch break." },
  docks: { character: "/media/lab-rat-v1.png", name: "CAPTAIN SQUEAK", role: "OFFSHORE RAT BARON", description: "A filthy cargo tub breeding rats faster than customs can count them." },
  arena: { character: "/vicheal-nic.jpg", name: "VICHEAL NIC", role: "DOG-FIGHT PROMOTER", description: "A frozen boxing pit where bad dogs settle worse gambling debts." },
};

export const CIRCUS_STOCK = [
  ["Lion", 7], ["Elephant", 13], ["Fighter Dog", 9], ["Meat Dog", 5], ["Rats", 3], ["Birds", 3],
  ["Pigeons", 3], ["Seagulls", 4], ["Parrots", 6], ["Quad-copter Drones", 10], ["Drone Swarms", 12], ["Fully Autonomous Robot Army", 13],
] as const;

export type Rotation = 0 | 90 | 180 | 270;
export const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270];
export const nextRotation = (rotation: Rotation): Rotation => ROTATIONS[(ROTATIONS.indexOf(rotation) + 1) % ROTATIONS.length];

export type GridPosition = { column: number; row: number };
export type TownLayout = Record<string, GridPosition & { stored: boolean; rotation: Rotation }>;
export type PlacementPreview = GridPosition & { id: string; valid: boolean; rotation: Rotation };

/** A building rotated 90°/270° occupies its footprint sideways for placement and collision purposes. */
export const rotatedFootprint = (building: TownBuilding, rotation: Rotation): { width: number; height: number } => {
  const { width, height } = building.footprint;
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
};

export const createDefaultTownLayout = (): TownLayout => Object.fromEntries(
  buildings.map((building) => [building.id, { ...building.start, stored: false, rotation: 0 as Rotation }]),
);

export const pointInPolygon = ([x, y]: TerrainPoint, polygon: readonly TerrainPoint[]): boolean => {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const [currentX, currentY] = polygon[current];
    const [previousX, previousY] = polygon[previous];
    const crossesRay = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crossesRay) inside = !inside;
  }
  return inside;
};

const backgroundOceanEdgeAt = (screenX: number): number => {
  const clampedX = Math.max(OCEAN_BAND_X_MIN, Math.min(OCEAN_BAND_X_MAX, screenX));
  for (let index = 1; index < BACKGROUND_OCEAN_EDGE.length; index += 1) {
    const [leftX, leftY] = BACKGROUND_OCEAN_EDGE[index - 1];
    const [rightX, rightY] = BACKGROUND_OCEAN_EDGE[index];
    if (clampedX <= rightX) {
      const progress = (clampedX - leftX) / (rightX - leftX);
      return leftY + (rightY - leftY) * progress;
    }
  }
  return BACKGROUND_OCEAN_EDGE[BACKGROUND_OCEAN_EDGE.length - 1][1];
};

export const terrainAt = (column: number, row: number): TerrainType => {
  const screenX = ISO_ORIGIN_X + (column - row) * ISO_CELL_X;
  const screenY = ISO_ORIGIN_Y + (column + row + 1) * ISO_CELL_Y;
  const point: TerrainPoint = [screenX, screenY];

  if (pointInPolygon(point, TERRAIN_REGIONS.upperPlateau.surface)) return "land";
  if (pointInPolygon(point, TERRAIN_REGIONS.upperPlateau.bounds)) return "cliff";
  if (pointInPolygon(point, TERRAIN_REGIONS.lowerIsland.surface)) return "land";
  if (pointInPolygon(point, TERRAIN_REGIONS.lowerIsland.bounds)) return "cliff";
  if (screenX < OCEAN_BAND_X_MIN || screenX > OCEAN_BAND_X_MAX || screenY < backgroundOceanEdgeAt(screenX) || screenY > FOREGROUND_BUILD_LIMIT_Y) return "blocked";
  return "ocean";
};

/** Which tier of the island a grid cell sits on — drives 3D height + which terrain mesh a building rests on. */
export type TownTier = "plateau" | "lower" | "ocean";

export const tierAt = (column: number, row: number): TownTier => {
  const screenX = ISO_ORIGIN_X + (column - row) * ISO_CELL_X;
  const screenY = ISO_ORIGIN_Y + (column + row + 1) * ISO_CELL_Y;
  const point: TerrainPoint = [screenX, screenY];
  if (pointInPolygon(point, TERRAIN_REGIONS.upperPlateau.bounds)) return "plateau";
  if (pointInPolygon(point, TERRAIN_REGIONS.lowerIsland.bounds)) return "lower";
  return "ocean";
};

export const terrainPlacementIssue = (terrain: PlaceableTerrain): string => {
  if (terrain === "ocean") return "THE CARGO BOAT NEEDS OPEN OCEAN";
  if (terrain === "cliff") return "THIS STRUCTURE NEEDS AN OPEN CLIFF TILE";
  return "LAND BUILDINGS NEED SOLID SNOW";
};

export const terrainMoveInstruction = (terrain: PlaceableTerrain): string => {
  if (terrain === "ocean") return "MOVE OVER OPEN OCEAN · TAP TO PLACE";
  if (terrain === "cliff") return "MOVE OVER AN OPEN CLIFF TILE · TAP TO PLACE";
  return "MOVE OVER OPEN SNOW · TAP TO PLACE";
};

export const terrainInventoryInstruction = (terrain: PlaceableTerrain): string => {
  if (terrain === "ocean") return "THE CARGO BOAT CAN ONLY USE OCEAN CELLS";
  if (terrain === "cliff") return "THIS STRUCTURE CAN ONLY USE CLIFF CELLS";
  return "LAND BUILDINGS REQUIRE OPEN SNOW CELLS";
};

export const placementIssue = (building: TownBuilding, position: GridPosition, layout: TownLayout, rotation: Rotation = 0): string | null => {
  const footprint = rotatedFootprint(building, rotation);
  const cells: string[] = [];
  for (let row = position.row; row < position.row + footprint.height; row += 1) {
    for (let column = position.column; column < position.column + footprint.width; column += 1) {
      if (column < GRID_COLUMN_MIN || row < GRID_ROW_MIN || column >= GRID_COLUMN_MAX || row >= GRID_ROW_MAX) return "OUTSIDE THE BUILD GRID";
      if (terrainAt(column, row) !== building.terrain) {
        return terrainPlacementIssue(building.terrain);
      }
      cells.push(`${column}:${row}`);
    }
  }

  const occupied = new Set<string>();
  for (const other of buildings) {
    if (other.id === building.id || layout[other.id]?.stored) continue;
    const placed = layout[other.id];
    if (!placed) continue;
    const otherFootprint = rotatedFootprint(other, placed.rotation ?? 0);
    for (let row = placed.row; row < placed.row + otherFootprint.height; row += 1) {
      for (let column = placed.column; column < placed.column + otherFootprint.width; column += 1) {
        occupied.add(`${column}:${row}`);
      }
    }
  }
  return cells.some((cell) => occupied.has(cell)) ? "THAT SPACE IS OCCUPIED" : null;
};

export const isValidSavedTownLayout = (layout: TownLayout): boolean => buildings.every((building) => {
  const position = layout[building.id];
  if (!position || !Number.isInteger(position.column) || !Number.isInteger(position.row) || typeof position.stored !== "boolean") return false;
  if (!ROTATIONS.includes(position.rotation)) return false;
  return position.stored || placementIssue(building, position, layout, position.rotation) === null;
});

export const RAT_MEAT_STORAGE_KEY = "trip.rat-meat.v1";
export const RAT_MEAT_BALANCE_EVENT = "trip-rat-meat-balance-changed";
export const TELESCOPE_UPGRADE_STORAGE_KEY = "trip.telescope-upgrade.v1";

// ---------------------------------------------------------------------------
// 3D coordinate helpers
//
// The terrain polygons above are authored as percentages of the old painted
// 2D art (0–100 on each axis). The 3D scene reuses those exact numbers so a
// building that's legal under `placementIssue` always sits on real ground in
// the 3D view — one source of truth for where land, cliff and ocean are.
// ---------------------------------------------------------------------------

/** World units per percentage-point of the original 2D art. */
export const WORLD_SCALE = 0.22;
/** Height of the upper plateau above the lower island's snow surface. */
export const PLATEAU_HEIGHT = 2.4;
/** Thickness of the lower island slab above the ocean surface. */
export const ISLAND_HEIGHT = 1.5;

export const percentToWorldXZ = (pctX: number, pctY: number): { x: number; z: number } => ({
  x: (pctX - 50) * WORLD_SCALE,
  z: (pctY - 50) * WORLD_SCALE,
});

export const worldXZToPercent = (x: number, z: number): { x: number; y: number } => ({
  x: x / WORLD_SCALE + 50,
  y: z / WORLD_SCALE + 50,
});

export const tierBaseHeight = (tier: TownTier): number => {
  if (tier === "plateau") return ISLAND_HEIGHT + PLATEAU_HEIGHT;
  if (tier === "lower") return ISLAND_HEIGHT;
  return 0;
};

/** Center-of-footprint world position (feet on the ground) for a building at a grid position. */
export const buildingWorldPosition = (building: TownBuilding, position: GridPosition, rotation: Rotation = 0): { x: number; y: number; z: number } => {
  const footprint = rotatedFootprint(building, rotation);
  const centerColumn = position.column + footprint.width / 2;
  const centerRow = position.row + footprint.height / 2;
  const screenX = ISO_ORIGIN_X + (centerColumn - centerRow) * ISO_CELL_X;
  const screenY = ISO_ORIGIN_Y + (centerColumn + centerRow) * ISO_CELL_Y;
  const { x, z } = percentToWorldXZ(screenX, screenY);
  const y = tierBaseHeight(tierAt(Math.round(position.column), Math.round(position.row)));
  return { x, y, z };
};

/** Inverse of buildingWorldPosition's XZ math: a raycast hit on the ground -> the grid cell it should snap a building to. */
export const gridPositionFromWorld = (building: TownBuilding, worldX: number, worldZ: number, rotation: Rotation = 0): GridPosition => {
  const footprint = rotatedFootprint(building, rotation);
  const { x: screenX, y: screenY } = worldXZToPercent(worldX, worldZ);
  const deltaX = (screenX - ISO_ORIGIN_X) / ISO_CELL_X;
  const deltaY = (screenY - ISO_ORIGIN_Y) / ISO_CELL_Y;
  const centerColumn = (deltaY + deltaX) / 2;
  const centerRow = (deltaY - deltaX) / 2;
  return {
    column: Math.max(GRID_COLUMN_MIN, Math.min(GRID_COLUMN_MAX - footprint.width, Math.round(centerColumn - footprint.width / 2))),
    row: Math.max(GRID_ROW_MIN, Math.min(GRID_ROW_MAX - footprint.height, Math.round(centerRow - footprint.height / 2))),
  };
};
