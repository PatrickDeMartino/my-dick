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
  terrain: "land" | "ocean";
  footprint: { width: number; height: number };
  sheet: { column: number; row: number };
  image?: string;
  upgradeImage?: string;
  start: { column: number; row: number };
  visualScale: number;
};

const GRID_COLUMNS = 16;
const GRID_ROWS = 18;
const ISO_ORIGIN_X = 50;
const ISO_ORIGIN_Y = 28.5;
const ISO_CELL_X = 2.65;
const ISO_CELL_Y = 1.85;

const buildings: TownBuilding[] = [
  { id: "plane", label: "PLANE", hint: "Flight deck · 3×2", terrain: "land", footprint: { width: 3, height: 2 }, sheet: { column: 0, row: 0 }, image: "/buildings/plane.png", start: { column: 3, row: 5 }, visualScale: 2.05 },
  { id: "telescope", label: "TELESCOPE", hint: "Observatory · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 1, row: 0 }, image: "/buildings/telescope-wood.png", upgradeImage: "/buildings/telescope-metal.png", start: { column: 9, row: 3 }, visualScale: 2.18 },
  { id: "magic", label: "CIRCUS", hint: "Questionable entertainment · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 0, row: 1 }, image: "/buildings/circus.png", start: { column: 11, row: 5 }, visualScale: 1.9 },
  { id: "igloo", label: "IGLOO", hint: "Housing · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 1, row: 1 }, image: "/buildings/igloo.png", start: { column: 4, row: 8 }, visualScale: 1.9 },
  { id: "sweatshop", label: "SWEATSHOP", hint: "Production · 2×2", terrain: "land", footprint: { width: 2, height: 2 }, sheet: { column: 0, row: 2 }, image: "/buildings/sweatshop.png", start: { column: 14, row: 8 }, visualScale: 2.15 },
  { id: "docks", label: "DOCKS & CARGO", hint: "Ocean route · 3×2", terrain: "ocean", footprint: { width: 3, height: 2 }, sheet: { column: 1, row: 2 }, start: { column: 1, row: 15 }, visualScale: 2.3 },
  { id: "arena", label: "DOG-FIGHT ARENA", hint: "Fight club · 3×2", terrain: "land", footprint: { width: 3, height: 2 }, sheet: { column: 0, row: 3 }, image: "/buildings/dogfight-arena.png", start: { column: 5, row: 11 }, visualScale: 2.2 },
];

type GridPosition = { column: number; row: number };
type TownLayout = Record<string, GridPosition & { stored: boolean }>;
type PlacementPreview = GridPosition & { id: string; valid: boolean };

const createDefaultTownLayout = (): TownLayout => Object.fromEntries(
  buildings.map((building) => [building.id, { ...building.start, stored: false }]),
);

const terrainAt = (column: number, row: number): "land" | "ocean" | "blocked" => {
  const screenX = ISO_ORIGIN_X + (column - row) * ISO_CELL_X;
  const screenY = ISO_ORIGIN_Y + (column + row + 1) * ISO_CELL_Y;
  if (screenY < 35) return "blocked";

  const landRange = screenY < 44
    ? [41, 79]
    : screenY < 58
      ? [22, 84]
      : screenY < 72
        ? [20, 95]
        : [35, 94];
  return screenX >= landRange[0] && screenX <= landRange[1] ? "land" : "ocean";
};

const placementIssue = (building: TownBuilding, position: GridPosition, layout: TownLayout): string | null => {
  const cells: string[] = [];
  for (let row = position.row; row < position.row + building.footprint.height; row += 1) {
    for (let column = position.column; column < position.column + building.footprint.width; column += 1) {
      if (column < 0 || row < 0 || column >= GRID_COLUMNS || row >= GRID_ROWS) return "OUTSIDE THE BUILD GRID";
      if (terrainAt(column, row) !== building.terrain) {
        return building.terrain === "ocean" ? "THE CARGO BOAT NEEDS OPEN OCEAN" : "LAND BUILDINGS NEED SOLID SNOW";
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
    column: Math.max(0, Math.min(GRID_COLUMNS - building.footprint.width, Math.round(centerColumn - building.footprint.width / 2))),
    row: Math.max(0, Math.min(GRID_ROWS - building.footprint.height, Math.round(centerRow - building.footprint.height / 2))),
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

const RAT_MEAT_STORAGE_KEY = "trip.rat-meat.v1";
const RAT_MEAT_BALANCE_EVENT = "trip-rat-meat-balance-changed";
const TELESCOPE_UPGRADE_STORAGE_KEY = "trip.telescope-upgrade.v1";

function PenguinTown({ onBack }: { onBack: () => void }) {
  const [selectedBuilding, setSelectedBuilding] = useState<TownBuilding | null>(null);
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
  const activeBuilding = buildings.find((building) => building.id === activeBuildingId) ?? null;
  const placingBuilding = buildings.find((building) => building.id === placingBuildingId) ?? null;
  const movingBuilding = placementPreview ? buildings.find((building) => building.id === placementPreview.id) ?? null : null;
  const storedBuildings = buildings.filter((building) => townLayout[building.id]?.stored);
  const displayBuildingLabel = (building: TownBuilding) => building.id === "telescope" && telescopeUpgraded ? "METAL TELESCOPE" : building.label;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("trip.penguin-town-layout.v7");
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
      window.localStorage.setItem("trip.penguin-town-layout.v7", JSON.stringify(townLayout));
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
        <img className="town-art" src="/penguin-town-ground-v4.png" alt="A snowy Antarctic island with an expanded southeastern building shelf surrounded by open ocean" draggable={false} />
        <div className="town-vignette" aria-hidden="true" />
        <header className="town-header" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onBack} aria-label="Return to world map">←</button>
          <div><small>16 × 18 ISOMETRIC GRID</small><h1>PENGUIN TOWN</h1></div>
          <span className="town-edit-status"><i /> SNAP MODE</span>
        </header>
        <div className="town-guide" aria-label="Tutorial guide">
          <div className="guide-portrait"><img src="/evil-penguin.jpg" alt="Poorly drawn evil penguin tutorial guide" /></div>
          <div className="guide-copy"><small>FLIPPER FLAPPINGTON · DEFINITELY EVIL</small><p>Suck my penguin cock</p></div>
        </div>
        <div className={`town-grid${placementPreview ? " is-active" : ""}`} aria-hidden="true">
          {Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
            const column = index % GRID_COLUMNS;
            const row = Math.floor(index / GRID_COLUMNS);
            const isCandidate = Boolean(placementPreview
              && column >= placementPreview.column
              && column < placementPreview.column + (movingBuilding?.footprint.width ?? 0)
              && row >= placementPreview.row
              && row < placementPreview.row + (movingBuilding?.footprint.height ?? 0));
            const cellState = movingBuilding ? (isCellAvailable(movingBuilding, column, row, townLayout) ? " is-placeable" : " is-blocked") : "";
            const candidateState = isCandidate ? (placementPreview?.valid ? " is-candidate-valid" : " is-candidate-invalid") : "";
            return (
              <span
                key={index}
                className={`terrain-${terrainAt(column, row)}${cellState}${candidateState}`}
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
            {editorMessage ?? (placingBuilding?.terrain === "ocean" ? "MOVE OVER OPEN OCEAN · TAP TO PLACE" : "MOVE OVER OPEN SNOW · TAP TO PLACE")}
          </div>
        )}

        <nav className="town-inventory" aria-label="Building inventory" onPointerDown={(event) => event.stopPropagation()}>
          <div className="inventory-title"><span>BUILD</span><small>{storedBuildings.length ? `${storedBuildings.length} STORED` : "INVENTORY EMPTY"}</small></div>
          <div className="inventory-items">
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
                  setEditorMessage(building.terrain === "ocean" ? "THE CARGO BOAT CAN ONLY USE OCEAN CELLS" : "LAND BUILDINGS REQUIRE OPEN SNOW CELLS");
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
          <section className={`penguin-dialog${isSweatshop ? " sweatshop-dialog" : ""}${isDogFighter ? " dog-fighter-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="dialog-close" type="button" onClick={() => setSelectedBuilding(null)} aria-label="Close dialogue">×</button>
            <div className="dialog-character">
              <span className="bad-tape" aria-hidden="true" />
              <img
                src={isSweatshop ? "/penguinaroo.png" : isDogFighter ? "/vicheal-nic.jpg" : "/evil-penguin.jpg"}
                alt={isSweatshop ? "Penguinaroo wearing a rice-field hat, squinting, with buckteeth" : isDogFighter ? "Vicheal Nic holding a dog" : "The poorly drawn evil penguin"}
              />
              <div className="character-tag">
                <small>{isSweatshop ? "SWEATSHOP OWNER" : isDogFighter ? "DOG-FIGHTER" : "TUTORIAL GUIDE"}</small>
                <b>{isSweatshop ? "PENGUINAROO" : isDogFighter ? "Vicheal Nic" : "PEN-GUIN"}</b>
              </div>
            </div>
            <div className="speech-panel">
              <div className="speech-meta">
                <span>{isSweatshop ? "MANAGEMENT MESSAGE" : isDogFighter ? "FIGHTER MESSAGE" : "UNFINISHED LOCATION"}</span>
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
