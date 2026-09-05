"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { useRouter } from "next/navigation";
import type { Globe3DHandle, SatellitePartId, Territory } from "./globe3d";
import { LAND_COLOR_PRESETS, PIN_MARKERS, TERRITORIES } from "../lib/territories";

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
  const [rotation, setRotation] = useState({ lon: 0, lat: -15, roll: 0 });
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 720, height: 720 });
  const [landFeatures, setLandFeatures] = useState<LandFeature[]>([]);
  const [texture, setTexture] = useState<HTMLImageElement | null>(null);
  const [textureDrift, setTextureDrift] = useState(0);
  const [world3d, setWorld3d] = useState(false);
  const [charge, setCharge] = useState(0);
  const [quiver, setQuiver] = useState(12);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null);
  const [flash, setFlash] = useState<{ text: string; tone: string } | null>(null);
  const [selector, setSelector] = useState<{ name: string; unlocked: boolean; lon: number; lat: number } | null>(null);
  const [landPreset, setLandPreset] = useState("original");
  const [satelliteParts, setSatelliteParts] = useState<SatellitePartId[]>([]);
  const [terrainOpen, setTerrainOpen] = useState(false);

  const territories = useMemo<Territory[]>(() => TERRITORIES, []);

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
  }, [landFeatures, territories]);

  useEffect(() => {
    worldRef.current?.setView(rotation, zoom);
  }, [rotation, zoom, world3d]);

  useEffect(() => {
    worldRef.current?.setSize(size.width);
  }, [size, world3d]);

  useEffect(() => {
    const preset = LAND_COLOR_PRESETS.find((entry) => entry.id === landPreset);
    if (preset) worldRef.current?.setLandColor(preset.hex);
  }, [landPreset, world3d]);

  useEffect(() => {
    worldRef.current?.setSatelliteLoadout(satelliteParts);
  }, [satelliteParts, world3d]);

  const toggleSatellitePart = (id: SatellitePartId) => {
    setSatelliteParts((current) => (current.includes(id) ? current.filter((part) => part !== id) : [...current, id]));
  };

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
  }, [landFeatures, rotation, size, texture, textureDrift, world3d, zoom]);

  const markers = useMemo(() => PIN_MARKERS.map((continent) => ({ ...continent, projected: project(continent.center) })), [project]);
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

  return (
    <div className="globe-frame" ref={frameRef}>
      <div className={`globe-satellite-orbit${world3d ? " is-upgraded" : ""}`} aria-hidden="true"><span>🛰️</span></div>
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        aria-label="Rotatable globe. Drag in any direction for full 360 degree rotation, Shift-drag to roll, and scroll to zoom. Point to aim the archer and click to loose an arrow."
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            active: true,
            x: event.clientX,
            y: event.clientY,
            mode: event.shiftKey || event.button === 2 ? "roll" : "orbit",
          };
          pressRef.current = { down: true, x: event.clientX, y: event.clientY, moved: false };
          updateAim(event.clientX, event.clientY);
          worldRef.current?.setDrawing(true);
        }}
        onPointerMove={(event) => {
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
        onPointerUp={() => { dragRef.current.active = false; releasePress(true); }}
        onPointerCancel={() => { dragRef.current.active = false; releasePress(false); }}
        onLostPointerCapture={() => { dragRef.current.active = false; releasePress(false); }}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((value) => Math.max(.72, Math.min(1.16, value - event.deltaY * .0008)));
        }}
      />
      <canvas ref={webglRef} className="globe-webgl" aria-hidden="true" />
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
      {world3d && (
        <div className="archer-hud">
          <div className="archer-chip">
            <span className="archer-face" aria-hidden="true">👽</span>
            <div className="archer-gauges">
              <b>URF SCOUT</b>
              <div className="archer-bar" role="presentation"><i style={{ width: `${Math.round(charge * 100)}%` }} /></div>
              <small>{quiver} ARROWS · WASD MOVE · CLICK OR SPACE TO LOOSE</small>
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
            className="archer-fire"
            aria-label="Draw the bow and loose an arrow"
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
              <small>Q/E FLY · R/F TILT</small>
            </>
          )}
        </div>
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
    router.push("/");
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
        <div className="control-hint" title="WASD walk · Q/E fly island · R/F tilt"><span>🏹</span></div>
      </footer>
    </main>
  );
}
