// Temporary reference IDs. Never reorder or reuse these numbers.
export const SCREENS: Record<string, number> = {
  "/": 1, "/urf-3d": 2, "/brain-room": 3, "/anubis": 4,
  "/bongo": 5, "/penguin-town": 6, "/penguin-town-hex": 7,
  "/urf": 8, "/map": 9, "/bb-yoohoo-room": 10, "/assets-room": 11,
  "/alien-archer": 12, "/hextrip": 13, "/urf-3d/editor": 14, "/admin/logins": 15,
  "/dog-fighting/index.html": 16, "/alien-game/index.html": 17,
  "/alien-archer-game/index.html": 12, "/hextrip-game": 13, "/anubis-room/index.html": 4,
};
export const SCREEN_EVENT = "trip-screen-mode";
export function setScreenMode(mode = "") {
  window.dispatchEvent(new CustomEvent(SCREEN_EVENT, { detail: mode }));
}
