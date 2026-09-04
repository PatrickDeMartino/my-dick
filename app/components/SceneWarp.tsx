"use client";

import { useEffect, useRef, useState } from "react";
import { SCENE_WARP_EVENT, pickSceneWarpVariant, type SceneWarpDetail, type SceneWarpVariant } from "../lib/sceneWarp";

const WARP_DURATION_MS = 620;

export default function SceneWarp() {
  const [state, setState] = useState<{ active: boolean; variant: SceneWarpVariant }>({ active: false, variant: "kaleido" });
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onWarp = (event: Event) => {
      const detail = (event as CustomEvent<SceneWarpDetail>).detail;
      if (!detail?.href) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        window.location.href = detail.href;
        return;
      }

      if (navigateTimer.current) clearTimeout(navigateTimer.current);
      setState({ active: true, variant: pickSceneWarpVariant() });
      navigateTimer.current = setTimeout(() => {
        window.location.href = detail.href;
      }, WARP_DURATION_MS);
    };

    window.addEventListener(SCENE_WARP_EVENT, onWarp);
    return () => {
      window.removeEventListener(SCENE_WARP_EVENT, onWarp);
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

  if (!state.active) return null;

  return (
    <div className={`scene-warp scene-warp--${state.variant}`} role="presentation" aria-hidden="true">
      <span className="scene-warp__layer scene-warp__layer-a" />
      <span className="scene-warp__layer scene-warp__layer-b" />
      <span className="scene-warp__layer scene-warp__layer-c" />
    </div>
  );
}
