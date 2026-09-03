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
type Can3DProps = {
  size?: number;
  variant?: "rat" | "yoohoo";
};

export function Can3D({ size = 40, variant = "rat" }: Can3DProps) {
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

      const label = new THREE.TextureLoader().load(variant === "yoohoo" ? "/israel-room/yoohoo-can-clean.png" : "/media/rat-meat-can-v2.png");
      label.colorSpace = THREE.SRGBColorSpace;
      const sideMaterial = new THREE.MeshStandardMaterial({ map: label, roughness: 0.5, metalness: 0.12 });
      const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xc3ccce, roughness: 0.28, metalness: 0.85 });

      const canGroup = new THREE.Group();
      const radius = variant === "yoohoo" ? 0.49 : 0.6;
      const height = variant === "yoohoo" ? 1.48 : 1.28;
      const cylinder = new THREE.CylinderGeometry(radius, radius, height, 40);
      const canMesh = new THREE.Mesh(cylinder, [sideMaterial, metalMaterial, metalMaterial]);
      canGroup.add(canMesh);
      const rimGeo = new THREE.TorusGeometry(radius, 0.045, 8, 32);
      const rimTop = new THREE.Mesh(rimGeo, metalMaterial);
      rimTop.rotation.x = Math.PI / 2;
      rimTop.position.y = height / 2;
      canGroup.add(rimTop);
      const rimBottom = rimTop.clone();
      rimBottom.position.y = -height / 2;
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
        label.dispose();
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
