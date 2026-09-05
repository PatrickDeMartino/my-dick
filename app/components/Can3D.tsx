"use client";

import { useEffect, useRef } from "react";

export type CanKind = "rat-meat" | "rat-meat-gold" | "yoohoo";

const LABEL: Record<CanKind, string> = {
  "rat-meat": "/media/rat-meat-label.jpg",
  "rat-meat-gold": "/media/rat-meat-gold-label.jpg",
  yoohoo: "/media/yoohoo-label.png",
};

const BODY: Record<CanKind, number> = {
  "rat-meat": 0xc3ccce,
  "rat-meat-gold": 0xe0b84a,
  yoohoo: 0xd8dee4,
};

/**
 * Banner / collectible tin: a real cylinder with the label art wrapped around
 * the body (not a photo of a can pasted onto a can). Metal rims top and bottom,
 * slow idle spin. Variant picks the wrapped texture.
 */
export function Can3D({ kind = "rat-meat", size = 40 }: { kind?: CanKind; size?: number }) {
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
      camera.position.set(0.18, 0.22, 2.7);
      camera.lookAt(0, -0.02, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth || size, mount.clientHeight || size);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xfff3d8, 0x1a0f08, 1.4));
      const key = new THREE.DirectionalLight(0xffffff, 1.55);
      key.position.set(2, 3, 3);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9fd9ff, 0.65);
      rim.position.set(-2, -1, -2);
      scene.add(rim);

      const label = new THREE.TextureLoader().load(LABEL[kind]);
      label.colorSpace = THREE.SRGBColorSpace;
      label.wrapS = THREE.ClampToEdgeWrapping;
      label.wrapT = THREE.ClampToEdgeWrapping;
      const sideMaterial = new THREE.MeshStandardMaterial({ map: label, roughness: 0.48, metalness: 0.08 });
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: BODY[kind],
        roughness: kind === "rat-meat-gold" ? 0.22 : 0.28,
        metalness: kind === "rat-meat-gold" ? 0.92 : 0.85,
      });

      const canGroup = new THREE.Group();
      const cylinder = new THREE.CylinderGeometry(0.6, 0.6, 1.28, 48, 1, false);
      const canMesh = new THREE.Mesh(cylinder, [sideMaterial, metalMaterial, metalMaterial]);
      canGroup.add(canMesh);
      const rimGeo = new THREE.TorusGeometry(0.6, 0.045, 8, 32);
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
        if (!reduceMotion) canGroup.rotation.y += 0.012;
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
  }, [kind, size]);

  return <div ref={mountRef} className="trip-can-3d" aria-hidden="true" />;
}
