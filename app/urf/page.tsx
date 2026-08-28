"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";

type Point = [number, number];

type PolygonGeometry = { type: "Polygon"; coordinates: Point[][] };
type LandFeature = {
  feature: { type: "Feature"; properties: null; geometry: PolygonGeometry };
  antarctic: boolean;
};

const wrapAngle = (value: number) => ((value + 540) % 360) - 180;

const continentMarkers: { name: string; center: Point }[] = [
  { name: "North America", center: [-105, 48] },
  { name: "South America", center: [-60, -17] },
  { name: "Europe", center: [15, 50] },
  { name: "Africa", center: [19, 4] },
  { name: "Asia", center: [86, 42] },
  { name: "Australia", center: [134, -25] },
];

function Globe({ onEnter }: { onEnter: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0, mode: "orbit" as "orbit" | "roll" });
  const [rotation, setRotation] = useState({ lon: 0, lat: -15, roll: 0 });
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 720, height: 720 });
  const [landFeatures, setLandFeatures] = useState<LandFeature[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/ne-110m-land.geojson", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { features: { geometry: PolygonGeometry }[] }) => {
        const features = data.features.map(({ geometry }) => {
          const outerRing = geometry.coordinates[0] ?? [];
          const averageLatitude = outerRing.reduce((sum, [, lat]) => sum + lat, 0) / Math.max(outerRing.length, 1);
          return {
            feature: { type: "Feature" as const, properties: null, geometry },
            antarctic: averageLatitude < -60,
          };
        });
        setLandFeatures(features);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load coastline data", error);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!frameRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setSize({ width, height: width });
    });
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

  const project = useCallback((point: Point) => {
    const [lon, lat] = point;
    const lambda = (lon - rotation.lon) * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    const tilt = rotation.lat * Math.PI / 180;
    const x = Math.cos(phi) * Math.sin(lambda);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(lambda);
    const cameraY = y * Math.cos(tilt) - z * Math.sin(tilt);
    const cameraZ = y * Math.sin(tilt) + z * Math.cos(tilt);
    const roll = rotation.roll * Math.PI / 180;
    const cameraX = x * Math.cos(roll) - cameraY * Math.sin(roll);
    const rolledY = x * Math.sin(roll) + cameraY * Math.cos(roll);
    const radius = size.width * 0.43 * zoom;
    return {
      x: Math.round((size.width / 2 + radius * cameraX) * 1000) / 1000,
      y: Math.round((size.height / 2 - radius * rolledY) * 1000) / 1000,
      visible: cameraZ > 0.03,
    };
  }, [rotation, size, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const radius = size.width * 0.43 * zoom;
    const cx = size.width / 2;
    const cy = size.height / 2;
    ctx.clearRect(0, 0, size.width, size.height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const ocean = ctx.createRadialGradient(cx - radius * 0.38, cy - radius * 0.42, radius * 0.08, cx, cy, radius);
    ocean.addColorStop(0, "#244665");
    ocean.addColorStop(0.62, "#0b243a");
    ocean.addColorStop(1, "#020b15");
    ctx.fillStyle = ocean;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    const projection = geoOrthographic()
      .translate([cx, cy])
      .scale(radius)
      .rotate([-rotation.lon, -rotation.lat, rotation.roll])
      .clipAngle(90)
      .precision(.25);
    const path = geoPath(projection, ctx);

    ctx.strokeStyle = "rgba(145, 181, 205, .12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    path(geoGraticule10());
    ctx.stroke();

    const drawLand = (antarctic: boolean) => {
      ctx.beginPath();
      landFeatures
        .filter((land) => land.antarctic === antarctic)
        .forEach((land) => path(land.feature));
      ctx.fillStyle = antarctic ? "#bfe8ee" : "#53606b";
      ctx.strokeStyle = antarctic ? "#e9ffff" : "#71818d";
      ctx.lineWidth = 1.15;
      ctx.fill("evenodd");
      ctx.stroke();
    };

    drawLand(false);
    drawLand(true);
    ctx.restore();

    const rim = ctx.createRadialGradient(cx, cy, radius * .82, cx, cy, radius * 1.08);
    rim.addColorStop(0, "rgba(92,202,255,0)");
    rim.addColorStop(.76, "rgba(92,202,255,0)");
    rim.addColorStop(.93, "rgba(92,202,255,.18)");
    rim.addColorStop(1, "rgba(92,202,255,0)");
    ctx.fillStyle = rim;
    ctx.fillRect(cx - radius * 1.1, cy - radius * 1.1, radius * 2.2, radius * 2.2);
  }, [landFeatures, rotation, size, zoom]);

  const markers = useMemo(() => continentMarkers.map((continent) => ({ ...continent, projected: project(continent.center) })), [project]);
  const south = project([0, -78]);

  const moveDrag = (x: number, y: number) => {
    if (!dragRef.current.active) return;
    const dx = x - dragRef.current.x;
    const dy = y - dragRef.current.y;
    const mode = dragRef.current.mode;
    dragRef.current = { active: true, x, y, mode };
    setRotation((value) => mode === "roll"
      ? { ...value, roll: wrapAngle(value.roll + (dx - dy) * .32) }
      : {
          ...value,
          lon: wrapAngle(value.lon - dx * .32),
          lat: wrapAngle(value.lat + dy * .32),
        });
  };

  return (
    <div className="globe-frame" ref={frameRef}>
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        aria-label="Rotatable globe. Drag in any direction for full 360 degree rotation, Shift-drag to roll, and scroll to zoom."
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            active: true,
            x: event.clientX,
            y: event.clientY,
            mode: event.shiftKey || event.button === 2 ? "roll" : "orbit",
          };
        }}
        onPointerMove={(event) => moveDrag(event.clientX, event.clientY)}
        onPointerUp={() => { dragRef.current.active = false; }}
        onPointerCancel={() => { dragRef.current.active = false; }}
        onLostPointerCapture={() => { dragRef.current.active = false; }}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((value) => Math.max(.72, Math.min(1.16, value - event.deltaY * .0008)));
        }}
      />
      {markers.map((marker) => (
        <div
          className="lock-marker"
          key={marker.name}
          style={{ left: `${marker.projected.x}px`, top: `${marker.projected.y}px`, opacity: marker.projected.visible ? "1" : "0" }}
          aria-hidden="true"
        >
          <span>🔒</span>
          <small>{marker.name}</small>
        </div>
      ))}
      <button
        type="button"
        className="antarctica-marker"
        style={{ left: `${south.x}px`, top: `${south.y}px`, opacity: south.visible ? "1" : "0", pointerEvents: south.visible ? "auto" : "none" }}
        onClick={onEnter}
        aria-label="Enter Antarctica"
      >
        <span className="marker-dot" />
        <span className="marker-copy"><b>ANTARCTICA</b><small>AVAILABLE</small></span>
      </button>
      <div className="globe-shadow" />
    </div>
  );
}

