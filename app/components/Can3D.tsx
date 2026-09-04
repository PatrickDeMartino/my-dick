"use client";

import { useEffect, useRef } from "react";

/**
 * A tiny real 3D model of the Rat Meat can for the top banner — a textured
 * cylinder (the actual can label art wrapped around it, real metal rims top
 * and bottom) slowly turning in place, instead of the old flat static icon.
 * Fills whatever box it's given (the banner's tall can-shaped slot) via a
 * ResizeObserver, same pattern as the main game canvas. three.js is loaded
 * lazily so pages that never look at the banner's can don't pay for it in
 * their initial bundle.
 */
type CanVariant = "rat-meat" | "yoohoo";

function makeYoohooLabel(THREE: typeof import("three")) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f8c52a");
  gradient.addColorStop(.48, "#ffed6f");
  gradient.addColorStop(1, "#d88a0e");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#3a160d";
  context.fillRect(0, 0, canvas.width, 72);
  context.fillRect(0, canvas.height - 72, canvas.width, 72);

  for (let offset = -80; offset < canvas.width + 260; offset += 330) {
    context.save();
    context.translate(offset + 165, 260);
    context.rotate(-.08);
    context.lineJoin = "round";
    context.strokeStyle = "#fff3bd";
    context.lineWidth = 22;
    context.font = "900 108px Impact, Arial Black, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeText("YOO-HOO", 0, 0);
    context.fillStyle = "#4a1e10";
    context.fillText("YOO-HOO", 0, 0);
    context.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function Can3D({ size = 40, variant = "rat-meat" }: { size?: number; variant?: CanVariant }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    import("three").then((THREE) => {
      if (disposed) return;
      const mount = mountRef.current;
      if (!mount) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
      camera.position.set(0.15, 0.22, 2.7);
      camera.lookAt(0, -0.02, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth || size, mount.clientHeight || size);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xfff3d8, 0x1a0f08, 1.4));
      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(2, 3, 3);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9fd9ff, 0.6);
      rim.position.set(-2, -1, -2);
      scene.add(rim);

      const label = variant === "yoohoo"
        ? makeYoohooLabel(THREE)
        : new THREE.TextureLoader().load("/media/rat-meat-can-v2.png");
      if (label) label.colorSpace = THREE.SRGBColorSpace;
      const sideMaterial = new THREE.MeshStandardMaterial({ map: label, roughness: 0.5, metalness: 0.12 });
      const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xc3ccce, roughness: 0.28, metalness: 0.85 });

      const canGroup = new THREE.Group();
      const cylinder = new THREE.CylinderGeometry(0.6, 0.6, 1.28, 40);
      const canMesh = new THREE.Mesh(cylinder, [sideMaterial, metalMaterial, metalMaterial]);
      canGroup.add(canMesh);
      const rimGeo = new THREE.TorusGeometry(0.6, 0.045, 8, 28);
      const rimTop = new THREE.Mesh(rimGeo, metalMaterial);
      rimTop.rotation.x = Math.PI / 2;
      rimTop.position.y = 0.64;
      canGroup.add(rimTop);
      const rimBottom = rimTop.clone();
      rimBottom.position.y = -0.64;
      canGroup.add(rimBottom);
      canGroup.rotation.z = 0.1;
      canGroup.rotation.y = 0.6;
      scene.add(canGroup);

      let localRaf = 0;
      function animate() {
        localRaf = requestAnimationFrame(animate);
        if (!reduceMotion) canGroup.rotation.y += 0.011;
        renderer.render(scene, camera);
      }
      animate();
      raf = localRaf;

      const resize = () => {
        const w = mount.clientWidth || size;
        const h = mount.clientHeight || size;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);

      cleanup = () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(localRaf);
        renderer.dispose();
        cylinder.dispose();
        rimGeo.dispose();
        sideMaterial.dispose();
        metalMaterial.dispose();
        label?.dispose();
        if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      };
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [size, variant]);

  return <div ref={mountRef} className="trip-can-3d" aria-hidden="true" />;
}
