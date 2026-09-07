"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { useRouter } from "next/navigation";
import type { AlienType, EditOffset, EditTargetId, Globe3DHandle, SatellitePartId, Territory } from "./globe3d";
import { LAND_COLOR_PRESETS, TERRITORIES } from "../lib/territories";
import SocialPopup from "../components/SocialPopup";
import { useProfile } from "../lib/useProfile";

// Special-cased territories: hitting one of these short-circuits the normal
// locked/unlocked entry card with something else entirely.
const MIDDLE_EAST_TERRITORIES = new Set(["Middle East", "Israel"]);
const USA_TERRITORY = "North America";
const LOGIN_GATE_TERRITORIES = new Set(["China", "South America", "Africa", "Europe"]);

type Point = [number, number];

type PolygonGeometry = { type: "Polygon"; coordinates: Point[][] };
type LandFeature = {
  feature: { type: "Feature"; properties: null; geometry: PolygonGeometry };
  antarctic: boolean;
};

const SATELLITE_PARTS: { id: SatellitePartId; label: string; swatch: string }[] = [
  { id: "thrusters", label: "Thrusters", swatch: "#2a6bff" },
  { id: "big-dish", label: "Big Dish", swatch: "#d8e6f2" },
  { id: "extra-panels", label: "Panels", swatch: "#ffa23c" },
  { id: "beacon-warm", label: "Warm Beacon", swatch: "#ffb23c" },
];

const EDIT_TARGETS: { id: EditTargetId; label: string; range: number }[] = [
  { id: "globe", label: "Globe", range: 1.5 },
  { id: "land", label: "Land", range: 1.5 },
  { id: "ocean", label: "Ocean", range: 1.5 },
  { id: "platform", label: "Platform", range: 2.5 },
  { id: "alien", label: "Alien", range: 1 },
  { id: "satellite", label: "Satellite", range: 2 },
  { id: "ufo", label: "UFOs", range: 2 },
  { id: "moon", label: "Moon", range: 3 },
];

const EMPTY_OFFSET: EditOffset = { x: 0, y: 0, z: 0, locked: false };
const makeEditOffsets = (): Record<EditTargetId, EditOffset> => ({
  globe: { ...EMPTY_OFFSET },
  land: { ...EMPTY_OFFSET },
  ocean: { ...EMPTY_OFFSET },
  platform: { ...EMPTY_OFFSET },
  alien: { ...EMPTY_OFFSET },
  satellite: { ...EMPTY_OFFSET },
  ufo: { ...EMPTY_OFFSET },
  moon: { ...EMPTY_OFFSET },
});

const DESTINATIONS = ["North America", "South America", "Africa", "China", "Southeast Asia", "India", "Himalayas", "Australia"];

const wrapAngle = (value: number) => ((value + 540) % 360) - 180;
const clampUnit = (value: number) => Math.max(-1, Math.min(1, value));
const formatCoordinate = (value: number, axis: "NS" | "EW") => {
  const hemisphere = axis === "NS" ? (value >= 0 ? "N" : "S") : (value >= 0 ? "E" : "W");
  return `${Math.abs(value).toFixed(1)}° ${hemisphere}`;
};

