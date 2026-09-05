"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { PIN_MARKERS } from "../lib/territories";

type Point = [number, number];
type PolygonGeometry = { type: "Polygon"; coordinates: Point[][] };
type LandFeature = {
  feature: { type: "Feature"; properties: null; geometry: PolygonGeometry };
  antarctic: boolean;
};

const wrapAngle = (value: number) => ((value + 540) % 360) - 180;

/**
 * The previous World Select globe, rehomed as the Planet Urf icon on the
 * landing. Same 2D psychedelic ocean, same rotatable land — no dart, no
 * arrow, no alien. Clicking the parent button still opens the 3D world.
 */
export default function HomeGlobe({ onActivate }: { onActivate?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0, mode: "orbit" as "orbit" | "roll" });
  const pressRef = useRef({ x: 0, y: 0, moved: false });
  const [rotation, setRotation] = useState({ lon: 18, lat: -12, roll: 0 });
  const [zoom] = useState(1);
  const [size, setSize] = useState({ width: 420, height: 420 });
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
      const width = Math.max(120, entry.contentRect.width);
      setSize({ width, height: width });
    });
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      if (dragRef.current.active) return;
      setRotation((value) => ({ ...value, lon: wrapAngle(value.lon + 0.28) }));
    }, 40);
    return () => window.clearInterval(timer);
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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

  const markers = useMemo(
    () => PIN_MARKERS.map((continent) => ({ ...continent, projected: project(continent.center) })),
    [project],
  );

  const moveDrag = (x: number, y: number) => {
    if (!dragRef.current.active) return;
    const dx = x - dragRef.current.x;
    const dy = y - dragRef.current.y;
    const mode = dragRef.current.mode;
    dragRef.current = { active: true, x, y, mode };
    setRotation((value) => mode === "roll"
      ? { ...value, roll: wrapAngle(value.roll + (dx - dy) * .32) }
      : {
          lon: wrapAngle(value.lon - dx * .32),
          lat: wrapAngle(value.lat + dy * .32),
          roll: value.roll,
        });
  };

  return (
    <div className="home-globe" ref={frameRef}>
      <canvas
        ref={canvasRef}
        className="home-globe__canvas"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.stopPropagation();
          event.currentTarget.setPointerCapture(event.pointerId);
          pressRef.current = { x: event.clientX, y: event.clientY, moved: false };
          dragRef.current = {
            active: true,
            x: event.clientX,
            y: event.clientY,
            mode: event.shiftKey || event.button === 2 ? "roll" : "orbit",
          };
        }}
        onPointerMove={(event) => {
          if (pressRef.current.moved === false) {
            const travel = Math.hypot(event.clientX - pressRef.current.x, event.clientY - pressRef.current.y);
            if (travel > 8) pressRef.current.moved = true;
          }
          moveDrag(event.clientX, event.clientY);
        }}
        onPointerUp={() => {
          dragRef.current.active = false;
          if (!pressRef.current.moved) onActivate?.();
        }}
        onPointerCancel={() => { dragRef.current.active = false; }}
        onLostPointerCapture={() => { dragRef.current.active = false; }}
        onClick={(event) => {
          if (pressRef.current.moved) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
      {markers.map((marker) => (
        <div
          className="home-globe__pin"
          key={marker.name}
          style={{ left: `${marker.projected.x}px`, top: `${marker.projected.y}px`, opacity: marker.projected.visible ? "1" : "0" }}
          aria-hidden="true"
        >
          <span>🔒</span>
        </div>
      ))}
      <div className="home-globe__shadow" />
    </div>
  );
}
