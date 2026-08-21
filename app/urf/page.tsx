"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = [number, number];

type LandFeature = { rings: Point[][]; antarctic: boolean };

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
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const [rotation, setRotation] = useState({ lon: 0, lat: -15 });
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 720, height: 720 });
  const [landFeatures, setLandFeatures] = useState<LandFeature[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/ne-110m-land.geojson", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { features: { geometry: { coordinates: number[][][] } }[] }) => {
        const features = data.features.map(({ geometry }) => {
          const rings = geometry.coordinates.map((ring) =>
            ring.map(([lon, lat]) => [lon, lat] as Point),
          );
          const outerRing = rings[0] ?? [];
          const averageLatitude = outerRing.reduce((sum, [, lat]) => sum + lat, 0) / Math.max(outerRing.length, 1);
          return { rings, antarctic: averageLatitude < -60 };
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
    const radius = size.width * 0.43 * zoom;
    return {
      x: Math.round((size.width / 2 + radius * x) * 1000) / 1000,
      y: Math.round((size.height / 2 - radius * cameraY) * 1000) / 1000,
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

    ctx.strokeStyle = "rgba(145, 181, 205, .12)";
    ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 3) {
        const p = project([lon, lat]);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    for (let lon = -150; lon <= 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -89; lat <= 89; lat += 2) {
        const p = project([lon, lat]);
        if (!p.visible) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    const drawLand = ({ rings, antarctic }: LandFeature) => {
      ctx.beginPath();
      rings.forEach((points) => {
        let started = false;
        let visiblePoints = 0;
        points.forEach((point) => {
          const p = project(point);
          if (!p.visible) { started = false; return; }
          visiblePoints += 1;
          if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
        });
        if (visiblePoints === points.length) ctx.closePath();
      });
      ctx.fillStyle = antarctic ? "#bfe8ee" : "#53606b";
      ctx.strokeStyle = antarctic ? "#e9ffff" : "#71818d";
      ctx.lineWidth = 1.15;
      ctx.fill("evenodd");
      ctx.stroke();
    };

    landFeatures.forEach(drawLand);
    ctx.restore();

    const rim = ctx.createRadialGradient(cx, cy, radius * .82, cx, cy, radius * 1.08);
    rim.addColorStop(0, "rgba(92,202,255,0)");
    rim.addColorStop(.76, "rgba(92,202,255,0)");
    rim.addColorStop(.93, "rgba(92,202,255,.18)");
    rim.addColorStop(1, "rgba(92,202,255,0)");
    ctx.fillStyle = rim;
    ctx.fillRect(cx - radius * 1.1, cy - radius * 1.1, radius * 2.2, radius * 2.2);
  }, [landFeatures, project, size, zoom]);

  const markers = useMemo(() => continentMarkers.map((continent) => ({ ...continent, projected: project(continent.center) })), [project]);
  const south = project([0, -78]);

  const moveDrag = (x: number, y: number) => {
    if (!dragRef.current.active) return;
    const dx = x - dragRef.current.x;
    const dy = y - dragRef.current.y;
    dragRef.current = { active: true, x, y };
    setRotation((value) => ({
      lon: ((value.lon - dx * .32 + 540) % 360) - 180,
      lat: Math.max(-55, Math.min(55, value.lat + dy * .22)),
    }));
  };

  return (
    <div className="globe-frame" ref={frameRef}>
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        aria-label="Rotatable globe. Drag to rotate and scroll to zoom."
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { active: true, x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => moveDrag(event.clientX, event.clientY)}
        onPointerUp={() => { dragRef.current.active = false; }}
        onPointerCancel={() => { dragRef.current.active = false; }}
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
  { id: "plane", label: "PLANE", hint: "Flight Deck", style: { left: "4%", top: "25%", width: "36%", height: "19%" } },
  { id: "telescope", label: "TELESCOPE", hint: "Observatory", style: { left: "59%", top: "8%", width: "32%", height: "27%" } },
  { id: "magic", label: "FUCKING MAGIC PLACE", hint: "Definitely magic", style: { left: "38%", top: "25%", width: "30%", height: "22%" } },
  { id: "igloo", label: "IGLOO", hint: "Probably housing", style: { left: "23%", top: "42%", width: "29%", height: "19%" } },
  { id: "sweatshop", label: "SWEATSHOP", hint: "Work hard", style: { left: "62%", top: "40%", width: "34%", height: "22%" } },
  { id: "docks", label: "DOCKS & CARGO", hint: "Trade and transport", style: { left: "2%", top: "58%", width: "41%", height: "27%" } },
  { id: "arena", label: "DOG-FIGHT ARENA", hint: "Absolutely unfinished", style: { left: "48%", top: "61%", width: "42%", height: "23%" } },
];

function PenguinTown({ onBack }: { onBack: () => void }) {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedBuilding(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="town-screen">
      <div className="town-side town-side-left" aria-hidden="true"><span>90° S</span><i /></div>
      <div className="town-side town-side-right" aria-hidden="true"><i /><span>ICE SECTOR 01</span></div>
      <section className="town-map" aria-label="Penguin Town building map">
        <img className="town-art" src="/penguin-town-clean.webp" alt="A snowy penguin village with several strange buildings" draggable={false} />
        <div className="town-vignette" aria-hidden="true" />
        <header className="town-header">
          <button type="button" onClick={onBack} aria-label="Return to world map">←</button>
          <div><small>ANTARCTICA · 90° S</small><h1>PENGUIN TOWN</h1></div>
        </header>
        <div className="town-guide" aria-label="Tutorial guide">
          <div className="guide-portrait"><img src="/evil-penguin.jpg" alt="Poorly drawn evil penguin tutorial guide" /></div>
          <div className="guide-copy"><small>FLIPPER FLAPPINGTON · DEFINITELY EVIL</small><p>Suck my penguin cock</p></div>
        </div>
        <div className="building-layer">
          {buildings.map((building) => (
            <button
              type="button"
              key={building.id}
              className="building-hotspot"
              style={building.style}
              onClick={() => setSelectedBuilding(building.label)}
              aria-label={`Visit ${building.label}`}
            >
              <span className="building-label"><b>{building.label}</b><small>{building.hint}</small></span>
            </button>
          ))}
        </div>
        <div className="town-prompt" aria-hidden="true"><i /> HOVER TO IDENTIFY · CLICK TO VISIT</div>
      </section>

      {selectedBuilding && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedBuilding(null);
        }}>
          <section className="penguin-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="dialog-close" type="button" onClick={() => setSelectedBuilding(null)} aria-label="Close dialogue">×</button>
            <div className="dialog-character">
              <span className="bad-tape" aria-hidden="true" />
              <img src="/evil-penguin.jpg" alt="The poorly drawn evil penguin" />
              <div className="character-tag"><small>TUTORIAL GUIDE</small><b>PEN-GUIN</b></div>
            </div>
            <div className="speech-panel">
              <div className="speech-meta"><span>UNFINISHED LOCATION</span><b>{selectedBuilding}</b></div>
              <h2 id="dialog-title">Listen, pal.</h2>
              <p>i haven&apos;t fucking got to this part yet, do you know how hard it is to try and convince ai to make a dog fighting video game</p>
              <button type="button" onClick={() => setSelectedBuilding(null)}>FAIR ENOUGH <span>→</span></button>
            </div>
          </section>
        </div>
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
        <div className="control-hint"><span>↔</span><p><b>DRAG</b><small>ROTATE</small></p></div>
        <div className="control-hint"><span>＋</span><p><b>SCROLL</b><small>ZOOM</small></p></div>
        <div className="status-pill"><i /> 1 / 7 TERRITORIES UNLOCKED</div>
      </footer>
    </main>
  );
}