type TownBuilding = {
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
};

const GRID_COLUMN_MIN = -12;
const GRID_COLUMN_MAX = 47;
const GRID_ROW_MIN = -12;
const GRID_ROW_MAX = 47;
const GRID_COLUMNS = GRID_COLUMN_MAX - GRID_COLUMN_MIN;
const GRID_ROWS = GRID_ROW_MAX - GRID_ROW_MIN;
const ISO_ORIGIN_X = 50;
const ISO_ORIGIN_Y = 28.5;
const ISO_CELL_X = 2.65;
// This 2.94:1 percentage ratio renders as a roughly 2:1 isometric diamond
// inside the map's 2:3 portrait frame, matching the painted cliff edges.
const ISO_CELL_Y = 0.9;

type TerrainType = "land" | "ocean" | "cliff" | "blocked";
type PlaceableTerrain = Exclude<TerrainType, "blocked">;
type TerrainPoint = readonly [x: number, y: number];

type TerrainRegion = Readonly<{
  surface: readonly TerrainPoint[];
  bounds: readonly TerrainPoint[];
}>;

const BACKGROUND_OCEAN_EDGE: readonly TerrainPoint[] = [
  [0, 32], [15, 31.5], [30, 29.5], [45, 28], [60, 26.5], [75, 26], [90, 29], [100, 32],
];
// The editor controls occupy the foreground below this line on both desktop
// and the shorter mobile map, so those covered tiles are intentionally blocked.
const FOREGROUND_BUILD_LIMIT_Y = 84.5;

const TERRAIN_REGIONS = {
  upperPlateau: {
    surface: [[58.5, 33.5], [61, 30.5], [66, 28], [72, 29], [76, 32.5], [78, 36.5], [76, 39.5], [70, 39], [64, 36.5], [59, 36]],
    bounds: [[57, 34], [60, 29.5], [66, 27.5], [72.5, 28.5], [77.5, 32.5], [80, 39], [79, 44], [75, 46], [69, 42], [63, 39], [58, 38.5]],
  },
  lowerIsland: {
    surface: [[43, 36], [56, 34.5], [63, 36.5], [70, 38.5], [76, 40], [78, 43], [80, 50], [79, 56], [83, 61], [89, 65.5], [94, 69], [94, 73], [88, 75.5], [80, 79], [72, 86], [64, 86], [57, 83], [51, 79], [44, 78], [41, 75], [45, 70], [45, 67], [37, 68], [31, 66], [28, 63], [26, 59], [24, 54], [22, 51], [20, 47], [20, 43], [28, 40], [37, 38.5]],
    bounds: [[42, 36], [56, 33.5], [64, 36], [71, 38], [77, 39], [80, 42], [82, 50], [81, 57], [85, 62], [92, 66], [96, 70], [96, 74], [90, 78], [82, 81], [73, 88], [64, 89], [56, 85], [50, 82], [43, 81], [39, 78], [40, 73], [43, 69], [36, 71], [30, 69], [26, 66], [24, 62], [22, 57], [20, 53], [18, 49], [17, 45], [20, 41], [28, 39], [36, 37.5]],
  },
} as const satisfies Record<string, TerrainRegion>;

