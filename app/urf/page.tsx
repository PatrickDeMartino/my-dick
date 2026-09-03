"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import PenguinTownScene3D from "./PenguinTownScene3D";
import {
  BUILDING_STORIES,
  CIRCUS_STOCK,
  RAT_MEAT_BALANCE_EVENT,
  RAT_MEAT_STORAGE_KEY,
  TELESCOPE_UPGRADE_STORAGE_KEY,
  buildings,
  createDefaultTownLayout,
  flipperFlappington,
  isValidSavedTownLayout,
  placementIssue,
  terrainInventoryInstruction,
  type GridPosition,
  type PlacementPreview,
  type TownBuilding,
  type TownDialogSubject,
  type TownLayout,
} from "./townData";

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
  const [texture, setTexture] = useState<HTMLImageElement | null>(null);
  const [textureDrift, setTextureDrift] = useState(0);

  useEffect(() => {
    const image = new Image();
    image.src = "/media/psychedelic-earth-texture-v1.png";
    image.onload = () => setTexture(image);
    const timer = window.setInterval(() => setTextureDrift((value) => (value + 1) % 360), 140);
    return () => window.clearInterval(timer);
  }, []);

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
    if (texture) {
      const oceanPattern = ctx.createPattern(texture, "repeat");
      if (oceanPattern) {
        const textureScale = Math.max(.13, radius / 1100);
        oceanPattern.setTransform(new DOMMatrix().translate(cx - radius + textureDrift * .55, cy - radius + Math.sin(textureDrift * .03) * 18).scale(textureScale));
        ctx.globalAlpha = .86;
        ctx.fillStyle = oceanPattern;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.globalAlpha = 1;
      }
    }
    const oceanShade = ctx.createRadialGradient(cx - radius * .3, cy - radius * .36, radius * .12, cx, cy, radius);
    oceanShade.addColorStop(0, "rgba(125,245,255,.08)");
    oceanShade.addColorStop(.68, "rgba(2,12,31,.08)");
    oceanShade.addColorStop(1, "rgba(0,4,17,.72)");
    ctx.fillStyle = oceanShade;
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
      const landGradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      landGradient.addColorStop(0, "#f1c86e");
      landGradient.addColorStop(.34, "#74aa62");
      landGradient.addColorStop(.7, "#36776a");
      landGradient.addColorStop(1, "#183f43");
      ctx.fillStyle = antarctic ? "#c8eef1" : landGradient;
      ctx.strokeStyle = antarctic ? "#f1ffff" : "rgba(255,239,170,.72)";
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
  }, [landFeatures, rotation, size, texture, textureDrift, zoom]);

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
      <div className="globe-satellite-orbit" aria-hidden="true"><span>🛰️</span></div>
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
  const [purchases, setPurchases] = useState<string[]>([]);
  const [farmCooldown, setFarmCooldown] = useState(0);
  const isSweatshop = selectedBuilding?.id === "sweatshop";
  const isDogFighter = selectedBuilding?.id === "arena";
  const isFlipper = selectedBuilding?.id === "flipper";
  const isTelescope = selectedBuilding?.id === "telescope";
  const isCircus = selectedBuilding?.id === "magic";
  const isIgloo = selectedBuilding?.id === "igloo";
  const isDocks = selectedBuilding?.id === "docks";
  const activeBuilding = buildings.find((building) => building.id === activeBuildingId) ?? null;
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
    try { setPurchases(JSON.parse(window.localStorage.getItem("trip.town-purchases.v1") ?? "[]") as string[]); } catch { /* start empty */ }
  }, []);

  useEffect(() => {
    if (farmCooldown <= 0) return;
    const timer = window.setTimeout(() => setFarmCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [farmCooldown]);

  useEffect(() => {
    const boat = buildings.find((building) => building.id === "docks");
    if (!boat) return;
    const timer = window.setInterval(() => {
      if (placingBuildingId === "docks" || activeBuildingId === "docks" || selectedBuilding?.id === "docks") return;
      setTownLayout((current) => {
        const position = current.docks;
        if (!position || position.stored) return current;
        const directions = [{ column: 1, row: 0 }, { column: 0, row: 1 }, { column: -1, row: 0 }, { column: 0, row: -1 }];
        const start = Math.floor(Date.now() / 10000) % directions.length;
        for (let offset = 0; offset < directions.length; offset += 1) {
          const direction = directions[(start + offset) % directions.length];
          const next = { column: position.column + direction.column, row: position.row + direction.row };
          if (!placementIssue(boat, next, current)) return { ...current, docks: { ...next, stored: false } };
        }
        return current;
      });
    }, 10000);
    return () => window.clearInterval(timer);
  }, [activeBuildingId, selectedBuilding, placingBuildingId]);

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

  // Building placement in the 3D scene works in two steps: arm it (from the
  // inventory list, or the "MOVE" button on an already-placed building),
  // then PenguinTownScene3D drives the live preview via these callbacks as
  // the player orbits/taps around the island and reports what happened.
  const startPlacing = (id: string) => {
    const building = buildings.find((candidate) => candidate.id === id);
    const position = townLayout[id] ?? building?.start;
    setPlacingBuildingId(id);
    setActiveBuildingId(null);
    if (building && position) {
      setPlacementPreview({ id, column: position.column, row: position.row, valid: !placementIssue(building, position, townLayout) });
      setEditorMessage(terrainInventoryInstruction(building.terrain));
    }
  };

  const handleSelectBuilding = (id: string) => {
    if (placingBuildingId) return;
    setActiveBuildingId(id);
  };

  const handlePlacementPreview = (preview: PlacementPreview | null) => {
    setPlacementPreview(preview);
  };

  const handlePlacementMessage = (message: string | null) => {
    setEditorMessage(message);
  };

  const handleCommitPlacement = (id: string, position: GridPosition) => {
    setTownLayout((current) => ({ ...current, [id]: { ...position, stored: false } }));
    setActiveBuildingId(id);
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

  const spendRatMeat = (item: string, cost: number) => {
    try {
      const balance = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10) || 0;
      if (balance < cost) { setEditorMessage(`NEED ${cost - balance} MORE CANS OF RAT MEAT`); return; }
      const next = balance - cost;
      const nextPurchases = [...new Set([...purchases, item])];
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(next));
      window.localStorage.setItem("trip.town-purchases.v1", JSON.stringify(nextPurchases));
      window.top?.postMessage({ type: RAT_MEAT_BALANCE_EVENT, balance: next }, window.location.origin);
      setPurchases(nextPurchases);
      setEditorMessage(`${item.toUpperCase()} ACQUIRED · ${cost} RAT MEAT SPENT`);
    } catch { setEditorMessage("SHOP STORAGE UNAVAILABLE"); }
  };

  const farmRats = () => {
    if (farmCooldown) return;
    try {
      const balance = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10) || 0;
      const next = balance + 3;
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(next));
      window.top?.postMessage({ type: RAT_MEAT_BALANCE_EVENT, balance: next }, window.location.origin);
      setFarmCooldown(5);
      setEditorMessage("RATS FARMED · +3 RAT MEAT");
    } catch { setEditorMessage("RAT FARM OFFLINE"); }
  };

  return (
    <main className="town-screen">
      <section
        className={`town-map${placingBuildingId ? " is-placing" : ""}`}
        aria-label="Penguin Town base editor"
      >
        <PenguinTownScene3D
          townLayout={townLayout}
          telescopeUpgraded={telescopeUpgraded}
          activeBuildingId={activeBuildingId}
          placingBuildingId={placingBuildingId}
          onSelectBuilding={handleSelectBuilding}
          onPlacementPreview={handlePlacementPreview}
          onCommitPlacement={handleCommitPlacement}
          onPlacementMessage={handlePlacementMessage}
        />
        <div className="town-vignette" aria-hidden="true" />
        <header className="town-header" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onBack} aria-label="Return to world map">←</button>
          <div><small>FULL 3D ISLAND · ORBIT WITH DRAG</small><h1>PENGUIN TOWN</h1></div>
        </header>

        {activeBuilding && !townLayout[activeBuilding.id]?.stored && (
          <aside className="town-selection-card" aria-live="polite" aria-label={`${activeBuilding.label} controls`} onPointerDown={(event) => event.stopPropagation()}>
            <div className="town-selection-character"><img src={BUILDING_STORIES[activeBuilding.id].character} alt="" /></div>
            <div className="town-selection-copy">
              <div className="town-selection-kicker"><small>{BUILDING_STORIES[activeBuilding.id].role}</small><span>SELECTED · {displayBuildingLabel(activeBuilding)}</span></div>
              <b>{BUILDING_STORIES[activeBuilding.id].name}</b>
              <p>{BUILDING_STORIES[activeBuilding.id].description}</p>
            </div>
            <div className="town-selection-actions">
              {activeBuilding.id === "telescope" && !telescopeUpgraded && (
                <button type="button" className="upgrade-building" onClick={upgradeTelescope}>UPGRADE · 69</button>
              )}
              <button type="button" onClick={() => visitBuilding(activeBuilding)}>ENTER</button>
              <button type="button" onClick={() => startPlacing(activeBuilding.id)}>MOVE</button>
              <button type="button" className="remove-building" onClick={() => {
                setTownLayout((current) => ({ ...current, [activeBuilding.id]: { ...current[activeBuilding.id], stored: true } }));
                setActiveBuildingId(null);
                setPlacementPreview(null);
                setEditorMessage(`${activeBuilding.label} MOVED TO INVENTORY`);
              }}>REMOVE</button>
            </div>
          </aside>
        )}

        {(placingBuildingId || editorMessage) && (
          <div className={`placement-hint${activeBuilding ? " with-editor" : ""}${placementPreview && !placementPreview.valid ? " is-error" : ""}`} aria-live="polite">
            {editorMessage ?? "SELECT A BUILDING TO MOVE"}
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
                onClick={() => startPlacing(building.id)}
                aria-label={`Place ${building.label}`}
              >
                <img className="inventory-thumb" src={telescopeUpgraded && building.upgradeImage ? building.upgradeImage : building.image} alt="" />
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
          <section className={`penguin-dialog${isSweatshop ? " sweatshop-dialog" : ""}${isDogFighter ? " dog-fighter-dialog" : ""}${isFlipper ? " flipper-dialog" : ""}${isTelescope ? " alien-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="dialog-close" type="button" onClick={() => setSelectedBuilding(null)} aria-label="Close dialogue">×</button>
            <div className="dialog-character">
              <span className="bad-tape" aria-hidden="true" />
              <img
                src={selectedBuilding.id === "flipper" ? "/evil-penguin.jpg" : BUILDING_STORIES[selectedBuilding.id]?.character ?? "/evil-penguin.jpg"}
                alt={selectedBuilding.id === "flipper" ? "Flipper Flappington" : BUILDING_STORIES[selectedBuilding.id]?.name ?? "Penguin Town resident"}
              />
              <div className="character-tag">
                <small>{isFlipper ? "TUTORIAL GUIDE" : BUILDING_STORIES[selectedBuilding.id]?.role ?? "LOCAL RESIDENT"}</small>
                <b>{isFlipper ? "FLIPPER FLAPPINGTON" : BUILDING_STORIES[selectedBuilding.id]?.name ?? "PEN-GUIN"}</b>
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
              ) : isTelescope ? (
                <>
                  <h2 id="dialog-title">Deep-space field report.</h2>
                  <p>&ldquo;aliens... for sure&rdquo;</p>
                  {!telescopeUpgraded && <button type="button" onClick={upgradeTelescope}>UPGRADE TO METAL · 69 <span>→</span></button>}
                </>
              ) : isIgloo ? (
                <>
                  <h2 id="dialog-title">Dr. Bongo&apos;s drone depot.</h2>
                  <p>&ldquo;Three cans and the sky belongs to the apes.&rdquo;</p>
                  <div className="mini-bongo-ragdoll" aria-hidden="true"><img src="/media/dr-bongo-model-icon-v1.png" alt="" /></div>
                  <button type="button" disabled={purchases.includes("Drone Swarm")} onClick={() => spendRatMeat("Drone Swarm", 3)}>{purchases.includes("Drone Swarm") ? "DRONE SWARM OWNED" : "BUY DRONE SWARM · 3"} <span>→</span></button>
                </>
              ) : isCircus ? (
                <>
                  <h2 id="dialog-title">Exotic inventory.</h2>
                  <p className="store-intro">Animals, drones, and one fully autonomous bad idea.</p>
                  <div className="circus-store">
                    {CIRCUS_STOCK.map(([item, cost]) => <button type="button" key={item} disabled={purchases.includes(item)} onClick={() => spendRatMeat(item, cost)}><span>{item}</span><b>{purchases.includes(item) ? "OWNED" : `${cost} RM`}</b></button>)}
                  </div>
                </>
              ) : isDocks ? (
                <>
                  <h2 id="dialog-title">Mobile offshore rat farm.</h2>
                  <p>&ldquo;The sea provides. Mostly rats.&rdquo;</p>
                  <div className="rat-farm-card"><img src="/media/lab-rat-v1.png" alt="Laboratory rat" /><span>+3 RAT MEAT</span></div>
                  <button type="button" disabled={farmCooldown > 0} onClick={farmRats}>{farmCooldown ? `FARM COOLDOWN · ${farmCooldown}s` : "FARM RATS · +3"} <span>→</span></button>
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

