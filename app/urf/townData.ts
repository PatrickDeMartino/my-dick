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
  [0, 32], [15, 31.5], [30, 29.5], [45, 28], [60, 26.5], [75, 26], [90, 29], [100, 32],
];
// The editor controls occupy the foreground below this line on both desktop
// and the shorter mobile map, so those covered tiles are intentionally blocked.
export const FOREGROUND_BUILD_LIMIT_Y = 84.5;

export const TERRAIN_REGIONS = {
  upperPlateau: {
    surface: [[58.5, 33.5], [61, 30.5], [66, 28], [72, 29], [76, 32.5], [78, 36.5], [76, 39.5], [70, 39], [64, 36.5], [59, 36]],
    bounds: [[57, 34], [60, 29.5], [66, 27.5], [72.5, 28.5], [77.5, 32.5], [80, 39], [79, 44], [75, 46], [69, 42], [63, 39], [58, 38.5]],
  },
  lowerIsland: {
    surface: [[43, 36], [56, 34.5], [63, 36.5], [70, 38.5], [76, 40], [78, 43], [80, 50], [79, 56], [83, 61], [89, 65.5], [94, 69], [94, 73], [88, 75.5], [80, 79], [72, 86], [64, 86], [57, 83], [51, 79], [44, 78], [41, 75], [45, 70], [45, 67], [37, 68], [31, 66], [28, 63], [26, 59], [24, 54], [22, 51], [20, 47], [20, 43], [28, 40], [37, 38.5]],
    bounds: [[42, 36], [56, 33.5], [64, 36], [71, 38], [77, 39], [80, 42], [82, 50], [81, 57], [85, 62], [92, 66], [96, 70], [96, 74], [90, 78], [82, 81], [73, 88], [64, 89], [56, 85], [50, 82], [43, 81], [39, 78], [40, 73], [43, 69], [36, 71], [30, 69], [26, 66], [24, 62], [22, 57], [20, 53], [18, 49], [17, 45], [20, 41], [28, 39], [36, 37.5]],
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
  plane: { character: "/evil-penguin.jpg", name: "CAPTAIN FLAPS", role: "BUSH PILOT", description: "A ski-plane with more optimism than fuel." },
  telescope: { character: "/media/alien-astronomer-v1.png", name: "ZORB", role: "VISITING ASTRONOMER", description: "aliens... for sure" },
  magic: { character: "/evil-penguin.jpg", name: "RINGMASTER WADDLES", role: "EXOTIC ANIMAL DEALER", description: "Questionable creatures. Surprisingly reasonable prices." },
  igloo: { character: "/media/dr-bongo-model-icon-v1.png", name: "DR. BONGO", role: "DRONE SALESMAN", description: "A warm igloo, a cold lab, and one deeply ambitious ape." },
  sweatshop: { character: "/penguinaroo.png", name: "PENGUINAROO", role: "SWEATSHOP OWNER", description: "Production never sleeps. The workers would like to." },
  docks: { character: "/media/lab-rat-v1.png", name: "CAPTAIN SQUEAK", role: "RAT FARMER", description: "The cargo route is moving. The rats are multiplying." },
  arena: { character: "/vicheal-nic.jpg", name: "VICHEAL NIC", role: "DOG-FIGHTER", description: "A frozen arena for extremely questionable athletics." },
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
  const clampedX = Math.max(0, Math.min(100, screenX));
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
  if (screenX < 0 || screenX > 100 || screenY < backgroundOceanEdgeAt(screenX) || screenY > FOREGROUND_BUILD_LIMIT_Y) return "blocked";
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
