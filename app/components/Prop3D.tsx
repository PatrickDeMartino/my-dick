"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import type { PropName } from "../lib/props3d";

/**
 * Renders one of the shared 3D props in a small canvas, slowly turning.
 *
 * It's a progressive upgrade: whatever icon was already there stays in the
 * markup underneath, and this canvas only covers it once three.js has loaded
 * and a model is actually on screen. No WebGL, no download, reduced motion —
 * the original icon is what you see, exactly as before.
 */
export default function Prop3D({ prop, className, children }: { prop: PropName; className?: string; children?: ReactNode }) {
  const mountRef = useRef<HTMLSpanElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      try {
        const [THREE, { buildProp, PROP_POSE }] = await Promise.all([
          import("three"),
          import("../lib/props3d"),
        ]);
        if (disposed) return;

        const size = Math.max(mount.clientWidth, 24);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size, size, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        camera.position.set(0, 0.28, 3.1);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.HemisphereLight(0xdff0ff, 0x201020, 1.1));
        const key = new THREE.DirectionalLight(0xfff4e2, 2.4);
        key.position.set(1.6, 2.2, 2.4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x8be3ff, 1.5);
        rim.position.set(-2, 0.6, -1.6);
        scene.add(rim);

        const pose = PROP_POSE[prop];
        const model = buildProp(THREE, prop);
        model.scale.setScalar(pose.scale);
        model.rotation.x = pose.tilt;
        scene.add(model);

        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
          if (disposed) return;
          frame = requestAnimationFrame(tick);
          const elapsed = (now - start) / 1000;
          model.rotation.y = pose.mode === "sway"
            ? Math.sin(elapsed * pose.spin) * 0.55
            : elapsed * pose.spin;
          model.position.y = Math.sin(elapsed * 1.6) * 0.03;
          renderer.render(scene, camera);
        };
        frame = requestAnimationFrame(tick);

        const observer = new ResizeObserver(() => {
          const next = Math.max(mount.clientWidth, 24);
          renderer.setSize(next, next, false);
        });
        observer.observe(mount);

        setLive(true);
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          renderer.dispose();
          if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
          setLive(false);
        };
      } catch {
        // No WebGL, or three failed to load: the flat icon underneath stands.
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [prop]);

  return (
    <span className={`prop-3d${live ? " is-live" : ""}${className ? ` ${className}` : ""}`} aria-hidden="true">
      {!live && children}
      <span className="prop-3d__stage" ref={mountRef} />
    </span>
  );
}