const buildings: TownBuilding[] = [
  { id: "plane", label: "PLANE", hint: "Flight deck · 3×2", terrain: "land", footprint: { width: 3, height: 2 }, sheet: { column: 0, row: 0 }, image: "/buildings/plane.png", start: { column: 3, row: 12 }, visualScale: 2.05 },
  { id: "telescope", label: "TELESCOPE", hint: "Observatory · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 1, row: 0 }, image: "/buildings/telescope-wood.png", upgradeImage: "/buildings/telescope-metal.png", start: { column: 3, row: -4 }, visualScale: 2.18 },
  { id: "magic", label: "CIRCUS", hint: "Questionable entertainment · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 0, row: 1 }, image: "/buildings/circus.png", start: { column: 15, row: 6 }, visualScale: 1.9 },
  { id: "igloo", label: "IGLOO", hint: "Housing · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 1, row: 1 }, image: "/buildings/igloo.png", start: { column: 28, row: 16 }, visualScale: 1.9 },
  { id: "sweatshop", label: "SWEATSHOP", hint: "Production · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 0, row: 2 }, image: "/buildings/sweatshop.png", start: { column: 14, row: 19 }, visualScale: 2.15 },
  { id: "docks", label: "DOCKS & CARGO", hint: "Ocean route · 3×2", terrain: "ocean", footprint: { width: 3, height: 2 }, sheet: { column: 1, row: 2 }, start: { column: 10, row: -6 }, visualScale: 2.3 },
  { id: "arena", label: "DOG-FIGHT ARENA", hint: "Fight club · 3×2", terrain: "land", footprint: { width: 3, height: 2 }, sheet: { column: 0, row: 3 }, image: "/buildings/dogfight-arena.png", start: { column: 31, row: 27 }, visualScale: 2.2 },
];

type TownDialogSubject = Pick<TownBuilding, "id" | "label">;
const flipperFlappington: TownDialogSubject = { id: "flipper", label: "FLIPPER FLAPPINGTON" };

type GridPosition = { column: number; row: number };
type TownLayout = Record<string, GridPosition & { stored: boolean }>;
type PlacementPreview = GridPosition & { id: string; valid: boolean };

const createDefaultTownLayout = (): TownLayout => Object.fromEntries(
  buildings.map((building) => [building.id, { ...building.start, stored: false }]),
);

const pointInPolygon = ([x, y]: TerrainPoint, polygon: readonly TerrainPoint[]): boolean => {
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

const terrainAt = (column: number, row: number): TerrainType => {
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

const terrainPlacementIssue = (terrain: PlaceableTerrain): string => {
  if (terrain === "ocean") return "THE CARGO BOAT NEEDS OPEN OCEAN";
  if (terrain === "cliff") return "THIS STRUCTURE NEEDS AN OPEN CLIFF TILE";
  return "LAND BUILDINGS NEED SOLID SNOW";
};

const terrainMoveInstruction = (terrain: PlaceableTerrain): string => {
  if (terrain === "ocean") return "MOVE OVER OPEN OCEAN · TAP TO PLACE";
  if (terrain === "cliff") return "MOVE OVER AN OPEN CLIFF TILE · TAP TO PLACE";
  return "MOVE OVER OPEN SNOW · TAP TO PLACE";
};

const terrainInventoryInstruction = (terrain: PlaceableTerrain): string => {
  if (terrain === "ocean") return "THE CARGO BOAT CAN ONLY USE OCEAN CELLS";
  if (terrain === "cliff") return "THIS STRUCTURE CAN ONLY USE CLIFF CELLS";
  return "LAND BUILDINGS REQUIRE OPEN SNOW CELLS";
};

const placementIssue = (building: TownBuilding, position: GridPosition, layout: TownLayout): string | null => {
  const cells: string[] = [];
  for (let row = position.row; row < position.row + building.footprint.height; row += 1) {
    for (let column = position.column; column < position.column + building.footprint.width; column += 1) {
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
    for (let row = placed.row; row < placed.row + other.footprint.height; row += 1) {
      for (let column = placed.column; column < placed.column + other.footprint.width; column += 1) {
        occupied.add(`${column}:${row}`);
      }
    }
  }
  return cells.some((cell) => occupied.has(cell)) ? "THAT SPACE IS OCCUPIED" : null;
};

const isCellAvailable = (building: TownBuilding, column: number, row: number, layout: TownLayout): boolean => {
  if (terrainAt(column, row) !== building.terrain) return false;
  return !buildings.some((other) => {
    if (other.id === building.id || layout[other.id]?.stored) return false;
    const placed = layout[other.id];
    if (!placed) return false;
    return column >= placed.column
      && column < placed.column + other.footprint.width
      && row >= placed.row
      && row < placed.row + other.footprint.height;
  });
};

const gridPositionFromPointer = (building: TownBuilding, clientX: number, clientY: number, map: DOMRect): GridPosition => {
  const screenX = ((clientX - map.left) / map.width) * 100;
  const screenY = ((clientY - map.top) / map.height) * 100;
  const deltaX = (screenX - ISO_ORIGIN_X) / ISO_CELL_X;
  const deltaY = (screenY - ISO_ORIGIN_Y) / ISO_CELL_Y;
  const centerColumn = (deltaY + deltaX) / 2;
  const centerRow = (deltaY - deltaX) / 2;
  return {
    column: Math.max(GRID_COLUMN_MIN, Math.min(GRID_COLUMN_MAX - building.footprint.width, Math.round(centerColumn - building.footprint.width / 2))),
    row: Math.max(GRID_ROW_MIN, Math.min(GRID_ROW_MAX - building.footprint.height, Math.round(centerRow - building.footprint.height / 2))),
  };
};

const buildingScreenPosition = (building: TownBuilding, position: GridPosition) => {
  const centerColumn = position.column + building.footprint.width / 2;
  const centerRow = position.row + building.footprint.height / 2;
  return {
    left: ISO_ORIGIN_X + (centerColumn - centerRow) * ISO_CELL_X,
    top: ISO_ORIGIN_Y + (centerColumn + centerRow) * ISO_CELL_Y,
    width: (building.footprint.width + building.footprint.height) * ISO_CELL_X,
    height: (building.footprint.width + building.footprint.height) * ISO_CELL_Y,
    depth: Math.round((centerColumn + centerRow) * 10),
  };
};

const isValidSavedTownLayout = (layout: TownLayout): boolean => buildings.every((building) => {
  const position = layout[building.id];
  if (!position || !Number.isInteger(position.column) || !Number.isInteger(position.row) || typeof position.stored !== "boolean") return false;
  return position.stored || placementIssue(building, position, layout) === null;
});

function BuildingSprite({ building, telescopeUpgraded = false }: { building: TownBuilding; telescopeUpgraded?: boolean }) {
  const { sheet } = building;
  const directImage = telescopeUpgraded && building.upgradeImage ? building.upgradeImage : building.image;
  if (directImage) {
    return (
      <span className="building-sprite is-direct" style={{ width: `${building.visualScale * 100}%` }} aria-hidden="true">
        <img src={directImage} alt="" draggable={false} />
      </span>
    );
  }
  if (building.id === "docks") {
    return (
      <span className="building-sprite ship-sprite" style={{ width: `${building.visualScale * 100}%` }} aria-hidden="true">
        <TransparentShipSprite />
      </span>
    );
  }
  return (
    <span className="building-sprite" style={{ width: `${building.visualScale * 100}%` }} aria-hidden="true">
      <img
        src="/penguin-building-sprites-alpha-v2.png"
        alt=""
        draggable={false}
        style={{
          width: "200%",
          height: "400%",
          left: `${-100 * sheet.column}%`,
          top: `${-100 * sheet.row}%`,
        }}
      />
    </span>
  );
}

function TransparentShipSprite() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.src = "/penguin-building-sprites-alpha-v2.png";
    image.onload = () => {
      const sourceX = image.naturalWidth / 2;
      const sourceY = image.naturalHeight / 2;
      const sourceWidth = image.naturalWidth / 2;
      const sourceHeight = image.naturalHeight / 4;
      canvas.width = Math.round(sourceWidth);
      canvas.height = Math.round(sourceHeight);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        const brightest = Math.max(red, green, blue);
        const darkest = Math.min(red, green, blue);
        if (darkest >= 235 && brightest - darkest <= 7) pixels.data[index + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
    };
  }, []);

  return <canvas ref={canvasRef} className="ship-sprite-canvas" />;
}

const RAT_MEAT_STORAGE_KEY = "trip.rat-meat.v1";
const RAT_MEAT_BALANCE_EVENT = "trip-rat-meat-balance-changed";
const TELESCOPE_UPGRADE_STORAGE_KEY = "trip.telescope-upgrade.v1";

function PenguinTown({ onBack }: { onBack: () => void }) {
  const [selectedBuilding, setSelectedBuilding] = useState<TownDialogSubject | null>(null);
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);
  const [placingBuildingId, setPlacingBuildingId] = useState<string | null>(null);
  const [placementPreview, setPlacementPreview] = useState<PlacementPreview | null>(null);
  const [editorMessage, setEditorMessage] = useState<string | null>(null);
  const [townLayout, setTownLayout] = useState<TownLayout>(createDefaultTownLayout);
  const [telescopeUpgraded, setTelescopeUpgraded] = useState(false);
  const [workersFed, setWorkersFed] = useState(false);
  const [rationError, setRationError] = useState(false);
  const [showDogFightGame, setShowDogFightGame] = useState(false);
  const dragRef = useRef<{ id: string; pointerId: number; map: DOMRect; preview: PlacementPreview } | null>(null);
  const isSweatshop = selectedBuilding?.id === "sweatshop";
  const isDogFighter = selectedBuilding?.id === "arena";
  const isFlipper = selectedBuilding?.id === "flipper";
  const activeBuilding = buildings.find((building) => building.id === activeBuildingId) ?? null;
  const placingBuilding = buildings.find((building) => building.id === placingBuildingId) ?? null;
  const movingBuilding = placementPreview ? buildings.find((building) => building.id === placementPreview.id) ?? null : null;
  const storedBuildings = buildings.filter((building) => townLayout[building.id]?.stored);
  const displayBuildingLabel = (building: TownBuilding) => building.id === "telescope" && telescopeUpgraded ? "METAL TELESCOPE" : building.label;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("trip.penguin-town-layout.v10");
      if (!saved) return;
      const parsed = JSON.parse(saved) as TownLayout;
      if (isValidSavedTownLayout(parsed)) setTownLayout(parsed);
    } catch {
      // Keep the safe default layout if an old local save is malformed.
    }
  }, []);

  useEffect(() => {
    try {
      setTelescopeUpgraded(window.localStorage.getItem(TELESCOPE_UPGRADE_STORAGE_KEY) === "metal");
    } catch {
      // Keep the wooden telescope when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("trip.penguin-town-layout.v10", JSON.stringify(townLayout));
    } catch {
      // The editor still works for this session when storage is unavailable.
    }
  }, [townLayout]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showDogFightGame) {
        setShowDogFightGame(false);
        return;
      }
      if (selectedBuilding) setSelectedBuilding(null);
      else if (placingBuildingId) {
        setPlacingBuildingId(null);
        setPlacementPreview(null);
        setEditorMessage(null);
      } else setActiveBuildingId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [placingBuildingId, selectedBuilding, showDogFightGame]);

  const beginBuildingDrag = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (placingBuildingId) return;
    event.stopPropagation();
    const map = event.currentTarget.closest(".town-map")?.getBoundingClientRect();
    const building = buildings.find((candidate) => candidate.id === id);
    const current = townLayout[id];
    if (!map || !building || !current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const preview = { id, column: current.column, row: current.row, valid: true };
    dragRef.current = { id, pointerId: event.pointerId, map, preview };
    setPlacementPreview(preview);
    setEditorMessage(null);
    setActiveBuildingId(id);
  };

  const continueBuildingDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const building = buildings.find((candidate) => candidate.id === drag.id);
    if (!building) return;
    const position = gridPositionFromPointer(building, event.clientX, event.clientY, drag.map);
    const issue = placementIssue(building, position, townLayout);
    const preview = { id: drag.id, ...position, valid: !issue };
    drag.preview = preview;
    setPlacementPreview(preview);
    setEditorMessage(issue);
  };

  const finishBuildingDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.preview.valid) {
      setTownLayout((current) => ({
        ...current,
        [drag.id]: { column: drag.preview.column, row: drag.preview.row, stored: false },
      }));
      setEditorMessage("PLACED ON GRID");
    }
    dragRef.current = null;
    setPlacementPreview(null);
  };

  const previewInventoryPlacement = (event: React.PointerEvent<HTMLElement>) => {
    if (!placingBuildingId) return;
    const building = buildings.find((candidate) => candidate.id === placingBuildingId);
    if (!building) return;
    const position = gridPositionFromPointer(building, event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    const issue = placementIssue(building, position, townLayout);
    setPlacementPreview({ id: building.id, ...position, valid: !issue });
    setEditorMessage(issue);
  };

  const placeFromInventory = (event: React.PointerEvent<HTMLElement>) => {
    if (!placingBuildingId) {
      if (event.target === event.currentTarget) setActiveBuildingId(null);
      return;
    }
    const building = buildings.find((candidate) => candidate.id === placingBuildingId);
    if (!building) return;
    const position = gridPositionFromPointer(building, event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    const issue = placementIssue(building, position, townLayout);
    if (issue) {
      setEditorMessage(issue);
      setPlacementPreview({ id: building.id, ...position, valid: false });
      return;
    }
    setTownLayout((current) => ({ ...current, [placingBuildingId]: { ...position, stored: false } }));
    setActiveBuildingId(placingBuildingId);
    setPlacingBuildingId(null);
    setPlacementPreview(null);
    setEditorMessage("PLACED ON GRID");
  };

  const visitBuilding = (building: TownBuilding) => {
    setSelectedBuilding(building);
    setActiveBuildingId(null);
    if (building.id === "sweatshop") {
      setWorkersFed(false);
      setRationError(false);
    }
  };

  const moveBuildingWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>, building: TownBuilding) => {
    const direction = {
      ArrowLeft: { column: -1, row: 0 },
      ArrowRight: { column: 1, row: 0 },
      ArrowUp: { column: 0, row: -1 },
      ArrowDown: { column: 0, row: 1 },
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    const current = townLayout[building.id];
    if (!current) return;
    const position = { column: current.column + direction.column, row: current.row + direction.row };
    const issue = placementIssue(building, position, townLayout);
    if (issue) {
      setEditorMessage(issue);
      return;
    }
    setTownLayout((layout) => ({ ...layout, [building.id]: { ...position, stored: false } }));
    setActiveBuildingId(building.id);
    setEditorMessage("MOVED ONE GRID CELL");
  };

  const feedWorkers = () => {
    try {
      const stored = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10);
      const balance = Number.isFinite(stored) ? Math.max(0, stored) : 0;

      if (balance < 1) {
        setRationError(true);
        return;
      }

      const nextBalance = balance - 1;
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(nextBalance));
      window.top?.postMessage(
        { type: RAT_MEAT_BALANCE_EVENT, balance: nextBalance },
        window.location.origin,
      );
      setWorkersFed(true);
      setRationError(false);
    } catch {
      setRationError(true);
    }
  };

  const upgradeTelescope = () => {
    try {
      const stored = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10);
      const balance = Number.isFinite(stored) ? Math.max(0, stored) : 0;
      if (balance < 69) {
        setEditorMessage(`NEED ${69 - balance} MORE CANS OF RAT MEAT`);
        return;
      }

      const nextBalance = balance - 69;
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(nextBalance));
      window.localStorage.setItem(TELESCOPE_UPGRADE_STORAGE_KEY, "metal");
      window.top?.postMessage(
        { type: RAT_MEAT_BALANCE_EVENT, balance: nextBalance },
        window.location.origin,
      );
      setTelescopeUpgraded(true);
      setEditorMessage("METAL TELESCOPE INSTALLED · 69 CANS SPENT");
    } catch {
      setEditorMessage("UPGRADE STORAGE UNAVAILABLE");
    }
  };

  return (
    <main className="town-screen">
      <section
        className={`town-map${placingBuildingId ? " is-placing" : ""}`}
        aria-label="Penguin Town base editor"
        onPointerDown={placeFromInventory}
        onPointerMove={previewInventoryPlacement}
      >
        <img className="town-art" src="/penguin-town-ground-v4.png" alt="A snowy Antarctic island with a broad lower snowfield, an elevated plateau, exposed cliff walls, and open ocean" draggable={false} />
        <div className="town-vignette" aria-hidden="true" />
        <header className="town-header" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onBack} aria-label="Return to world map">←</button>
          <div><small>FULL-TERRAIN ISOMETRIC GRID</small><h1>PENGUIN TOWN</h1></div>
        </header>
        <div className={`town-grid${placementPreview ? " is-active" : ""}`} aria-hidden="true">
          {Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
            const column = GRID_COLUMN_MIN + (index % GRID_COLUMNS);
            const row = GRID_ROW_MIN + Math.floor(index / GRID_COLUMNS);
            const terrain = terrainAt(column, row);
            if (terrain === "blocked") return null;
            const isCandidate = Boolean(placementPreview
              && column >= placementPreview.column
              && column < placementPreview.column + (movingBuilding?.footprint.width ?? 0)
              && row >= placementPreview.row
              && row < placementPreview.row + (movingBuilding?.footprint.height ?? 0));
            const cellState = movingBuilding ? (isCellAvailable(movingBuilding, column, row, townLayout) ? " is-placeable" : " is-blocked") : "";
            const candidateState = isCandidate ? (placementPreview?.valid ? " is-candidate-valid" : " is-candidate-invalid") : "";
            return (
              <span
                key={`${column}:${row}`}
                className={`terrain-${terrain}${cellState}${candidateState}`}
                data-terrain={terrain}
                style={{
                  left: `${ISO_ORIGIN_X + (column - row) * ISO_CELL_X - ISO_CELL_X}%`,
                  top: `${ISO_ORIGIN_Y + (column + row) * ISO_CELL_Y}%`,
                  width: `${ISO_CELL_X * 2}%`,
                  height: `${ISO_CELL_Y * 2}%`,
                }}
              />
            );
          })}
        </div>
        <div className="building-layer">
          {buildings.filter((building) => !townLayout[building.id]?.stored).map((building) => {
            const savedPosition = townLayout[building.id] ?? { ...building.start, stored: false };
            const position = placementPreview?.id === building.id ? placementPreview : savedPosition;
            const screen = buildingScreenPosition(building, position);
            const isInvalid = placementPreview?.id === building.id && !placementPreview.valid;
            return (
            <button
              type="button"
              key={building.id}
              className={`building-hotspot${activeBuildingId === building.id ? " is-selected" : ""}${placementPreview?.id === building.id ? " is-moving" : ""}${isInvalid ? " is-invalid" : ""}`}
              data-building={building.id}
              style={{
                left: `${screen.left}%`,
                top: `${screen.top}%`,
                width: `${screen.width}%`,
                height: `${screen.height}%`,
                zIndex: placementPreview?.id === building.id ? 900 : screen.depth,
              }}
              onPointerDown={(event) => beginBuildingDrag(event, building.id)}
              onPointerMove={continueBuildingDrag}
              onPointerUp={finishBuildingDrag}
              onPointerCancel={finishBuildingDrag}
              onKeyDown={(event) => moveBuildingWithKeyboard(event, building)}
              aria-label={`Select and move ${building.label}`}
              aria-pressed={activeBuildingId === building.id}
            >
              <BuildingSprite building={building} telescopeUpgraded={telescopeUpgraded} />
              <span className="building-label"><b>{displayBuildingLabel(building)}</b><small>{building.hint}</small></span>
            </button>
          );})}
          {placingBuilding && placementPreview && townLayout[placingBuilding.id]?.stored && (
            (() => {
              const screen = buildingScreenPosition(placingBuilding, placementPreview);
              return <div
              className={`building-hotspot placement-ghost${placementPreview.valid ? " is-valid" : " is-invalid"}`}
              data-building={placingBuilding.id}
              style={{
                left: `${screen.left}%`,
                top: `${screen.top}%`,
                width: `${screen.width}%`,
                height: `${screen.height}%`,
                zIndex: 900,
              }}
            >
              <BuildingSprite building={placingBuilding} telescopeUpgraded={telescopeUpgraded} />
            </div>;
            })()
          )}
        </div>

        {activeBuilding && !townLayout[activeBuilding.id]?.stored && (
          <aside className="town-editor-card" aria-label={`${activeBuilding.label} controls`} onPointerDown={(event) => event.stopPropagation()}>
            <div><small>SELECTED</small><b>{displayBuildingLabel(activeBuilding)}</b></div>
            {activeBuilding.id === "telescope" && !telescopeUpgraded && (
              <button type="button" className="upgrade-building" onClick={upgradeTelescope}>UPGRADE · 69</button>
            )}
            <button type="button" onClick={() => visitBuilding(activeBuilding)}>ENTER</button>
            <button type="button" className="remove-building" onClick={() => {
              setTownLayout((current) => ({ ...current, [activeBuilding.id]: { ...current[activeBuilding.id], stored: true } }));
              setActiveBuildingId(null);
              setPlacementPreview(null);
              setEditorMessage(`${activeBuilding.label} MOVED TO INVENTORY`);
            }}>REMOVE</button>
          </aside>
        )}

        {(placingBuildingId || editorMessage) && (
          <div className={`placement-hint${activeBuilding ? " with-editor" : ""}${placementPreview && !placementPreview.valid ? " is-error" : ""}`} aria-live="polite">
            {editorMessage ?? (placingBuilding ? terrainMoveInstruction(placingBuilding.terrain) : "SELECT A BUILDING TO MOVE")}
          </div>
        )}

        <nav className="town-inventory" aria-label="Building inventory" onPointerDown={(event) => event.stopPropagation()}>
          <div className="inventory-title"><span>BUILD</span><small>{storedBuildings.length ? `${storedBuildings.length} STORED` : "INVENTORY EMPTY"}</small></div>
          <div className="inventory-items">
            <button
              type="button"
              className="inventory-character"
              onClick={() => {
                setSelectedBuilding(flipperFlappington);
                setActiveBuildingId(null);
                setPlacementPreview(null);
              }}
              aria-label="Talk to Flipper Flappington"
            >
              <img src="/evil-penguin.jpg" alt="Flipper Flappington" />
              <span>FLIPPER</span>
            </button>
            {storedBuildings.map((building) => (
              <button
                type="button"
                key={building.id}
                className={placingBuildingId === building.id ? "is-active" : ""}
                onClick={() => {
                  setPlacingBuildingId(building.id);
                  setActiveBuildingId(null);
                  const position = townLayout[building.id] ?? building.start;
                  setPlacementPreview({ id: building.id, column: position.column, row: position.row, valid: !placementIssue(building, position, townLayout) });
                  setEditorMessage(terrainInventoryInstruction(building.terrain));
                }}
                aria-label={`Place ${building.label}`}
              >
                <BuildingSprite building={building} telescopeUpgraded={telescopeUpgraded} />
                <span>{displayBuildingLabel(building)}</span>
              </button>
            ))}
            {!storedBuildings.length && <p>Select a building, then choose <b>Remove</b> to store it here.</p>}
          </div>
        </nav>
      </section>

      {selectedBuilding && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedBuilding(null);
        }}>
          <section className={`penguin-dialog${isSweatshop ? " sweatshop-dialog" : ""}${isDogFighter ? " dog-fighter-dialog" : ""}${isFlipper ? " flipper-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="dialog-close" type="button" onClick={() => setSelectedBuilding(null)} aria-label="Close dialogue">×</button>
            <div className="dialog-character">
              <span className="bad-tape" aria-hidden="true" />
              <img
                src={isSweatshop ? "/penguinaroo.png" : isDogFighter ? "/vicheal-nic.jpg" : "/evil-penguin.jpg"}
                alt={isSweatshop ? "Penguinaroo wearing a rice-field hat, squinting, with buckteeth" : isDogFighter ? "Vicheal Nic holding a dog" : isFlipper ? "Flipper Flappington" : "The poorly drawn evil penguin"}
              />
              <div className="character-tag">
                <small>{isSweatshop ? "SWEATSHOP OWNER" : isDogFighter ? "DOG-FIGHTER" : isFlipper ? "TUTORIAL GUIDE" : "LOCAL RESIDENT"}</small>
                <b>{isSweatshop ? "PENGUINAROO" : isDogFighter ? "Vicheal Nic" : isFlipper ? "FLIPPER FLAPPINGTON" : "PEN-GUIN"}</b>
              </div>
            </div>
            <div className="speech-panel">
              <div className="speech-meta">
                <span>{isSweatshop ? "MANAGEMENT MESSAGE" : isDogFighter ? "FIGHTER MESSAGE" : isFlipper ? "TUTORIAL MESSAGE" : "UNFINISHED LOCATION"}</span>
                <b>{selectedBuilding.label}</b>
              </div>
              {isSweatshop ? (
                <>
                  <h2 id="dialog-title">Shift briefing.</h2>
                  <p>&ldquo;a starving worker is a slow worker&rdquo;</p>
                  <div className="worker-ration">
                    <div className={`rat-meat-can${workersFed ? " rat-meat-can-fed" : ""}`} aria-label="A can of Rat Meat">
                      <small>GENUINE</small>
                      <b>RAT<br />MEAT</b>
                      <span>WORKER RATION</span>
                    </div>
                    <button type="button" onClick={feedWorkers} disabled={workersFed}>
                      {workersFed ? "WORKERS FED" : "FEED THE WORKERS"} <span>→</span>
                    </button>
                  </div>
                  <div className="ration-status" role="status" aria-live="polite">
                    {workersFed
                      ? "RATION DISTRIBUTED · PRODUCTIVITY RESTORED"
                      : rationError
                        ? "NOT ENOUGH RAT MEAT · WIN A DOG-FIGHT ROUND"
                        : "1 CAN · SERVES ENTIRE SHIFT"}
                  </div>
                </>
              ) : isDogFighter ? (
                <>
                  <h2 id="dialog-title">Pre-fight wisdom.</h2>
                  <p>&ldquo;you can take the nigga out of the hood, but you can&apos;t take the hood out of the nigga&rdquo;</p>
                  <button type="button" onClick={() => {
                    setSelectedBuilding(null);
                    setShowDogFightGame(true);
                  }}>FIGHT ! <span>→</span></button>
                </>
              ) : isFlipper ? (
                <>
                  <h2 id="dialog-title">Flipper Flappington.</h2>
                  <p>&ldquo;Suck my penguin cock&rdquo;</p>
                  <button type="button" onClick={() => setSelectedBuilding(null)}>BACK TO TOWN <span>→</span></button>
                </>
              ) : (
                <>
                  <h2 id="dialog-title">Listen, pal.</h2>
                  <p>i haven&apos;t fucking got to this part yet, do you know how hard it is to try and convince ai to make a dog fighting video game</p>
                  <button type="button" onClick={() => setSelectedBuilding(null)}>FAIR ENOUGH <span>→</span></button>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {showDogFightGame && (
        <section className="dog-game-overlay" role="dialog" aria-modal="true" aria-labelledby="dog-game-title">
          <header className="dog-game-header">
            <div><small>DOG-FIGHT ARENA</small><b id="dog-game-title">K9 KO!</b></div>
            <button type="button" onClick={() => setShowDogFightGame(false)} aria-label="Return to Penguin Town">×</button>
          </header>
          <iframe
            className="dog-game-frame"
            src="/dog-fighting/index.html"
            title="K9 KO dog-fighting mini-game"
            allow="autoplay"
          />
        </section>
      )}
    </main>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<"world" | "town">("world");

  const closeSelector = () => {
    if (window.parent !== window) {
      window.parent.postMessage("trip-close-urf", window.location.origin);
      return;
    }
    window.location.href = "/";
  };

  if (screen === "town") {
    return <PenguinTown onBack={() => setScreen("world")} />;
  }

  return (
    <main className="world-screen">
      <div className="stars" aria-hidden="true" />
      <header className="world-header">
        <div className="eyebrow"><span /> WORLD SELECT</div>
        <h1>Go anywhere</h1>
        <p>as Long as it&apos;s Antarctica</p>
      </header>
      <button className="quit-button" type="button" aria-label="Exit world selection" onClick={closeSelector}>×</button>
      <section className="globe-stage" aria-label="World map">
        <Globe onEnter={() => setScreen("town")} />
      </section>
      <footer className="world-footer">
        <div className="control-hint"><span>↔</span><p><b>DRAG</b><small>360° ROTATE · SHIFT TO ROLL</small></p></div>
        <div className="control-hint"><span>＋</span><p><b>SCROLL</b><small>ZOOM</small></p></div>
        <div className="status-pill"><i /> 1 / 7 TERRITORIES UNLOCKED</div>
      </footer>
    </main>
  );
}
