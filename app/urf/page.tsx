"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from "react";
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

const buildings = [
  {
    id: "plane", label: "PLANE", hint: "Flight Deck", labelAt: [22, 34],
    points: "4,32 6,28 10,26 18,29 30,29 35,31 39,33 39,35 36,36 29,35 26,36 31,38 30,40 25,41 20,38 17,37 18,40 15,42 10,42 8,41 10,38 13,37 6,35",
  },
  {
    id: "telescope", label: "TELESCOPE", hint: "Observatory", labelAt: [74, 22],
    points: "61,16 62,13 65,12 66,9 69,7 72,8 74,11 75,13 78,13 79,15 81,16 81,18 79,20 78,21 81,23 82,26 85,29 84,32 82,33 70,33 67,31 65,27 66,23 65,20 62,19",
  },
  {
    id: "magic", label: "FUCKING MAGIC PLACE", hint: "Definitely magic", labelAt: [54, 35],
    points: "40,29 41,27 43,26 44,28 44,35 47,36 46,33 47,30 49,28 50,26 53,25 57,26 59,28 60,31 61,36 62,36 63,34 63,28 65,26 66,27 67,29 66,36 63,37 62,40 59,41 49,41 45,39 42,37 41,35",
  },
  {
    id: "igloo", label: "IGLOO", hint: "Probably housing", labelAt: [35, 49],
    points: "20,49 22,46 25,44 28,42 32,41 37,40 41,42 44,45 45,48 47,48 48,51 47,54 44,54 43,56 36,56 34,54 31,55 26,54 23,52 22,50",
  },
  {
    id: "sweatshop", label: "SWEATSHOP", hint: "Work hard", labelAt: [78, 49],
    points: "58,50 60,47 63,44 67,42 68,40 72,40 74,38 79,39 81,37 82,39 82,34 84,34 86,43 91,44 91,46 94,47 94,52 92,53 92,56 88,57 84,56 81,55 77,56 72,55 68,56 64,54 61,54",
  },
  {
    id: "docks", label: "DOCKS & CARGO", hint: "Trade and transport", labelAt: [22, 69],
    points: "2,68 3,63 7,61 9,59 10,57 12,56 14,56 16,58 20,59 22,58 24,56 26,56 28,58 29,62 32,64 35,68 39,70 40,74 38,77 35,77 32,80 26,81 23,79 18,79 15,77 10,77 7,74 4,72",
  },
  {
    id: "arena", label: "DOG-FIGHT ARENA", hint: "Absolutely unfinished", labelAt: [68, 67],
    points: "46,68 47,62 51,59 54,58 58,58 59,56 62,55 66,56 69,55 72,56 75,55 78,56 81,57 84,58 85,61 88,62 88,69 85,70 84,73 79,74 75,73 72,75 67,74 64,75 60,73 57,74 53,72 50,72 48,70",
  },
] as const;

