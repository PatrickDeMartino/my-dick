export const SCENE_WARP_EVENT = "trip-scene-warp";

export const WARP_VARIANTS = ["kaleido", "glitch", "starfield", "chroma", "alien"] as const;
export type SceneWarpVariant = (typeof WARP_VARIANTS)[number];
export type SceneWarpDetail = { href: string };

export function pickSceneWarpVariant(): SceneWarpVariant {
  return WARP_VARIANTS[Math.floor(Math.random() * WARP_VARIANTS.length)];
}

export function triggerSceneWarp(href: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SceneWarpDetail>(SCENE_WARP_EVENT, { detail: { href } }));
}