function Globe({ onEnter }: { onEnter: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<Globe3DHandle | null>(null);
  const onEnterRef = useRef(onEnter);
  const pressRef = useRef({ down: false, x: 0, y: 0, moved: false });
  const stickRef = useRef({ active: false, id: -1, cx: 0, cy: 0 });
  const dragRef = useRef({ active: false, x: 0, y: 0, mode: "orbit" as "orbit" | "roll" });
  const gyroRef = useRef({ active: false, x: 0, y: 0 });
  const [rotation, setRotation] = useState({ lon: 0, lat: -15, roll: 0 });
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 720, height: 720 });
  const [landFeatures, setLandFeatures] = useState<LandFeature[]>([]);
  const [texture, setTexture] = useState<HTMLImageElement | null>(null);
  const [textureDrift, setTextureDrift] = useState(0);
  const [landSpin, setLandSpin] = useState(0);
  const [world3d, setWorld3d] = useState(false);
  const [charge, setCharge] = useState(0);
  const [quiver, setQuiver] = useState(12);
  const [archerActive, setArcherActive] = useState(false);
  const [alienType, setAlienType] = useState<AlienType>("original");
  const [aimMode, setAimMode] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null);
  const [flash, setFlash] = useState<{ text: string; tone: string } | null>(null);
  const [selector, setSelector] = useState<{ name: string; unlocked: boolean; lon: number; lat: number } | null>(null);
  const [landPreset, setLandPreset] = useState("original");
  const [satelliteParts, setSatelliteParts] = useState<SatellitePartId[]>([]);
  const [terrainOpen, setTerrainOpen] = useState(false);
  const [cubeMode, setCubeMode] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTargetId>("globe");
  const [editOffsets, setEditOffsets] = useState<Record<EditTargetId, EditOffset>>(makeEditOffsets);
  const [platformScale, setPlatformScale] = useState(1);
  const [platformYaw, setPlatformYaw] = useState(0);
  const [terrainBrush, setTerrainBrush] = useState<"raise" | "lower" | null>(null);
  const boxDragRef = useRef({ active: false, x: 0, y: 0 });
  const boxRotationRef = useRef({ lon: 0, lat: 0 });
  const [usaFlagMode, setUsaFlagMode] = useState(false);
  const [loginGateTerritory, setLoginGateTerritory] = useState<string | null>(null);
  const { profile, save: saveProfile } = useProfile();
  const router = useRouter();

  const territories = useMemo<Territory[]>(() => TERRITORIES, []);
  const effectiveRotation = useMemo(() => ({ ...rotation, lon: wrapAngle(rotation.lon + landSpin) }), [rotation, landSpin]);

  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 1900);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const image = new Image();
    image.src = "/media/psychedelic-earth-texture-v1.png";
    image.onload = () => setTexture(image);
    const timer = window.setInterval(() => {
      setTextureDrift((value) => (value + 1) % 360);
      setLandSpin((value) => wrapAngle(value - .12));
    }, 140);
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
      const height = entry.contentRect.height;
      setSize({ width, height });
    });
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

  // Boots the 3D layer once the coastline data is in. Everything it draws sits
  // on top of the existing 2D canvas, which keeps painting the psychedelic
  // ocean underneath. If WebGL is missing the whole thing simply never turns
  // on and the original flat globe keeps rendering.
  useEffect(() => {
    const canvas = webglRef.current;
    if (!canvas || landFeatures.length === 0) return;
    let cancelled = false;
    let handle: Globe3DHandle | null = null;

    import("./globe3d")
      .then(({ createGlobe3D }) =>
        createGlobe3D(canvas, landFeatures, territories, {
          onCharge: setCharge,
          onQuiver: setQuiver,
          onShot: (result) => {
            // Water is just a miss. Land opens the territory's entry screen.
            if (!result.territory) {
              setFlash({ text: "SPLASH · OPEN WATER", tone: "water" });
              return;
            }

            if (MIDDLE_EAST_TERRITORIES.has(result.territory)) {
              router.push("/bb-yoohoo-room");
              return;
            }

            if (result.territory === USA_TERRITORY) {
              setUsaFlagMode(true);
              setFlash({ text: "🇺🇸 OLD GLORY MODE", tone: "open" });
              return;
            }

            if (LOGIN_GATE_TERRITORIES.has(result.territory)) {
              // A skippable popup alongside the normal entry card below —
              // never a replacement for it. Exploring never requires this.
              setLoginGateTerritory(result.territory);
            }

            setSelector({
              name: result.territory,
              unlocked: result.unlocked,
              lon: result.lon,
              lat: result.lat,
            });
          },
        }),
      )
      .then((created) => {
        if (cancelled) {
          created?.dispose();
          return;
        }
        handle = created;
        worldRef.current = created;
        setWorld3d(Boolean(created));
      })
      .catch((error: unknown) => {
        console.error("3D world unavailable, falling back to the flat globe", error);
        setWorld3d(false);
      });

    return () => {
      cancelled = true;
      handle?.dispose();
      worldRef.current = null;
      setWorld3d(false);
    };
  }, [landFeatures, territories, router]);

  useEffect(() => {
    worldRef.current?.setView(effectiveRotation, zoom);
  }, [effectiveRotation, zoom, world3d]);

  useEffect(() => {
    worldRef.current?.setSize(size.width, size.height);
  }, [size, world3d]);

  useEffect(() => {
    worldRef.current?.setSelectedTarget(editTarget);
  }, [editTarget, world3d]);

  useEffect(() => {
    worldRef.current?.setAlienType(alienType);
  }, [alienType, world3d]);

  useEffect(() => {
    worldRef.current?.setAimMode(aimMode);
  }, [aimMode, world3d]);

  useEffect(() => {
    const preset = LAND_COLOR_PRESETS.find((entry) => entry.id === landPreset);
    if (preset) worldRef.current?.setLandColor(preset.hex);
  }, [landPreset, world3d]);

  useEffect(() => {
    worldRef.current?.setSatelliteLoadout(satelliteParts);
  }, [satelliteParts, world3d]);

  useEffect(() => {
    worldRef.current?.setLandFlagMode(usaFlagMode);
    // The flag colours are baked true-to-hue; a LAND preset tint would wash
    // them out, so America forces the neutral (white) multiplier while active.
    if (usaFlagMode) worldRef.current?.setLandColor(0xffffff);
  }, [usaFlagMode, world3d]);

  const toggleSatellitePart = (id: SatellitePartId) => {
    setSatelliteParts((current) => (current.includes(id) ? current.filter((part) => part !== id) : [...current, id]));
  };

  useEffect(() => {
    worldRef.current?.setTerrainBrush(terrainBrush);
  }, [terrainBrush, world3d]);

  const setOffsetAxis = (target: EditTargetId, axis: "x" | "y" | "z", value: number) => {
    setEditOffsets((current) => {
      if (current[target].locked) return current;
      const next = { ...current, [target]: { ...current[target], [axis]: value } };
      worldRef.current?.setEditOffset(target, axis, value);
      return next;
    });
  };

  const toggleEditLock = (target: EditTargetId) => {
    setEditOffsets((current) => {
      const locked = !current[target].locked;
      worldRef.current?.setEditLock(target, locked);
      return { ...current, [target]: { ...current[target], locked } };
    });
  };

  const resetEditOffset = (target: EditTargetId) => {
    setEditOffsets((current) => {
      if (current[target].locked) return current;
      (["x", "y", "z"] as const).forEach((axis) => worldRef.current?.setEditOffset(target, axis, 0));
      return { ...current, [target]: { x: 0, y: 0, z: 0, locked: false } };
    });
  };

  const moveBoxDrag = (x: number, y: number) => {
    if (!boxDragRef.current.active) return;
    const dx = x - boxDragRef.current.x;
    const dy = y - boxDragRef.current.y;
    boxDragRef.current = { active: true, x, y };
    const next = {
      lon: wrapAngle(boxRotationRef.current.lon - dx * .32),
      lat: wrapAngle(boxRotationRef.current.lat + dy * .32),
    };
    boxRotationRef.current = next;
    worldRef.current?.setBoxRotation(next);
  };

  const project = useCallback((point: Point) => {
    const [lon, lat] = point;
    const lambda = (lon - effectiveRotation.lon) * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    const tilt = effectiveRotation.lat * Math.PI / 180;
    const x = Math.cos(phi) * Math.sin(lambda);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(lambda);
    const cameraY = y * Math.cos(tilt) - z * Math.sin(tilt);
    const cameraZ = y * Math.sin(tilt) + z * Math.cos(tilt);
    const roll = effectiveRotation.roll * Math.PI / 180;
    const cameraX = x * Math.cos(roll) - cameraY * Math.sin(roll);
    const rolledY = x * Math.sin(roll) + cameraY * Math.cos(roll);
    const radius = Math.min(size.width, size.height) * 0.43 * zoom;
    return {
      x: Math.round((size.width / 2 + radius * cameraX) * 1000) / 1000,
      y: Math.round((size.height / 2 - radius * rolledY) * 1000) / 1000,
      visible: cameraZ > 0.03,
    };
  }, [effectiveRotation, size, zoom]);

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

    const radius = Math.min(size.width, size.height) * 0.43 * zoom;
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
      .rotate([-effectiveRotation.lon, -effectiveRotation.lat, effectiveRotation.roll])
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

    // When the 3D layer is live the landmasses are real geometry on the canvas
    // above this one, so the flat fill stays out of the way. Without WebGL it
    // draws exactly as it always has.
    if (!world3d) {
      drawLand(false);
      drawLand(true);
    }
    ctx.restore();

    const rim = ctx.createRadialGradient(cx, cy, radius * .82, cx, cy, radius * 1.08);
    rim.addColorStop(0, "rgba(92,202,255,0)");
    rim.addColorStop(.76, "rgba(92,202,255,0)");
    rim.addColorStop(.93, "rgba(92,202,255,.18)");
    rim.addColorStop(1, "rgba(92,202,255,0)");
    ctx.fillStyle = rim;
    ctx.fillRect(cx - radius * 1.1, cy - radius * 1.1, radius * 2.2, radius * 2.2);
  }, [effectiveRotation, landFeatures, size, texture, textureDrift, world3d, zoom]);

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

  // The gyroscope knob drives the exact same lon/lat state a drag on the
  // globe itself does — it's a second, more deliberate way to navigate the
  // same 3D space rather than a separate control scheme.
  const moveGyro = (x: number, y: number) => {
    if (!gyroRef.current.active) return;
    const dx = x - gyroRef.current.x;
    const dy = y - gyroRef.current.y;
    gyroRef.current = { active: true, x, y };
    setRotation((value) => ({
      ...value,
      lon: wrapAngle(value.lon - dx * .6),
      lat: wrapAngle(value.lat + dy * .6),
    }));
  };

  const updateAim = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    setReticle({ x: clientX - rect.left, y: clientY - rect.top });
    worldRef.current?.setAim(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((clientY - rect.top) / rect.height) * 2,
    );
  };

  const releasePress = (loose: boolean) => {
    if (!pressRef.current.down) return;
    const shouldLoose = loose && !pressRef.current.moved;
    pressRef.current.down = false;
    if (shouldLoose) worldRef.current?.setDrawing(false);
    else worldRef.current?.cancelDraw();
  };

  const moveStick = (clientX: number, clientY: number) => {
    if (!stickRef.current.active) return;
    const reach = 36;
    const x = clampUnit((clientX - stickRef.current.cx) / reach);
    const y = clampUnit((clientY - stickRef.current.cy) / reach);
    setStick({ x, y });
    worldRef.current?.setMove(x, -y);
  };

  const endStick = () => {
    stickRef.current.active = false;
    setStick({ x: 0, y: 0 });
    worldRef.current?.setMove(0, 0);
  };

  const oceanTransform = `translate(${(editOffsets.globe.x + editOffsets.ocean.x) * 42}px, ${-(editOffsets.globe.y + editOffsets.ocean.y) * 42}px) scale(${Math.max(.35, 1 + (editOffsets.globe.z + editOffsets.ocean.z) * .12)})`;

  return (
    <div className="globe-frame" ref={frameRef}>
      <div className={`globe-satellite-orbit${world3d ? " is-upgraded" : ""}`} aria-hidden="true"><span>🛰️</span></div>
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        style={{
          transform: oceanTransform,
        }}
        aria-label={
          terrainBrush
            ? `Terrain brush armed: drag across land to ${terrainBrush} it.`
            : cubeMode
              ? "Cube rotate mode: drag to tumble the entire enclosed universe."
              : "Rotatable globe. Drag in any direction for full 360 degree rotation, Shift-drag to roll, and scroll to zoom. Point to aim the archer and click to loose an arrow."
        }
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          if (event.button === 2 && archerActive) {
            updateAim(event.clientX, event.clientY);
            setAimMode(true);
            worldRef.current?.setAimMode(true);
            return;
          }
          if (terrainBrush) {
            updateAim(event.clientX, event.clientY);
            worldRef.current?.paintTerrain();
            return;
          }
          if (cubeMode) {
            boxDragRef.current = { active: true, x: event.clientX, y: event.clientY };
            return;
          }
          if (aimMode && archerActive && event.button === 0) {
            pressRef.current = { down:true, x:event.clientX, y:event.clientY, moved:false };
            updateAim(event.clientX,event.clientY);
            worldRef.current?.setDrawing(true);
            return;
          }
          dragRef.current = {
            active: true,
            x: event.clientX,
            y: event.clientY,
            mode: event.shiftKey || event.button === 2 ? "roll" : "orbit",
          };
          pressRef.current = { down: true, x: event.clientX, y: event.clientY, moved: false };
          updateAim(event.clientX, event.clientY);
          if (aimMode) return;
          worldRef.current?.setDrawing(true);
        }}
        onPointerMove={(event) => {
          if (terrainBrush) {
            updateAim(event.clientX, event.clientY);
            if (event.buttons > 0) worldRef.current?.paintTerrain();
            return;
          }
          if (cubeMode) {
            moveBoxDrag(event.clientX, event.clientY);
            return;
          }
          updateAim(event.clientX, event.clientY);
          if (pressRef.current.down && !pressRef.current.moved) {
            const travel = Math.hypot(event.clientX - pressRef.current.x, event.clientY - pressRef.current.y);
            if (travel > 6) {
              pressRef.current.moved = true;
              worldRef.current?.cancelDraw();
            }
          }
          moveDrag(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          dragRef.current.active = false; boxDragRef.current.active = false;
          if (event.button === 2) { setAimMode(false); worldRef.current?.setAimMode(false); return; }
          releasePress(true);
        }}
        onPointerCancel={() => { dragRef.current.active = false; boxDragRef.current.active = false; releasePress(false); }}
        onLostPointerCapture={() => { dragRef.current.active = false; boxDragRef.current.active = false; releasePress(false); }}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={(event) => {
          event.preventDefault();
          // Widened way out from the old .72–1.16 band (barely more than a
          // single close-up framing) to a real range spanning a tight
          // close-up through to seeing the whole enclosed universe cube and
          // everything drifting inside it. Exponential falloff so scrolling
          // feels equally responsive at both ends of that much bigger range.
          setZoom((value) => Math.max(.08, Math.min(3.4, value * Math.exp(-event.deltaY * .0012))));
        }}
      />
      <canvas ref={webglRef} className="globe-webgl" aria-hidden="true" />
      <button
        type="button"
        className="antarctica-marker"
        style={{ left: `${south.x}px`, top: `${south.y}px`, opacity: south.visible ? "1" : "0", pointerEvents: south.visible ? "auto" : "none" }}
        onClick={onEnter}
        aria-label="Enter Antarctica"
      >
        <span className="marker-dot" />
      </button>
      {world3d && (
        <div className="archer-hud">
          {!archerActive && <button type="button" className="archer-activate" onClick={() => { setArcherActive(true); worldRef.current?.setActive(true); }}>CLICK TO CONTROL ARCHER</button>}
          <div className="archer-chip">
            <span className="archer-face" aria-hidden="true">👽</span>
            <div className="archer-gauges">
              <b>{{original:"GOOPY · BOW",doop:"DOOPY · REVOLVER",zorp:"DOORP · AK-47"}[alienType]}</b>
              <div className="archer-bar" role="presentation"><i style={{ width: `${Math.round(charge * 100)}%` }} /></div>
              <small>{quiver} {alienType === "original" ? "ARROWS" : "PEPSI CANS"} · {archerActive ? "WASD MOVE · RIGHT CLICK AIM · LEFT CLICK FIRE" : "FLOATING · CLICK TO ACTIVATE"}</small>
            </div>
          </div>
          <div
            className="archer-stick"
            aria-hidden="true"
            onPointerDown={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              stickRef.current = {
                active: true,
                id: event.pointerId,
                cx: rect.left + rect.width / 2,
                cy: rect.top + rect.height / 2,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              moveStick(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => moveStick(event.clientX, event.clientY)}
            onPointerUp={endStick}
            onPointerCancel={endStick}
            onLostPointerCapture={endStick}
          >
            <i style={{ transform: `translate(${stick.x * 18}px, ${stick.y * 18}px)` }} />
          </div>
          <button
            type="button"
            className={`archer-aim${aimMode ? " is-active" : ""}`}
            aria-pressed={aimMode}
            onClick={() => { const next=!aimMode; setAimMode(next); worldRef.current?.setAimMode(next); }}
          >
            <span>{aimMode ? "AIM ON" : "AIM"}</span>
          </button>
          <button
            type="button"
            className="archer-fire"
            aria-label={alienType === "original" ? "Draw the bow and loose an arrow" : "Fire a Pepsi can"}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              worldRef.current?.setDrawing(true);
            }}
            onPointerUp={() => worldRef.current?.setDrawing(false)}
            onPointerCancel={() => worldRef.current?.cancelDraw()}
          >
            <span>FIRE</span>
          </button>
          {reticle && (
            <div className="archer-reticle" style={{ left: `${reticle.x}px`, top: `${reticle.y}px` }} aria-hidden="true">
              <i style={{ transform: `scale(${1 + charge * 0.75})` }} />
            </div>
          )}
          {flash && <div className={`archer-flash is-${flash.tone}`} role="status">{flash.text}</div>}
        </div>
      )}
      {selector && (
        <div className="territory-selector" role="dialog" aria-modal="false" aria-label={`${selector.name} entry`}>
          <button
            type="button"
            className="territory-selector__close"
            aria-label={`Close ${selector.name}`}
            onClick={() => setSelector(null)}
          >×</button>
          <div className="territory-selector__body">
            <div className="eyebrow"><span /> ARROW LANDED</div>
            <h2>{selector.name}</h2>
            <p className="territory-selector__coords">{formatCoordinate(selector.lat, "NS")} · {formatCoordinate(selector.lon, "EW")}</p>
            {selector.unlocked ? (
              <>
                <p className="territory-selector__copy">Territory is open. Drop in.</p>
                <button
                  type="button"
                  className="territory-selector__enter"
                  onClick={() => {
                    setSelector(null);
                    onEnterRef.current();
                  }}
                >ENTER {selector.name.toUpperCase()}</button>
              </>
            ) : (
              <>
                <p className="territory-selector__copy">No route down yet. This one is still locked.</p>
                <button type="button" className="territory-selector__enter is-locked" disabled>🔒 LOCKED</button>
              </>
            )}
          </div>
        </div>
      )}
      {loginGateTerritory && !profile && (
        <SocialPopup
          title="sup dood, i'm pat"
          tagline={`The arrow landed on ${loginGateTerritory}. Copy pending — placeholder until the real greeting lands. Totally skippable.`}
          onClose={() => setLoginGateTerritory(null)}
          onSaved={(newProfile) => {
            saveProfile(newProfile);
            setLoginGateTerritory(null);
          }}
        />
      )}
      {world3d && (
        <div className={`globe-toolbar${terrainOpen ? " is-open" : ""}`} onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="globe-toolbar-toggle"
            onClick={() => setTerrainOpen((value) => !value)}
            aria-expanded={terrainOpen}
            aria-label={terrainOpen ? "Collapse terrain controls" : "Expand terrain controls"}
          >
            ⚙ TERRAIN
          </button>
          {terrainOpen && (
            <>
              <span>LAND</span>
              {LAND_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={landPreset === preset.id ? "is-active" : ""}
                  style={{ "--swatch": `#${preset.hex.toString(16).padStart(6, "0")}` } as React.CSSProperties}
                  onClick={() => setLandPreset(preset.id)}
                  aria-pressed={landPreset === preset.id}
                  aria-label={`Land colour ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
              <span>SATELLITE</span>
              {SATELLITE_PARTS.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  className={satelliteParts.includes(part.id) ? "is-active" : ""}
                  style={{ "--swatch": part.swatch } as React.CSSProperties}
                  onClick={() => toggleSatellitePart(part.id)}
                  aria-pressed={satelliteParts.includes(part.id)}
                  aria-label={`Toggle satellite part ${part.label}`}
                >
                  {part.label}
                </button>
              ))}
              <small>Q/E FLY · R/F TILT · Z/X ZIP</small>
            </>
          )}
        </div>
      )}
      {world3d && (
        <div
          className="gyro-nav"
          role="slider"
          aria-label="Gyroscopic navigation — drag to steer your view through the 3D space"
          aria-valuemin={-180}
          aria-valuemax={180}
          aria-valuenow={Math.round(rotation.lon)}
          aria-valuetext={`Longitude ${Math.round(rotation.lon)}, latitude ${Math.round(rotation.lat)}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            gyroRef.current = { active: true, x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => moveGyro(event.clientX, event.clientY)}
          onPointerUp={() => { gyroRef.current.active = false; }}
          onPointerCancel={() => { gyroRef.current.active = false; }}
          onLostPointerCapture={() => { gyroRef.current.active = false; }}
        >
          <div
            className="gyro-nav__ring gyro-nav__ring--outer"
            style={{ transform: `rotateX(${-rotation.lat}deg) rotateY(${rotation.lon}deg)` }}
          />
          <div
            className="gyro-nav__ring gyro-nav__ring--inner"
            style={{ transform: `rotateY(${-rotation.lon}deg) rotateX(${rotation.lat}deg)` }}
          />
          <div className="gyro-nav__core" />
        </div>
      )}
      {world3d && (
        <div className={`cube-toolbar${cubeMode ? " is-open" : ""}`} onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="cube-toolbar-toggle"
            onClick={() => setCubeMode((value) => !value)}
            aria-expanded={cubeMode}
            aria-pressed={cubeMode}
            aria-label={cubeMode ? "Exit cube edit mode" : "Enter cube edit mode"}
          >
            ⬛ CUBE
          </button>
          {cubeMode && (
            <>
              <small className="cube-toolbar__hint">Drag the globe to tumble the whole box</small>
              <span>OBJECT</span>
              <div className="cube-toolbar__targets">
                {EDIT_TARGETS.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    className={editTarget === target.id ? "is-active" : ""}
                    onClick={() => setEditTarget(target.id)}
                  >
                    {target.label}
                  </button>
                ))}
              </div>
              {(["x", "y", "z"] as const).map((axis) => {
                const range = EDIT_TARGETS.find((target) => target.id === editTarget)?.range ?? 1;
                return (
                  <label key={axis} className="cube-toolbar__axis">
                    <span>{axis.toUpperCase()}</span>
                    <input
                      type="range"
                      min={-range}
                      max={range}
                      step={0.01}
                      value={editOffsets[editTarget][axis]}
                      disabled={editOffsets[editTarget].locked}
                      onChange={(event) => setOffsetAxis(editTarget, axis, Number(event.target.value))}
                    />
                  </label>
                );
              })}
              <div className="cube-toolbar__actions">
                <button
                  type="button"
                  className={editOffsets[editTarget].locked ? "is-active" : ""}
                  onClick={() => toggleEditLock(editTarget)}
                  aria-pressed={editOffsets[editTarget].locked}
                >
                  {editOffsets[editTarget].locked ? "🔒 Locked" : "🔓 Lock"}
                </button>
                <button type="button" onClick={() => resetEditOffset(editTarget)} disabled={editOffsets[editTarget].locked}>
                  Reset
                </button>
              </div>
              {editTarget === "platform" && (
                <div className="platform-sling-controls">
                  <label>
                    <span>SLING ROTATION</span>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={platformYaw}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setPlatformYaw(value);
                        worldRef.current?.setPlatformYaw(value);
                      }}
                    />
                    <b>{platformYaw}°</b>
                  </label>
                  <label>
                    <span>PLATFORM SIZE</span>
                    <input
                      type="range"
                      min={0.55}
                      max={2.25}
                      step={0.05}
                      value={platformScale}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setPlatformScale(value);
                        worldRef.current?.setPlatformScale(value);
                      }}
                    />
                    <b>{platformScale.toFixed(2)}×</b>
                  </label>
                </div>
              )}
              {(editTarget === "platform" || editTarget === "alien") && (
                <div className="cube-toolbar__actions cube-toolbar__actions--launch">
                  <button type="button" onClick={() => worldRef.current?.hopAlien()}>HOP</button>
                  <button type="button" onClick={() => worldRef.current?.ragdollAlien()}>RAGDOLL</button>
                  <button type="button" className="alien-launch" onClick={() => window.location.assign("/alien-archer")}>LAUNCH ARCHER</button>
                </div>
              )}
              {editTarget === "platform" && <small className="cube-toolbar__hint">Q/E orbit · R/F rise · Z/X depth · release to stop instantly · Lock freezes flight</small>}
              <span>GEOGRAPHIC LEVELS</span>
              <div className="cube-toolbar__destinations">
                {DESTINATIONS.map((name) => {
                  const territory = territories.find((entry) => entry.name === name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => territory && setRotation({ lon: territory.center[0], lat: territory.center[1], roll: 0 })}
                    >{name}</button>
                  );
                })}
              </div>
              <span>EARTH SHAPE</span>
              <div className="cube-toolbar__targets">
                <button
                  type="button"
                  className={terrainBrush === "raise" ? "is-active" : ""}
                  onClick={() => setTerrainBrush((value) => (value === "raise" ? null : "raise"))}
                >
                  ▲ Raise
                </button>
                <button
                  type="button"
                  className={terrainBrush === "lower" ? "is-active" : ""}
                  onClick={() => setTerrainBrush((value) => (value === "lower" ? null : "lower"))}
                >
                  ▼ Lower
                </button>
              </div>
              {terrainBrush && <small className="cube-toolbar__hint">Drag on land to sculpt</small>}
            </>
          )}
        </div>
      )}
      {world3d && (
        <aside className="alien-toolbar" aria-label="Alien and island controls" onPointerDown={(event)=>event.stopPropagation()}>
          <header><b>👽 ALIEN</b><small>ISLAND</small></header>
          <div className="alien-toolbar__characters">
            {(["original","doop","zorp"] as AlienType[]).map(type=><button key={type} type="button" className={alienType===type?"is-active":""} onClick={()=>setAlienType(type)}>{{original:"GOOPY",doop:"DOOPY",zorp:"DOORP"}[type]}</button>)}
          </div>
          <label><span>SIZE</span><input type="range" min={.55} max={2.25} step={.05} value={platformScale} onChange={event=>{const value=Number(event.target.value);setPlatformScale(value);worldRef.current?.setPlatformScale(value);}}/><b>{platformScale.toFixed(2)}×</b></label>
          {(["x","y","z"] as const).map(axis=><label key={axis}><span>{axis.toUpperCase()}</span><input type="range" min={-2.5} max={2.5} step={.05} value={editOffsets.platform[axis]} onChange={event=>setOffsetAxis("platform",axis,Number(event.target.value))}/><b>{editOffsets.platform[axis].toFixed(1)}</b></label>)}
          <button type="button" className="alien-toolbar__reset" onClick={()=>resetEditOffset("platform")}>RESET ISLAND</button>
        </aside>
      )}
      <div className="globe-shadow" />
    </div>
  );
}

export default function WorldSelect() {
  const router = useRouter();
  const closeSelector = () => {
    if (window.parent !== window) {
      window.parent.postMessage("trip-close-urf", window.location.origin);
      return;
    }
    router.push("/urf-3d");
  };

  return (
    <main className="world-screen">
      <div className="stars" aria-hidden="true" />
      <header className="world-header world-header--minimal">
        <h1>Go anywhere</h1>
      </header>
      <button className="quit-button" type="button" aria-label="Exit world selection" onClick={closeSelector}>×</button>
      <section className="globe-stage" aria-label="World map">
        <Globe onEnter={() => router.push("/penguin-town")} />
      </section>
      <footer className="world-footer world-footer--minimal">
        <div className="control-hint" title="Drag: 360° rotate · Shift-drag: roll"><span>↔</span></div>
        <div className="control-hint" title="Scroll to zoom"><span>＋</span></div>
        <div className="control-hint" title="WASD walk · Q/E fly island · R/F rise · Z/X depth · C hop · G ragdoll"><span>🏹</span></div>
      </footer>
    </main>
  );
}