const snowflakes = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 37 + 9) % 101}%`,
  delay: `${-((index * 1.13) % 8.5)}s`,
  duration: `${6.5 + (index % 7) * .72}s`,
  size: `${2 + (index % 4) * .85}px`,
  drift: `${-24 + (index * 19) % 52}px`,
}));

const buildingClipPath = (points: string) => `polygon(${points
  .split(" ")
  .map((point) => point.split(",").map((value) => `${value}%`).join(" "))
  .join(", ")})`;

function Flipper({ mapRef }: { mapRef: RefObject<HTMLElement | null> }) {
  const flipperRef = useRef<HTMLButtonElement>(null);
  const motionRef = useRef({
    x: 0, y: 0, vx: 34, vy: 4, initialized: false, dragging: false,
    pointerId: -1, offsetX: 0, offsetY: 0, lastX: 0, lastY: 0,
    lastPointerTime: 0, thrownUntil: 0, nextTurnAt: 0,
  });

  useEffect(() => {
    const flipper = flipperRef.current;
    const map = mapRef.current;
    if (!flipper || !map) return;
    const motion = motionRef.current;

    const bounds = () => ({
      minX: map.clientWidth * .045,
      maxX: map.clientWidth * .93 - flipper.offsetWidth,
      minY: map.clientHeight * .31,
      maxY: map.clientHeight * .80 - flipper.offsetHeight,
    });
    const paint = () => {
      flipper.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0)`;
      flipper.style.setProperty("--flipper-facing", motion.vx < 0 ? "-1" : "1");
    };
    const place = () => {
      const limit = bounds();
      if (!motion.initialized) {
        motion.x = map.clientWidth * .51;
        motion.y = map.clientHeight * .52;
        motion.initialized = true;
      }
      motion.x = Math.max(limit.minX, Math.min(limit.maxX, motion.x));
      motion.y = Math.max(limit.minY, Math.min(limit.maxY, motion.y));
      paint();
    };

    place();
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(map);
    let animationFrame = 0;
    let previousTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min(.034, Math.max(0, (time - previousTime) / 1000));
      previousTime = time;
      if (!motion.dragging) {
        const airborne = time < motion.thrownUntil || Math.hypot(motion.vx, motion.vy) > 78;
        flipper.dataset.motion = airborne ? "flying" : "waddling";
        if (airborne) {
          const friction = Math.pow(.983, dt * 60);
          motion.vx *= friction;
          motion.vy *= friction;
        } else if (time > motion.nextTurnAt) {
          const keepDirection = Math.random() > .28 ? (motion.vx < 0 ? -1 : 1) : (Math.random() > .5 ? 1 : -1);
          motion.vx = keepDirection * (19 + Math.random() * 20);
          motion.vy = (Math.random() - .5) * 18;
          motion.nextTurnAt = time + 1800 + Math.random() * 2600;
        }

        motion.x += motion.vx * dt;
        motion.y += motion.vy * dt;
        const limit = bounds();
        if (motion.x <= limit.minX || motion.x >= limit.maxX) {
          motion.x = Math.max(limit.minX, Math.min(limit.maxX, motion.x));
          motion.vx *= -.72;
        }
        if (motion.y <= limit.minY || motion.y >= limit.maxY) {
          motion.y = Math.max(limit.minY, Math.min(limit.maxY, motion.y));
          motion.vy *= -.72;
        }
        paint();
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [mapRef]);

  const moveFlipper = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const motion = motionRef.current;
    const map = mapRef.current;
    if (!motion.dragging || event.pointerId !== motion.pointerId || !map) return;
    const rect = map.getBoundingClientRect();
    const now = performance.now();
    const x = event.clientX - rect.left - motion.offsetX;
    const y = event.clientY - rect.top - motion.offsetY;
    const dt = Math.max(8, now - motion.lastPointerTime) / 1000;
    motion.vx = Math.max(-900, Math.min(900, (x - motion.x) / dt));
    motion.vy = Math.max(-900, Math.min(900, (y - motion.y) / dt));
    motion.x = x;
    motion.y = y;
    motion.lastX = event.clientX;
    motion.lastY = event.clientY;
    motion.lastPointerTime = now;
    event.currentTarget.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0)`;
  };

  const releaseFlipper = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const motion = motionRef.current;
    if (!motion.dragging || event.pointerId !== motion.pointerId) return;
    motion.dragging = false;
    motion.thrownUntil = performance.now() + 1700;
    if (Math.hypot(motion.vx, motion.vy) < 90) {
      motion.vx = (motion.vx < 0 ? -1 : 1) * 130;
      motion.vy = -45;
    }
    event.currentTarget.dataset.motion = "flying";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <button
      ref={flipperRef}
      type="button"
      className="flipper-character"
      data-motion="waddling"
      aria-label="Flipper Flappington. Drag him to pick him up, then throw him across town."
      onPointerDown={(event) => {
        if (!event.isPrimary || !mapRef.current) return;
        event.preventDefault();
        const motion = motionRef.current;
        const rect = mapRef.current.getBoundingClientRect();
        motion.dragging = true;
        motion.pointerId = event.pointerId;
        motion.offsetX = event.clientX - rect.left - motion.x;
        motion.offsetY = event.clientY - rect.top - motion.y;
        motion.lastX = event.clientX;
        motion.lastY = event.clientY;
        motion.lastPointerTime = performance.now();
        motion.vx = 0;
        motion.vy = 0;
        event.currentTarget.dataset.motion = "dragging";
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={moveFlipper}
      onPointerUp={releaseFlipper}
      onPointerCancel={releaseFlipper}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const motion = motionRef.current;
        motion.vx = (motion.vx < 0 ? -1 : 1) * 220;
        motion.vy = -180;
        motion.thrownUntil = performance.now() + 1500;
      }}
    >
      <span className="flipper-ground-shadow" aria-hidden="true" />
      <span className="flipper-sprite" aria-hidden="true">
        <i className="flipper-wing flipper-wing-left" />
        <i className="flipper-wing flipper-wing-right" />
        <i className="flipper-belly" />
        <i className="flipper-eye flipper-eye-left" />
        <i className="flipper-eye flipper-eye-right" />
        <i className="flipper-beak" />
        <i className="flipper-foot flipper-foot-left" />
        <i className="flipper-foot flipper-foot-right" />
      </span>
      <span className="flipper-tag">FLIPPER</span>
    </button>
  );
}

const RAT_MEAT_STORAGE_KEY = "trip.rat-meat.v1";
const RAT_MEAT_BALANCE_EVENT = "trip-rat-meat-balance-changed";

function PenguinTown({ onBack }: { onBack: () => void }) {
  const mapRef = useRef<HTMLElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<(typeof buildings)[number] | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [workersFed, setWorkersFed] = useState(false);
  const [rationError, setRationError] = useState(false);
  const [showDogFightGame, setShowDogFightGame] = useState(false);
  const isSweatshop = selectedBuilding?.id === "sweatshop";
  const isDogFighter = selectedBuilding?.id === "arena";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showDogFightGame) {
        setShowDogFightGame(false);
        return;
      }
      setSelectedBuilding(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDogFightGame]);

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

  return (
    <main className="town-screen">
      <div className="town-side town-side-left" aria-hidden="true"><span>90° S</span><i /></div>
      <div className="town-side town-side-right" aria-hidden="true"><i /><span>ICE SECTOR 01</span></div>
      <section ref={mapRef} className="town-map" aria-label="Penguin Town building map">
        <img className="town-art" src="/penguin-town-clean.webp" alt="A snowy penguin village with several strange buildings" draggable={false} />
        <div className="town-aurora" aria-hidden="true" />
        <div className="town-water-glint" aria-hidden="true" />
        <div className="magic-pulse" aria-hidden="true"><i /><i /><i /></div>
        <div className="observatory-beam" aria-hidden="true" />
        <div className="sweatshop-smoke" aria-hidden="true">
          <span className="smoke-puff smoke-puff-1" />
          <span className="smoke-puff smoke-puff-2" />
          <span className="smoke-puff smoke-puff-3" />
          <span className="smoke-puff smoke-puff-4" />
          <span className="smoke-puff smoke-puff-5" />
          <span className="smoke-puff smoke-puff-6" />
        </div>
        <div className="town-snow" aria-hidden="true">
          {snowflakes.map((snowflake, index) => (
            <i key={index} style={{
              left: snowflake.left,
              width: snowflake.size,
              height: snowflake.size,
              animationDelay: snowflake.delay,
              animationDuration: snowflake.duration,
              "--snow-drift": snowflake.drift,
            } as CSSProperties} />
          ))}
        </div>
        <Flipper mapRef={mapRef} />
        <svg className="town-building-occluders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <clipPath id="town-building-occlusion" clipPathUnits="userSpaceOnUse">
              {buildings.map((building) => <polygon key={building.id} points={building.points} />)}
            </clipPath>
          </defs>
          <image href="/penguin-town-clean.webp" width="100" height="100" preserveAspectRatio="none" clipPath="url(#town-building-occlusion)" />
        </svg>
        <svg className="town-building-outlines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {buildings.map((building) => (
            <polygon
              key={building.id}
              className={hoveredBuilding === building.id ? "is-active" : ""}
              points={building.points}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="town-vignette" aria-hidden="true" />
        <header className="town-header">
          <button type="button" onClick={onBack} aria-label="Return to world map">←</button>
          <div><small>ANTARCTICA · 90° S</small><h1>PENGUIN TOWN</h1></div>
        </header>
        <div className="town-guide" aria-label="Tutorial guide">
          <div className="guide-portrait"><img src="/evil-penguin.jpg" alt="Poorly drawn evil penguin tutorial guide" /></div>
          <div className="guide-copy"><small>FLIPPER FLAPPINGTON · DEFINITELY EVIL</small><p>Grab me. Throw me. I dare you.</p></div>
        </div>
        <div className="building-layer">
          {buildings.map((building) => (
            <button
              type="button"
              key={building.id}
              className="building-hotspot"
              style={{
                clipPath: buildingClipPath(building.points),
                "--label-x": `${building.labelAt[0]}%`,
                "--label-y": `${building.labelAt[1]}%`,
              } as CSSProperties}
              onPointerEnter={() => setHoveredBuilding(building.id)}
              onPointerLeave={() => setHoveredBuilding(null)}
              onFocus={() => setHoveredBuilding(building.id)}
              onBlur={() => setHoveredBuilding(null)}
              onClick={() => {
                setSelectedBuilding(building);
                if (building.id === "sweatshop") {
                  setWorkersFed(false);
                  setRationError(false);
                }
              }}
              aria-label={`Visit ${building.label}`}
            >
              <span className="building-label"><b>{building.label}</b><small>{building.hint}</small></span>
            </button>
          ))}
        </div>
        <div className="town-prompt" aria-hidden="true"><i /> HOVER / TAP A BUILDING · DRAG + THROW FLIPPER</div>
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
