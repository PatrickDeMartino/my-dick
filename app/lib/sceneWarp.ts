// Shared "scene warp" transition library.
//
// Any room can call `triggerSceneWarp(href)` instead of a plain navigation to
// play a few hundred ms of a randomly-picked psychedelic overlay animation
// before the browser actually navigates. New variants can be added over time
// by extending WARP_VARIANTS and adding a matching `.scene-warp--<name>`
// block in globals.css — nothing else needs to change.

export const SCENE_WARP_EVENT = "trip-scene-warp";

export const WARP_VARIANTS = ["kaleido", "glitch", "starfield", "chroma", "alien"] as const;
export type SceneWarpVariant = (typeof WARP_VARIANTS)[number];

export type SceneWarpDetail = { href: string };

export function pickSceneWarpVariant(): SceneWarpVariant {
  return WARP_VARIANTS[Math.floor(Math.random() * WARP_VARIANTS.length)];
}

/**
 * Fire the shared warp overlay, then hand off to a normal full navigation.
 * Safe to call from any click handler: `onClick={(e) => { e.preventDefault(); triggerSceneWarp("/map"); }}`
 */
export function triggerSceneWarp(href: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SceneWarpDetail>(SCENE_WARP_EVENT, { detail: { href } }));
}
