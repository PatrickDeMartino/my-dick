import { Gt as e } from "./three.module-h2PuqYDi.js";
import { t } from "./WorldSimulation-O9Gd1zEA.js";
//#region app/world/hex-bridge.ts
var n = [
	"trip-world-spawn",
	"trip-world-clear",
	"trip-physics-settings",
	"trip-entity-edit",
	"trip-entity-select",
	"trip-entity-delete",
	"trip-world-export",
	"trip-world-import",
	"trip-world-action",
	"trip-world-stick",
	"trip-library-state"
];
function r(r, i, a, o, s) {
	let c = new t(r, i, a, {
		ground: 0,
		groundAt: o,
		bounds: 160,
		spawnPoint: () => {
			let t = s();
			return new e(t.x, o(t.x, t.z) + 3, t.z);
		}
	}), l = (e) => {
		e.source !== parent || e.origin !== location.origin || e.data?.type !== "trip-frame-event" || !n.includes(e.data.event) || window.dispatchEvent(new CustomEvent(e.data.event, {
			detail: e.data.detail,
			cancelable: !0
		}));
	}, u = (e) => parent.postMessage({
		type: "trip-frame-state",
		detail: e.detail
	}, location.origin), d = (e) => parent.postMessage({
		type: "trip-frame-library",
		detail: e.detail
	}, location.origin);
	return window.addEventListener("message", l), window.addEventListener("trip-entity-state", u), window.addEventListener("trip-library-open", d), parent.postMessage({ type: "trip-frame-ready" }, location.origin), c.report(), {
		world: c,
		dispose() {
			window.removeEventListener("message", l), window.removeEventListener("trip-entity-state", u), window.removeEventListener("trip-library-open", d), c.dispose();
		}
	};
}
//#endregion
export { r as attachHex };
