import { $ as e, D as t, E as n, Gt as r, Ht as i, Jt as a, O as o, Ot as s, Pt as c, X as l, _ as u, f as d, h as f, l as p, o as m, ot as h, pt as g, y as _ } from "./three.module-h2PuqYDi.js";
import { _ as v, f as y, g as b, h as x, i as S, m as C, s as w, t as T, v as E } from "./weapons-_dchzrq5.js";
import { n as D, t as O } from "./launch-island-C-6Fzddt.js";
//#region app/urf-3d/grok/characters.ts
var k = {
	zix: {
		id: "zix",
		name: "ZIX",
		epithet: "THE TALL ONE",
		blurb: "Classic greentall. Long sightline, extra hide, slower feet.",
		hp: 120,
		speed: .88,
		jump: 1.02,
		scale: 1.16,
		followH: 2.55,
		radius: .36,
		recoil: .82,
		pickupBonus: 0,
		skin: 8191802,
		skinDark: 3844636,
		skinDeep: 2385940,
		emissive: 1460744
	},
	pip: {
		id: "pip",
		name: "PIP",
		epithet: "THE SHORTWAVE",
		blurb: "Pocket raider. Giraffe antennas. Fast, jumpy, hard to hit.",
		hp: 80,
		speed: 1.24,
		jump: 1.32,
		scale: .72,
		followH: 1.85,
		radius: .26,
		recoil: .68,
		pickupBonus: 0,
		skin: 10354506,
		skinDark: 4893218,
		skinDeep: 3045910,
		emissive: 1858060
	},
	vex: {
		id: "vex",
		name: "VEX",
		epithet: "THE VIOLET",
		blurb: "Medium menace. Ammo magnet. Mean with a cylinder.",
		hp: 100,
		speed: 1.04,
		jump: 1.1,
		scale: .98,
		followH: 2.25,
		radius: .32,
		recoil: .9,
		pickupBonus: 1,
		skin: 12086015,
		skinDark: 6957240,
		skinDeep: 4855928,
		emissive: 3805296
	},
	pongo: {
		id: "pongo",
		name: "PONGO",
		epithet: "THE KNUCKLE",
		blurb: "Big dumb monkey. Knuckle-walks on long, long arms. Hits like a landslide.",
		hp: 140,
		speed: .95,
		jump: .92,
		scale: 1.05,
		followH: 2.4,
		radius: .4,
		recoil: .7,
		pickupBonus: 0,
		skin: 11038778,
		skinDark: 7226400,
		skinDeep: 4860948,
		emissive: 2758152
	}
}, A = {
	zix: b,
	pip: x,
	vex: v,
	pongo: b
};
function j(e, t) {
	return new h({
		color: e,
		roughness: .46,
		metalness: .04,
		flatShading: !0,
		...t
	});
}
function M(t, n, r, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = 1, d = 1, f = 1) {
	let p = new e(n, r);
	return p.position.set(i, a, o), p.rotation.set(s, c, l), p.scale.set(u, d, f), p.castShadow = !0, p.receiveShadow = !0, t.add(p), p;
}
function ee(e) {
	let n = k[e], r = e === "pongo", i = j(n.skin, {
		emissive: n.emissive,
		emissiveIntensity: .2
	}), a = j(n.skinDark), s = j(n.skinDeep), l = r ? j(14464136, { roughness: .58 }) : a, d = new h({
		color: 724240,
		roughness: .2,
		metalness: .15,
		flatShading: !0
	}), f = new h({
		color: 15269876,
		emissive: 12124128,
		emissiveIntensity: .45,
		roughness: .18,
		flatShading: !0
	}), p = j(e === "vex" ? 3860735 : 7024027, {
		roughness: .5,
		emissive: e === "vex" ? 1214634 : 4853856,
		emissiveIntensity: .25
	}), v = null;
	if (e === "pip") {
		let e = {
			h: 0,
			s: 0,
			l: 0
		};
		i.color.getHSL(e);
		let t = {
			h: 0,
			s: 0,
			l: 0
		};
		a.color.getHSL(t);
		let n = {
			h: 0,
			s: 0,
			l: 0
		};
		s.color.getHSL(n), v = {
			skin: i,
			skinDark: a,
			skinDeep: s,
			sSkin: e.s,
			lSkin: e.l,
			sDark: t.s,
			lDark: t.l,
			sDeep: n.s,
			lDeep: n.l
		};
	}
	let b = new t(), x = new t(), C = r ? .5 : .9;
	x.position.y = C, b.add(x);
	let w = A[e];
	E(M(x, new c(.16, 12, 8), a, 0, 0, 0, 0, 0, 0, r ? 1.32 : 1.15, .55, r ? 1.05 : .85), w);
	let D = new t();
	D.position.y = .12, x.add(D), E(M(D, new c(.17, 12, 8), i, 0, .16, 0, 0, 0, 0, r ? 1.15 : .95, r ? 1.28 : 1.15, r ? .92 : .7), w), M(D, new _(.09, .13, .28, 10), a, 0, .02, 0);
	let O = new t();
	O.position.y = .34, D.add(O), E(M(O, new c(.2, 12, 8), i, 0, .02, .02, 0, 0, 0, r ? 1.22 : 1.05, r ? .82 : .7, r ? .88 : .72), w), e === "vex" && M(O, new g(.07, 1), new h({
		color: 3860735,
		emissive: 1214634,
		emissiveIntensity: .8,
		flatShading: !0,
		roughness: .2
	}), 0, .02, .16);
	let ee = e === "zix" ? .16 : r ? .06 : .1;
	M(O, new _(.055, r ? .095 : .07, ee, 10), a, 0, .16 + (ee - .1) * .4, .02);
	let N = new t();
	N.position.set(0, .34 + (e === "zix" ? .08 : r ? -.02 : 0), .04), O.add(N);
	let ne = e === "pip" ? 1.22 : e === "zix" ? 1.08 : r ? 1.3 : 1;
	E(M(N, r ? new o(.28, 1) : new o(.28, 2), a, 0, .1, 0, 0, 0, 0, (r ? 1.05 : .92) * ne, (r ? 1.02 : 1.22) * ne, (r ? 1 : 1.05) * ne), w, 1.09), r ? (M(N, new c(.15, 10, 8), l, 0, -.03, .16, .3, 0, 0, .82, .62, .7), M(N, new c(.035, 8, 6), s, 0, -.1, .27), M(N, new c(.075, 10, 8), a, -.24, .08, -.02, 0, 0, 0, .55, 1, .85), M(N, new c(.075, 10, 8), a, .24, .08, -.02, 0, 0, 0, .55, 1, .85)) : M(N, new c(.16, 10, 8), a, 0, -.08, .04, 0, 0, 0, .85, .7, .9);
	let P = new c(r ? .095 : .13, 12, 8), re = e === "pip" ? 1.05 : r ? 1.1 : 1, F = r ? .095 : .125, ie = r ? .24 : .27;
	M(N, P, d, -F, .07, ie, r ? 0 : -.15, r ? .1 : .38, r ? 0 : .15, .95 * re, 1.05 * re, r ? .7 : .42), M(N, P, d, F, .07, ie, r ? 0 : -.15, r ? -.1 : -.38, r ? 0 : -.15, .95 * re, 1.05 * re, r ? .7 : .42), M(N, new c(.028, 8, 6), f, -F + .04, .1, ie + .045), M(N, new c(.028, 8, 6), f, F + .04, .1, ie + .045);
	let ae = null, I = null;
	if (e === "pip") ae = te(-1, i, a, p), I = te(1, i, a, p), N.add(ae, I);
	else if (e === "zix") M(N, new c(.04, 8, 6), a, -.08, .32, -.02), M(N, new c(.04, 8, 6), a, .08, .32, -.02);
	else if (!r) {
		let e = new h({
			color: 14765055,
			emissive: 8392896,
			emissiveIntensity: .55,
			flatShading: !0,
			roughness: .22
		});
		M(N, new u(.04, .16, 6), e, -.1, .34, -.02, .15), M(N, new u(.035, .12, 6), e, .1, .32, -.02, -.12);
	}
	function L(e, n) {
		let o = .34 * n, s = .32 * n, l = .05 * (r ? 1.55 : 1), u = new t();
		u.position.set(e * (r ? .26 : .22), .02, .02), O.add(u), M(u, new c(.07 * (r ? 1.2 : 1), 10, 8), a, 0, 0, 0), M(u, new _(.045 * (r ? 1.35 : 1), .055 * (r ? 1.35 : 1), o, 10), i, 0, -o / 2, 0);
		let d = new t();
		d.position.y = -o, u.add(d), M(d, new c(.05 * (r ? 1.25 : 1), 8, 6), a, 0, 0, 0), M(d, new _(.035 * (r ? 1.3 : 1), .045 * (r ? 1.3 : 1), s, 10), i, 0, -s / 2, 0);
		let f = new t();
		f.position.y = -s, d.add(f), M(f, new c(l, 10, 8), i, 0, -.02, .008, 0, 0, 0, 1, 1.2, 1.02);
		let p = new t();
		return p.position.set(0, -l * 1.7, l * .35), f.add(p), {
			arm: u,
			forearmG: d,
			hand: f,
			grip: p
		};
	}
	let R = L(-1, r ? 1.9 : 1), z = L(1, r ? 1.9 : 1);
	function B(e) {
		let n = r ? .17 : .4, o = r ? .17 : .4, l = new t();
		l.position.set(e * (r ? .15 : .1), 0, 0), x.add(l), M(l, new c(.08 * (r ? 1.3 : 1), 10, 8), a, 0, 0, 0), M(l, new _(.05 * (r ? 1.5 : 1), .065 * (r ? 1.5 : 1), n, 10), i, 0, -n / 2, 0);
		let d = new t();
		d.position.y = -n, l.add(d), M(d, new c(.055 * (r ? 1.3 : 1), 8, 6), a, 0, 0, 0), M(d, new _(.038 * (r ? 1.55 : 1), .05 * (r ? 1.55 : 1), o, 10), i, 0, -o / 2, 0);
		let f = new t();
		f.position.set(0, -o * 1.05, .04), d.add(f), M(f, new m(.1 * (r ? 1.4 : 1), .05, .16 * (r ? 1.4 : 1)), a, 0, 0, .04);
		for (let e = 0; e < 3; e++) {
			let t = new u(.022, .1, 5);
			t.rotateX(Math.PI / 2), M(f, t, s, (e - 1) * .032, -.01, .14, .15, 0, 0);
		}
		let p = new t();
		return p.position.set(0, 0, .16 * (r ? 1.4 : 1)), f.add(p), {
			leg: l,
			shin: d,
			foot: f,
			footGrip: p
		};
	}
	let V = B(-1), H = B(1), U = new t();
	U.rotation.set(Math.PI / 2, 0, 0), U.position.set(0, 0, .05), z.grip.add(U);
	let oe = T(), W = y(), G = S();
	U.add(oe.root, W.root, G.root);
	let K = new t();
	K.position.set(.08, .04, -.22), K.rotation.set(-.5, .4, .3), O.add(K);
	let se = new t();
	se.position.set(.16, -.05, .05), se.rotation.set(.2, 0, .4), x.add(se);
	let q = new t();
	q.position.set(-.1, .06, -.2), q.rotation.set(-.3, -.5, -.3), O.add(q);
	let ce = new t();
	return ce.position.set(0, .1, -.24), ce.rotation.set(.1, Math.PI, 0), O.add(ce), b.scale.setScalar(n.scale), {
		root: b,
		hips: x,
		torso: D,
		chest: O,
		head: N,
		armL: R.arm,
		armR: z.arm,
		forearmL: R.forearmG,
		forearmR: z.forearmG,
		handL: R.hand,
		handR: z.hand,
		legL: V.leg,
		legR: H.leg,
		shinL: V.shin,
		shinR: H.shin,
		antennaL: ae,
		antennaR: I,
		ak: oe,
		revolver: W,
		bow: G,
		gunMount: U,
		backMount: K,
		hipMount: se,
		quiverMount: q,
		backpackMount: ce,
		jetpackMesh: null,
		walkPhase: 0,
		landSquash: 0,
		shootKick: 0,
		kind: e,
		skinHex: n.skin,
		springVel: {
			hipsZ: 0,
			torsoX: 0,
			chestY: 0,
			headX: 0,
			headY: 0
		},
		chameleon: v
	};
}
function te(e, n, r, i) {
	let a = new t();
	a.position.set(e * .12, .38, -.04), a.rotation.z = e * .22, a.rotation.x = -.22, M(a, new _(.028, .042, .82, 10), n, 0, .4, 0), M(a, new c(.07, 10, 8), i, 0, .84, 0);
	let o = new h({
		color: 3828242,
		roughness: .55,
		flatShading: !0,
		emissive: 1718792,
		emissiveIntensity: .2
	});
	for (let t = 0; t < 6; t++) M(a, new c(.024, 6, 5), o, e * .03, .14 + t * .12, .03);
	return a;
}
var N = 85, ne = 9;
function P(e, t, n, r, i) {
	let a = e.springVel[t], o = a + ((r - n) * N - a * ne) * i;
	return e.springVel[t] = o, n + o * i;
}
function re(e, t) {
	let n = e.kind === "pongo";
	t.justLanded && (e.landSquash = 1), t.justShot && (e.shootKick = 1), e.landSquash = Math.max(0, e.landSquash - t.dt * 4.5), e.shootKick = Math.max(0, e.shootKick - t.dt * 7);
	let r = t.speed, i = Math.min(1, r / 4), a = n ? 5 + r : 6 + r * 1.4;
	t.grounded && r > .2 ? e.walkPhase += t.dt * a : t.grounded ? e.walkPhase += t.dt * .6 : e.walkPhase += t.dt * 2;
	let o = e.walkPhase, s = Math.sin(o) * i, c = t.grounded ? Math.abs(Math.sin(o)) * (n ? .07 : .045) * i : 0, u = 1 - e.landSquash * .1, d = k[e.kind].scale;
	e.root.scale.set(d * (1 + (1 - u) * .55), d * u, d * (1 + (1 - u) * .55)), t.justLanded && (e.springVel.torsoX -= 3.2, e.springVel.chestY += (Math.random() - .5) * 3.5, e.springVel.headX -= 1.6), t.justShot && (e.springVel.chestY += (Math.random() - .5) * 2.2, e.springVel.headY += (Math.random() - .5) * 1.4), e.hips.position.y = (n ? .5 : .9) + c, e.hips.rotation.z = P(e, "hipsZ", e.hips.rotation.z, s * .06, t.dt);
	let f = n ? .5 : 0;
	e.torso.rotation.x = P(e, "torsoX", e.torso.rotation.x, f + i * (n ? .035 : .055) + (t.grounded ? 0 : -.1), t.dt), e.chest.rotation.y = P(e, "chestY", e.chest.rotation.y, s * -.1, t.dt);
	let p = Math.sin(t.time * 2.2) * .012;
	e.chest.scale.setScalar(1 + p);
	let m = t.weapon === "ak", h = t.weapon === "bow", g = l.clamp(t.reload, 0, 1), _ = e.shootKick, v = l.clamp(t.aimPitch ?? 0, -.85, 1.05), y = t.grounded ? 0 : l.clamp(-t.vy * .04, -.4, .6), b = n ? .5 : .7;
	if (e.legL.rotation.x = s * b + y, e.legR.rotation.x = -s * b + y * .6, e.legL.rotation.z = n ? .16 : .09, e.legR.rotation.z = n ? -.16 : -.09, e.shinL.rotation.x = Math.max(0, -s) * (n ? .35 : .5), e.shinR.rotation.x = Math.max(0, s) * (n ? .35 : .5), e.armL.rotation.order = "ZYX", e.armR.rotation.order = "ZYX", m ? (e.armL.rotation.set(-1.25 - v * .72, .35, .22), e.forearmL.rotation.set(-.35, 0, 0), e.armR.rotation.set(-1.32 - v - _ * .18, -.22, -.18), e.forearmR.rotation.set(-.15 - g * .4, 0, 0)) : h ? (e.armL.rotation.set(-1.3 - v * .82, .08, .08), e.forearmL.rotation.set(-.1, 0, 0), e.armR.rotation.set(-.95 - v * .9 + _ * .3, -.32, .18), e.forearmR.rotation.set(-1.05 + _ * .5, 0, 0)) : (e.armL.rotation.set(-.45 + s * .3, .15, .35), e.forearmL.rotation.set(-.35, 0, 0), e.armR.rotation.set(-1.45 - v - _ * .25, -.12, -.1), e.forearmR.rotation.set(-.05 - g * .6, 0, 0)), n) {
		let t = Math.sin(o + Math.PI) * i;
		e.hips.position.y = .5 + Math.abs(Math.sin(o * 2)) * .07 * i, e.armL.rotation.set(-1.02 + t * .34, .12, .28), e.forearmL.rotation.set(-.62 - Math.max(0, -t) * .5, 0, 0), !m && !h && (e.armR.rotation.set(-1.62 - v - _ * .22, -.12, -.1), e.forearmR.rotation.set(-.06 - g * .55, 0, 0));
	}
	if (e.head.rotation.x = P(e, "headX", e.head.rotation.x, (n ? -.035 : -.12) + Math.sin(t.time * 1.4) * .014, t.dt), e.head.rotation.y = P(e, "headY", e.head.rotation.y, s * -.035, t.dt), e.antennaL && e.antennaR) {
		let n = Math.sin(t.time * 3.2) * .12 + s * .2;
		e.antennaL.rotation.x = -.15 + n, e.antennaR.rotation.x = -.15 - n * .8, e.antennaL.rotation.z = -.18 + Math.sin(t.time * 2.1) * .08, e.antennaR.rotation.z = .18 + Math.cos(t.time * 2.4) * .08;
	}
	let x = m ? e.ak : h ? e.bow : e.revolver;
	x.root.parent !== e.gunMount && e.gunMount.add(x.root);
	let S = [
		{
			g: e.ak,
			mount: e.hipMount,
			rot: [
				1.2,
				0,
				.2
			],
			scale: .85
		},
		{
			g: e.revolver,
			mount: e.backMount,
			rot: [
				.2,
				0,
				.4
			],
			scale: .9
		},
		{
			g: e.bow,
			mount: e.quiverMount,
			rot: [
				.2,
				.4,
				-.15
			],
			scale: .85
		}
	];
	for (let e of S) e.g !== x && (e.g.root.parent !== e.mount && e.mount.add(e.g.root), e.g.root.rotation.set(...e.rot), e.g.root.scale.setScalar(e.scale), e.g.root.position.set(0, 0, 0));
	if (x.root.rotation.set(g * .4, 0, 0), x.root.position.set(0, -_ * .04, -_ * .08), x.root.scale.setScalar(m ? 1.15 : h ? 1.05 : 1.2), x.flash.visible = _ > .55, x.flash.visible && x.flash.scale.setScalar(.7 + _ * .8), x.mag && (x.mag.visible = !m || g < .45 || g > .7), x.cylinder && (x.cylinder.rotation.z = g * .9, C(x, t.revLoaded)), t.attract && (e.head.rotation.y = Math.sin(t.time * .35) * .22), e.chameleon) {
		let n = e.chameleon, r = t.time * .045 % 1, i = l.clamp(t.moodThreat ?? 0, -1, 1), a = r + ((i > 0 ? 0 : .6) - r) * Math.abs(i);
		n.skin.color.setHSL(a, n.sSkin, n.lSkin), n.skin.emissive.setHSL(a, Math.min(1, n.sSkin + .15), .16), n.skinDark.color.setHSL(a, n.sDark, n.lDark), n.skinDeep.color.setHSL(a, n.sDeep, n.lDeep), e.skinHex = n.skin.color.getHex();
	}
	t.jetpack ? (e.jetpackMesh || (e.jetpackMesh = w(), e.backpackMount.add(e.jetpackMesh)), e.jetpackMesh.visible = !0) : e.jetpackMesh && (e.jetpackMesh.visible = !1);
}
//#endregion
//#region node_modules/.pnpm/d3-array@3.2.4/node_modules/d3-array/src/fsum.js
var F = class {
	constructor() {
		this._partials = new Float64Array(32), this._n = 0;
	}
	add(e) {
		let t = this._partials, n = 0;
		for (let r = 0; r < this._n && r < 32; r++) {
			let i = t[r], a = e + i, o = Math.abs(e) < Math.abs(i) ? e - (a - i) : i - (a - e);
			o && (t[n++] = o), e = a;
		}
		return t[n] = e, this._n = n + 1, this;
	}
	valueOf() {
		let e = this._partials, t = this._n, n, r, i, a = 0;
		if (t > 0) {
			for (a = e[--t]; t > 0 && (n = a, r = e[--t], a = n + r, i = r - (a - n), !i););
			t > 0 && (i < 0 && e[t - 1] < 0 || i > 0 && e[t - 1] > 0) && (r = i * 2, n = a + r, r == n - a && (a = n));
		}
		return a;
	}
};
//#endregion
//#region node_modules/.pnpm/d3-array@3.2.4/node_modules/d3-array/src/merge.js
function* ie(e) {
	for (let t of e) yield* t;
}
function ae(e) {
	return Array.from(ie(e));
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/math.js
var I = 1e-6, L = Math.PI, R = L / 2, z = L / 4, B = L * 2, V = 180 / L, H = L / 180, U = Math.abs, oe = Math.atan, W = Math.atan2, G = Math.cos, K = Math.sin, se = Math.sign || function(e) {
	return e > 0 ? 1 : e < 0 ? -1 : 0;
}, q = Math.sqrt;
function ce(e) {
	return e > 1 ? 0 : e < -1 ? L : Math.acos(e);
}
function le(e) {
	return e > 1 ? R : e < -1 ? -R : Math.asin(e);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/noop.js
function J() {}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/stream.js
function ue(e, t) {
	e && fe.hasOwnProperty(e.type) && fe[e.type](e, t);
}
var de = {
	Feature: function(e, t) {
		ue(e.geometry, t);
	},
	FeatureCollection: function(e, t) {
		for (var n = e.features, r = -1, i = n.length; ++r < i;) ue(n[r].geometry, t);
	}
}, fe = {
	Sphere: function(e, t) {
		t.sphere();
	},
	Point: function(e, t) {
		e = e.coordinates, t.point(e[0], e[1], e[2]);
	},
	MultiPoint: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) e = n[r], t.point(e[0], e[1], e[2]);
	},
	LineString: function(e, t) {
		pe(e.coordinates, t, 0);
	},
	MultiLineString: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) pe(n[r], t, 0);
	},
	Polygon: function(e, t) {
		me(e.coordinates, t);
	},
	MultiPolygon: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) me(n[r], t);
	},
	GeometryCollection: function(e, t) {
		for (var n = e.geometries, r = -1, i = n.length; ++r < i;) ue(n[r], t);
	}
};
function pe(e, t, n) {
	var r = -1, i = e.length - n, a;
	for (t.lineStart(); ++r < i;) a = e[r], t.point(a[0], a[1], a[2]);
	t.lineEnd();
}
function me(e, t) {
	var n = -1, r = e.length;
	for (t.polygonStart(); ++n < r;) pe(e[n], t, 1);
	t.polygonEnd();
}
function he(e, t) {
	e && de.hasOwnProperty(e.type) ? de[e.type](e, t) : ue(e, t);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/cartesian.js
function ge(e) {
	return [W(e[1], e[0]), le(e[2])];
}
function _e(e) {
	var t = e[0], n = e[1], r = G(n);
	return [
		r * G(t),
		r * K(t),
		K(n)
	];
}
function ve(e, t) {
	return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function ye(e, t) {
	return [
		e[1] * t[2] - e[2] * t[1],
		e[2] * t[0] - e[0] * t[2],
		e[0] * t[1] - e[1] * t[0]
	];
}
function be(e, t) {
	e[0] += t[0], e[1] += t[1], e[2] += t[2];
}
function xe(e, t) {
	return [
		e[0] * t,
		e[1] * t,
		e[2] * t
	];
}
function Se(e) {
	var t = q(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
	e[0] /= t, e[1] /= t, e[2] /= t;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/compose.js
function Ce(e, t) {
	function n(n, r) {
		return n = e(n, r), t(n[0], n[1]);
	}
	return e.invert && t.invert && (n.invert = function(n, r) {
		return n = t.invert(n, r), n && e.invert(n[0], n[1]);
	}), n;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/rotation.js
function we(e, t) {
	return U(e) > L && (e -= Math.round(e / B) * B), [e, t];
}
we.invert = we;
function Te(e, t, n) {
	return (e %= B) ? t || n ? Ce(De(e), Oe(t, n)) : De(e) : t || n ? Oe(t, n) : we;
}
function Ee(e) {
	return function(t, n) {
		return t += e, U(t) > L && (t -= Math.round(t / B) * B), [t, n];
	};
}
function De(e) {
	var t = Ee(e);
	return t.invert = Ee(-e), t;
}
function Oe(e, t) {
	var n = G(e), r = K(e), i = G(t), a = K(t);
	function o(e, t) {
		var o = G(t), s = G(e) * o, c = K(e) * o, l = K(t), u = l * n + s * r;
		return [W(c * i - u * a, s * n - l * r), le(u * i + c * a)];
	}
	return o.invert = function(e, t) {
		var o = G(t), s = G(e) * o, c = K(e) * o, l = K(t), u = l * i - c * a;
		return [W(c * i + l * a, s * n + u * r), le(u * n - s * r)];
	}, o;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/circle.js
function ke(e, t, n, r, i, a) {
	if (n) {
		var o = G(t), s = K(t), c = r * n;
		i == null ? (i = t + r * B, a = t - c / 2) : (i = Ae(o, i), a = Ae(o, a), (r > 0 ? i < a : i > a) && (i += r * B));
		for (var l, u = i; r > 0 ? u > a : u < a; u -= c) l = ge([
			o,
			-s * G(u),
			-s * K(u)
		]), e.point(l[0], l[1]);
	}
}
function Ae(e, t) {
	t = _e(t), t[0] -= e, Se(t);
	var n = ce(-t[1]);
	return ((-t[2] < 0 ? -n : n) + B - I) % B;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/clip/buffer.js
function je() {
	var e = [], t;
	return {
		point: function(e, n, r) {
			t.push([
				e,
				n,
				r
			]);
		},
		lineStart: function() {
			e.push(t = []);
		},
		lineEnd: J,
		rejoin: function() {
			e.length > 1 && e.push(e.pop().concat(e.shift()));
		},
		result: function() {
			var n = e;
			return e = [], t = null, n;
		}
	};
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/pointEqual.js
function Me(e, t) {
	return U(e[0] - t[0]) < 1e-6 && U(e[1] - t[1]) < 1e-6;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/clip/rejoin.js
function Ne(e, t, n, r) {
	this.x = e, this.z = t, this.o = n, this.e = r, this.v = !1, this.n = this.p = null;
}
function Pe(e, t, n, r, i) {
	var a = [], o = [], s, c;
	if (e.forEach(function(e) {
		if (!((t = e.length - 1) <= 0)) {
			var t, n = e[0], r = e[t], c;
			if (Me(n, r)) {
				if (!n[2] && !r[2]) {
					for (i.lineStart(), s = 0; s < t; ++s) i.point((n = e[s])[0], n[1]);
					i.lineEnd();
					return;
				}
				r[0] += 2 * I;
			}
			a.push(c = new Ne(n, e, null, !0)), o.push(c.o = new Ne(n, null, c, !1)), a.push(c = new Ne(r, e, null, !1)), o.push(c.o = new Ne(r, null, c, !0));
		}
	}), a.length) {
		for (o.sort(t), Fe(a), Fe(o), s = 0, c = o.length; s < c; ++s) o[s].e = n = !n;
		for (var l = a[0], u, d;;) {
			for (var f = l, p = !0; f.v;) if ((f = f.n) === l) return;
			u = f.z, i.lineStart();
			do {
				if (f.v = f.o.v = !0, f.e) {
					if (p) for (s = 0, c = u.length; s < c; ++s) i.point((d = u[s])[0], d[1]);
					else r(f.x, f.n.x, 1, i);
					f = f.n;
				} else {
					if (p) for (u = f.p.z, s = u.length - 1; s >= 0; --s) i.point((d = u[s])[0], d[1]);
					else r(f.x, f.p.x, -1, i);
					f = f.p;
				}
				f = f.o, u = f.z, p = !p;
			} while (!f.v);
			i.lineEnd();
		}
	}
}
function Fe(e) {
	if (t = e.length) {
		for (var t, n = 0, r = e[0], i; ++n < t;) r.n = i = e[n], i.p = r, r = i;
		r.n = i = e[0], i.p = r;
	}
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/polygonContains.js
function Ie(e) {
	return U(e[0]) <= L ? e[0] : se(e[0]) * ((U(e[0]) + L) % B - L);
}
function Le(e, t) {
	var n = Ie(t), r = t[1], i = K(r), a = [
		K(n),
		-G(n),
		0
	], o = 0, s = 0, c = new F();
	i === 1 ? r = R + I : i === -1 && (r = -R - I);
	for (var l = 0, u = e.length; l < u; ++l) if (f = (d = e[l]).length) for (var d, f, p = d[f - 1], m = Ie(p), h = p[1] / 2 + z, g = K(h), _ = G(h), v = 0; v < f; ++v, m = b, g = S, _ = C, p = y) {
		var y = d[v], b = Ie(y), x = y[1] / 2 + z, S = K(x), C = G(x), w = b - m, T = w >= 0 ? 1 : -1, E = T * w, D = E > L, O = g * S;
		if (c.add(W(O * T * K(E), _ * C + O * G(E))), o += D ? w + T * B : w, D ^ m >= n ^ b >= n) {
			var k = ye(_e(p), _e(y));
			Se(k);
			var A = ye(a, k);
			Se(A);
			var j = (D ^ w >= 0 ? -1 : 1) * le(A[2]);
			(r > j || r === j && (k[0] || k[1])) && (s += D ^ w >= 0 ? 1 : -1);
		}
	}
	return (o < -1e-6 || o < 1e-6 && c < -1e-12) ^ s & 1;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/clip/index.js
function Re(e, t, n, r) {
	return function(i) {
		var a = t(i), o = je(), s = t(o), c = !1, l, u, d, f = {
			point: p,
			lineStart: h,
			lineEnd: g,
			polygonStart: function() {
				f.point = _, f.lineStart = v, f.lineEnd = y, u = [], l = [];
			},
			polygonEnd: function() {
				f.point = p, f.lineStart = h, f.lineEnd = g, u = ae(u);
				var e = Le(l, r);
				u.length ? (c ||= (i.polygonStart(), !0), Pe(u, Be, e, n, i)) : e && (c ||= (i.polygonStart(), !0), i.lineStart(), n(null, null, 1, i), i.lineEnd()), c &&= (i.polygonEnd(), !1), u = l = null;
			},
			sphere: function() {
				i.polygonStart(), i.lineStart(), n(null, null, 1, i), i.lineEnd(), i.polygonEnd();
			}
		};
		function p(t, n) {
			e(t, n) && i.point(t, n);
		}
		function m(e, t) {
			a.point(e, t);
		}
		function h() {
			f.point = m, a.lineStart();
		}
		function g() {
			f.point = p, a.lineEnd();
		}
		function _(e, t) {
			d.push([e, t]), s.point(e, t);
		}
		function v() {
			s.lineStart(), d = [];
		}
		function y() {
			_(d[0][0], d[0][1]), s.lineEnd();
			var e = s.clean(), t = o.result(), n, r = t.length, a, f, p;
			if (d.pop(), l.push(d), d = null, r) {
				if (e & 1) {
					if (f = t[0], (a = f.length - 1) > 0) {
						for (c ||= (i.polygonStart(), !0), i.lineStart(), n = 0; n < a; ++n) i.point((p = f[n])[0], p[1]);
						i.lineEnd();
					}
					return;
				}
				r > 1 && e & 2 && t.push(t.pop().concat(t.shift())), u.push(t.filter(ze));
			}
		}
		return f;
	};
}
function ze(e) {
	return e.length > 1;
}
function Be(e, t) {
	return ((e = e.x)[0] < 0 ? e[1] - R - I : R - e[1]) - ((t = t.x)[0] < 0 ? t[1] - R - I : R - t[1]);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/clip/antimeridian.js
var Ve = Re(function() {
	return !0;
}, He, We, [-L, -R]);
function He(e) {
	var t = NaN, n = NaN, r = NaN, i;
	return {
		lineStart: function() {
			e.lineStart(), i = 1;
		},
		point: function(a, o) {
			var s = a > 0 ? L : -L, c = U(a - t);
			U(c - L) < 1e-6 ? (e.point(t, n = (n + o) / 2 > 0 ? R : -R), e.point(r, n), e.lineEnd(), e.lineStart(), e.point(s, n), e.point(a, n), i = 0) : r !== s && c >= L && (U(t - r) < 1e-6 && (t -= r * I), U(a - s) < 1e-6 && (a -= s * I), n = Ue(t, n, a, o), e.point(r, n), e.lineEnd(), e.lineStart(), e.point(s, n), i = 0), e.point(t = a, n = o), r = s;
		},
		lineEnd: function() {
			e.lineEnd(), t = n = NaN;
		},
		clean: function() {
			return 2 - i;
		}
	};
}
function Ue(e, t, n, r) {
	var i, a, o = K(e - n);
	return U(o) > 1e-6 ? oe((K(t) * (a = G(r)) * K(n) - K(r) * (i = G(t)) * K(e)) / (i * a * o)) : (t + r) / 2;
}
function We(e, t, n, r) {
	var i;
	if (e == null) i = n * R, r.point(-L, i), r.point(0, i), r.point(L, i), r.point(L, 0), r.point(L, -i), r.point(0, -i), r.point(-L, -i), r.point(-L, 0), r.point(-L, i);
	else if (U(e[0] - t[0]) > 1e-6) {
		var a = e[0] < t[0] ? L : -L;
		i = n * a / 2, r.point(-a, i), r.point(0, i), r.point(a, i);
	} else r.point(t[0], t[1]);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/clip/circle.js
function Ge(e) {
	var t = G(e), n = 2 * H, r = t > 0, i = U(t) > I;
	function a(t, r, i, a) {
		ke(a, e, n, i, t, r);
	}
	function o(e, n) {
		return G(e) * G(n) > t;
	}
	function s(e) {
		var t, n, a, s, u;
		return {
			lineStart: function() {
				s = a = !1, u = 1;
			},
			point: function(d, f) {
				var p = [d, f], m, h = o(d, f), g = r ? h ? 0 : l(d, f) : h ? l(d + (d < 0 ? L : -L), f) : 0;
				if (!t && (s = a = h) && e.lineStart(), h !== a && (m = c(t, p), (!m || Me(t, m) || Me(p, m)) && (p[2] = 1)), h !== a) u = 0, h ? (e.lineStart(), m = c(p, t), e.point(m[0], m[1])) : (m = c(t, p), e.point(m[0], m[1], 2), e.lineEnd()), t = m;
				else if (i && t && r ^ h) {
					var _;
					!(g & n) && (_ = c(p, t, !0)) && (u = 0, r ? (e.lineStart(), e.point(_[0][0], _[0][1]), e.point(_[1][0], _[1][1]), e.lineEnd()) : (e.point(_[1][0], _[1][1]), e.lineEnd(), e.lineStart(), e.point(_[0][0], _[0][1], 3)));
				}
				h && (!t || !Me(t, p)) && e.point(p[0], p[1]), t = p, a = h, n = g;
			},
			lineEnd: function() {
				a && e.lineEnd(), t = null;
			},
			clean: function() {
				return u | (s && a) << 1;
			}
		};
	}
	function c(e, n, r) {
		var i = _e(e), a = _e(n), o = [
			1,
			0,
			0
		], s = ye(i, a), c = ve(s, s), l = s[0], u = c - l * l;
		if (!u) return !r && e;
		var d = t * c / u, f = -t * l / u, p = ye(o, s), m = xe(o, d);
		be(m, xe(s, f));
		var h = p, g = ve(m, h), _ = ve(h, h), v = g * g - _ * (ve(m, m) - 1);
		if (!(v < 0)) {
			var y = q(v), b = xe(h, (-g - y) / _);
			if (be(b, m), b = ge(b), !r) return b;
			var x = e[0], S = n[0], C = e[1], w = n[1], T;
			S < x && (T = x, x = S, S = T);
			var E = S - x, D = U(E - L) < I, O = D || E < 1e-6;
			if (!D && w < C && (T = C, C = w, w = T), O ? D ? C + w > 0 ^ b[1] < (U(b[0] - x) < 1e-6 ? C : w) : C <= b[1] && b[1] <= w : E > L ^ (x <= b[0] && b[0] <= S)) {
				var k = xe(h, (-g + y) / _);
				return be(k, m), [b, ge(k)];
			}
		}
	}
	function l(t, n) {
		var i = r ? e : L - e, a = 0;
		return t < -i ? a |= 1 : t > i && (a |= 2), n < -i ? a |= 4 : n > i && (a |= 8), a;
	}
	return Re(o, s, a, r ? [0, -e] : [-L, e - L]);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/clip/line.js
function Ke(e, t, n, r, i, a) {
	var o = e[0], s = e[1], c = t[0], l = t[1], u = 0, d = 1, f = c - o, p = l - s, m = n - o;
	if (!(!f && m > 0)) {
		if (m /= f, f < 0) {
			if (m < u) return;
			m < d && (d = m);
		} else if (f > 0) {
			if (m > d) return;
			m > u && (u = m);
		}
		if (m = i - o, !(!f && m < 0)) {
			if (m /= f, f < 0) {
				if (m > d) return;
				m > u && (u = m);
			} else if (f > 0) {
				if (m < u) return;
				m < d && (d = m);
			}
			if (m = r - s, !(!p && m > 0)) {
				if (m /= p, p < 0) {
					if (m < u) return;
					m < d && (d = m);
				} else if (p > 0) {
					if (m > d) return;
					m > u && (u = m);
				}
				if (m = a - s, !(!p && m < 0)) {
					if (m /= p, p < 0) {
						if (m > d) return;
						m > u && (u = m);
					} else if (p > 0) {
						if (m < u) return;
						m < d && (d = m);
					}
					return u > 0 && (e[0] = o + u * f, e[1] = s + u * p), d < 1 && (t[0] = o + d * f, t[1] = s + d * p), !0;
				}
			}
		}
	}
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/clip/rectangle.js
var qe = 1e9, Je = -qe;
function Ye(e, t, n, r) {
	function i(i, a) {
		return e <= i && i <= n && t <= a && a <= r;
	}
	function a(i, a, s, l) {
		var u = 0, d = 0;
		if (i == null || (u = o(i, s)) !== (d = o(a, s)) || c(i, a) < 0 ^ s > 0) do
			l.point(u === 0 || u === 3 ? e : n, u > 1 ? r : t);
		while ((u = (u + s + 4) % 4) !== d);
		else l.point(a[0], a[1]);
	}
	function o(r, i) {
		return U(r[0] - e) < 1e-6 ? i > 0 ? 0 : 3 : U(r[0] - n) < 1e-6 ? i > 0 ? 2 : 1 : U(r[1] - t) < 1e-6 ? +(i > 0) : i > 0 ? 3 : 2;
	}
	function s(e, t) {
		return c(e.x, t.x);
	}
	function c(e, t) {
		var n = o(e, 1), r = o(t, 1);
		return n === r ? n === 0 ? t[1] - e[1] : n === 1 ? e[0] - t[0] : n === 2 ? e[1] - t[1] : t[0] - e[0] : n - r;
	}
	return function(o) {
		var c = o, l = je(), u, d, f, p, m, h, g, _, v, y, b, x = {
			point: S,
			lineStart: E,
			lineEnd: D,
			polygonStart: w,
			polygonEnd: T
		};
		function S(e, t) {
			i(e, t) && c.point(e, t);
		}
		function C() {
			for (var t = 0, n = 0, i = d.length; n < i; ++n) for (var a = d[n], o = 1, s = a.length, c = a[0], l, u, f = c[0], p = c[1]; o < s; ++o) l = f, u = p, c = a[o], f = c[0], p = c[1], u <= r ? p > r && (f - l) * (r - u) > (p - u) * (e - l) && ++t : p <= r && (f - l) * (r - u) < (p - u) * (e - l) && --t;
			return t;
		}
		function w() {
			c = l, u = [], d = [], b = !0;
		}
		function T() {
			var e = C(), t = b && e, n = (u = ae(u)).length;
			(t || n) && (o.polygonStart(), t && (o.lineStart(), a(null, null, 1, o), o.lineEnd()), n && Pe(u, s, e, a, o), o.polygonEnd()), c = o, u = d = f = null;
		}
		function E() {
			x.point = O, d && d.push(f = []), y = !0, v = !1, g = _ = NaN;
		}
		function D() {
			u && (O(p, m), h && v && l.rejoin(), u.push(l.result())), x.point = S, v && c.lineEnd();
		}
		function O(a, o) {
			var s = i(a, o);
			if (d && f.push([a, o]), y) p = a, m = o, h = s, y = !1, s && (c.lineStart(), c.point(a, o));
			else if (s && v) c.point(a, o);
			else {
				var l = [g = Math.max(Je, Math.min(qe, g)), _ = Math.max(Je, Math.min(qe, _))], u = [a = Math.max(Je, Math.min(qe, a)), o = Math.max(Je, Math.min(qe, o))];
				Ke(l, u, e, t, n, r) ? (v || (c.lineStart(), c.point(l[0], l[1])), c.point(u[0], u[1]), s || c.lineEnd(), b = !1) : s && (c.lineStart(), c.point(a, o), b = !1);
			}
			g = a, _ = o, v = s;
		}
		return x;
	};
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/identity.js
var Xe = (e) => e, Ze = new F(), Qe = new F(), $e, et, tt, nt, Y = {
	point: J,
	lineStart: J,
	lineEnd: J,
	polygonStart: function() {
		Y.lineStart = rt, Y.lineEnd = ot;
	},
	polygonEnd: function() {
		Y.lineStart = Y.lineEnd = Y.point = J, Ze.add(U(Qe)), Qe = new F();
	},
	result: function() {
		var e = Ze / 2;
		return Ze = new F(), e;
	}
};
function rt() {
	Y.point = it;
}
function it(e, t) {
	Y.point = at, $e = tt = e, et = nt = t;
}
function at(e, t) {
	Qe.add(nt * e - tt * t), tt = e, nt = t;
}
function ot() {
	at($e, et);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/path/bounds.js
var st = Infinity, ct = st, lt = -st, ut = lt, dt = {
	point: ft,
	lineStart: J,
	lineEnd: J,
	polygonStart: J,
	polygonEnd: J,
	result: function() {
		var e = [[st, ct], [lt, ut]];
		return lt = ut = -(ct = st = Infinity), e;
	}
};
function ft(e, t) {
	e < st && (st = e), e > lt && (lt = e), t < ct && (ct = t), t > ut && (ut = t);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/path/centroid.js
var pt = 0, mt = 0, ht = 0, gt = 0, _t = 0, vt = 0, yt = 0, bt = 0, xt = 0, St, Ct, X, Z, Q = {
	point: $,
	lineStart: wt,
	lineEnd: Dt,
	polygonStart: function() {
		Q.lineStart = Ot, Q.lineEnd = kt;
	},
	polygonEnd: function() {
		Q.point = $, Q.lineStart = wt, Q.lineEnd = Dt;
	},
	result: function() {
		var e = xt ? [yt / xt, bt / xt] : vt ? [gt / vt, _t / vt] : ht ? [pt / ht, mt / ht] : [NaN, NaN];
		return pt = mt = ht = gt = _t = vt = yt = bt = xt = 0, e;
	}
};
function $(e, t) {
	pt += e, mt += t, ++ht;
}
function wt() {
	Q.point = Tt;
}
function Tt(e, t) {
	Q.point = Et, $(X = e, Z = t);
}
function Et(e, t) {
	var n = e - X, r = t - Z, i = q(n * n + r * r);
	gt += i * (X + e) / 2, _t += i * (Z + t) / 2, vt += i, $(X = e, Z = t);
}
function Dt() {
	Q.point = $;
}
function Ot() {
	Q.point = At;
}
function kt() {
	jt(St, Ct);
}
function At(e, t) {
	Q.point = jt, $(St = X = e, Ct = Z = t);
}
function jt(e, t) {
	var n = e - X, r = t - Z, i = q(n * n + r * r);
	gt += i * (X + e) / 2, _t += i * (Z + t) / 2, vt += i, i = Z * e - X * t, yt += i * (X + e), bt += i * (Z + t), xt += i * 3, $(X = e, Z = t);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/path/context.js
function Mt(e) {
	this._context = e;
}
Mt.prototype = {
	_radius: 4.5,
	pointRadius: function(e) {
		return this._radius = e, this;
	},
	polygonStart: function() {
		this._line = 0;
	},
	polygonEnd: function() {
		this._line = NaN;
	},
	lineStart: function() {
		this._point = 0;
	},
	lineEnd: function() {
		this._line === 0 && this._context.closePath(), this._point = NaN;
	},
	point: function(e, t) {
		switch (this._point) {
			case 0:
				this._context.moveTo(e, t), this._point = 1;
				break;
			case 1:
				this._context.lineTo(e, t);
				break;
			default:
				this._context.moveTo(e + this._radius, t), this._context.arc(e, t, this._radius, 0, B);
				break;
		}
	},
	result: J
};
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/path/measure.js
var Nt = new F(), Pt, Ft, It, Lt, Rt, zt = {
	point: J,
	lineStart: function() {
		zt.point = Bt;
	},
	lineEnd: function() {
		Pt && Vt(Ft, It), zt.point = J;
	},
	polygonStart: function() {
		Pt = !0;
	},
	polygonEnd: function() {
		Pt = null;
	},
	result: function() {
		var e = +Nt;
		return Nt = new F(), e;
	}
};
function Bt(e, t) {
	zt.point = Vt, Ft = Lt = e, It = Rt = t;
}
function Vt(e, t) {
	Lt -= e, Rt -= t, Nt.add(q(Lt * Lt + Rt * Rt)), Lt = e, Rt = t;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/path/string.js
var Ht, Ut, Wt, Gt, Kt = class {
	constructor(e) {
		this._append = e == null ? qt : Jt(e), this._radius = 4.5, this._ = "";
	}
	pointRadius(e) {
		return this._radius = +e, this;
	}
	polygonStart() {
		this._line = 0;
	}
	polygonEnd() {
		this._line = NaN;
	}
	lineStart() {
		this._point = 0;
	}
	lineEnd() {
		this._line === 0 && (this._ += "Z"), this._point = NaN;
	}
	point(e, t) {
		switch (this._point) {
			case 0:
				this._append`M${e},${t}`, this._point = 1;
				break;
			case 1:
				this._append`L${e},${t}`;
				break;
			default:
				if (this._append`M${e},${t}`, this._radius !== Wt || this._append !== Ut) {
					let e = this._radius, t = this._;
					this._ = "", this._append`m0,${e}a${e},${e} 0 1,1 0,${-2 * e}a${e},${e} 0 1,1 0,${2 * e}z`, Wt = e, Ut = this._append, Gt = this._, this._ = t;
				}
				this._ += Gt;
				break;
		}
	}
	result() {
		let e = this._;
		return this._ = "", e.length ? e : null;
	}
};
function qt(e) {
	let t = 1;
	this._ += e[0];
	for (let n = e.length; t < n; ++t) this._ += arguments[t] + e[t];
}
function Jt(e) {
	let t = Math.floor(e);
	if (!(t >= 0)) throw RangeError(`invalid digits: ${e}`);
	if (t > 15) return qt;
	if (t !== Ht) {
		let e = 10 ** t;
		Ht = t, Ut = function(t) {
			let n = 1;
			this._ += t[0];
			for (let r = t.length; n < r; ++n) this._ += Math.round(arguments[n] * e) / e + t[n];
		};
	}
	return Ut;
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/path/index.js
function Yt(e, t) {
	let n = 3, r = 4.5, i, a;
	function o(e) {
		return e && (typeof r == "function" && a.pointRadius(+r.apply(this, arguments)), he(e, i(a))), a.result();
	}
	return o.area = function(e) {
		return he(e, i(Y)), Y.result();
	}, o.measure = function(e) {
		return he(e, i(zt)), zt.result();
	}, o.bounds = function(e) {
		return he(e, i(dt)), dt.result();
	}, o.centroid = function(e) {
		return he(e, i(Q)), Q.result();
	}, o.projection = function(t) {
		return arguments.length ? (i = t == null ? (e = null, Xe) : (e = t).stream, o) : e;
	}, o.context = function(e) {
		return arguments.length ? (a = e == null ? (t = null, new Kt(n)) : new Mt(t = e), typeof r != "function" && a.pointRadius(r), o) : t;
	}, o.pointRadius = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : (a.pointRadius(+e), +e), o) : r;
	}, o.digits = function(e) {
		if (!arguments.length) return n;
		if (e == null) n = null;
		else {
			let t = Math.floor(e);
			if (!(t >= 0)) throw RangeError(`invalid digits: ${e}`);
			n = t;
		}
		return t === null && (a = new Kt(n)), o;
	}, o.projection(e).digits(n).context(t);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/transform.js
function Xt(e) {
	return function(t) {
		var n = new Zt();
		for (var r in e) n[r] = e[r];
		return n.stream = t, n;
	};
}
function Zt() {}
Zt.prototype = {
	constructor: Zt,
	point: function(e, t) {
		this.stream.point(e, t);
	},
	sphere: function() {
		this.stream.sphere();
	},
	lineStart: function() {
		this.stream.lineStart();
	},
	lineEnd: function() {
		this.stream.lineEnd();
	},
	polygonStart: function() {
		this.stream.polygonStart();
	},
	polygonEnd: function() {
		this.stream.polygonEnd();
	}
};
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/projection/fit.js
function Qt(e, t, n) {
	var r = e.clipExtent && e.clipExtent();
	return e.scale(150).translate([0, 0]), r != null && e.clipExtent(null), he(n, e.stream(dt)), t(dt.result()), r != null && e.clipExtent(r), e;
}
function $t(e, t, n) {
	return Qt(e, function(n) {
		var r = t[1][0] - t[0][0], i = t[1][1] - t[0][1], a = Math.min(r / (n[1][0] - n[0][0]), i / (n[1][1] - n[0][1])), o = +t[0][0] + (r - a * (n[1][0] + n[0][0])) / 2, s = +t[0][1] + (i - a * (n[1][1] + n[0][1])) / 2;
		e.scale(150 * a).translate([o, s]);
	}, n);
}
function en(e, t, n) {
	return $t(e, [[0, 0], t], n);
}
function tn(e, t, n) {
	return Qt(e, function(n) {
		var r = +t, i = r / (n[1][0] - n[0][0]), a = (r - i * (n[1][0] + n[0][0])) / 2, o = -i * n[0][1];
		e.scale(150 * i).translate([a, o]);
	}, n);
}
function nn(e, t, n) {
	return Qt(e, function(n) {
		var r = +t, i = r / (n[1][1] - n[0][1]), a = -i * n[0][0], o = (r - i * (n[1][1] + n[0][1])) / 2;
		e.scale(150 * i).translate([a, o]);
	}, n);
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/projection/resample.js
var rn = 16, an = G(30 * H);
function on(e, t) {
	return +t ? cn(e, t) : sn(e);
}
function sn(e) {
	return Xt({ point: function(t, n) {
		t = e(t, n), this.stream.point(t[0], t[1]);
	} });
}
function cn(e, t) {
	function n(r, i, a, o, s, c, l, u, d, f, p, m, h, g) {
		var _ = l - r, v = u - i, y = _ * _ + v * v;
		if (y > 4 * t && h--) {
			var b = o + f, x = s + p, S = c + m, C = q(b * b + x * x + S * S), w = le(S /= C), T = U(U(S) - 1) < 1e-6 || U(a - d) < 1e-6 ? (a + d) / 2 : W(x, b), E = e(T, w), D = E[0], O = E[1], k = D - r, A = O - i, j = v * k - _ * A;
			(j * j / y > t || U((_ * k + v * A) / y - .5) > .3 || o * f + s * p + c * m < an) && (n(r, i, a, o, s, c, D, O, T, b /= C, x /= C, S, h, g), g.point(D, O), n(D, O, T, b, x, S, l, u, d, f, p, m, h, g));
		}
	}
	return function(t) {
		var r, i, a, o, s, c, l, u, d, f, p, m, h = {
			point: g,
			lineStart: _,
			lineEnd: y,
			polygonStart: function() {
				t.polygonStart(), h.lineStart = b;
			},
			polygonEnd: function() {
				t.polygonEnd(), h.lineStart = _;
			}
		};
		function g(n, r) {
			n = e(n, r), t.point(n[0], n[1]);
		}
		function _() {
			u = NaN, h.point = v, t.lineStart();
		}
		function v(r, i) {
			var a = _e([r, i]), o = e(r, i);
			n(u, d, l, f, p, m, u = o[0], d = o[1], l = r, f = a[0], p = a[1], m = a[2], rn, t), t.point(u, d);
		}
		function y() {
			h.point = g, t.lineEnd();
		}
		function b() {
			_(), h.point = x, h.lineEnd = S;
		}
		function x(e, t) {
			v(r = e, t), i = u, a = d, o = f, s = p, c = m, h.point = v;
		}
		function S() {
			n(u, d, l, f, p, m, i, a, r, o, s, c, rn, t), h.lineEnd = y, y();
		}
		return h;
	};
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/projection/index.js
var ln = Xt({ point: function(e, t) {
	this.stream.point(e * H, t * H);
} });
function un(e) {
	return Xt({ point: function(t, n) {
		var r = e(t, n);
		return this.stream.point(r[0], r[1]);
	} });
}
function dn(e, t, n, r, i) {
	function a(a, o) {
		return a *= r, o *= i, [t + e * a, n - e * o];
	}
	return a.invert = function(a, o) {
		return [(a - t) / e * r, (n - o) / e * i];
	}, a;
}
function fn(e, t, n, r, i, a) {
	if (!a) return dn(e, t, n, r, i);
	var o = G(a), s = K(a), c = o * e, l = s * e, u = o / e, d = s / e, f = (s * n - o * t) / e, p = (s * t + o * n) / e;
	function m(e, a) {
		return e *= r, a *= i, [c * e - l * a + t, n - l * e - c * a];
	}
	return m.invert = function(e, t) {
		return [r * (u * e - d * t + f), i * (p - d * e - u * t)];
	}, m;
}
function pn(e) {
	return mn(function() {
		return e;
	})();
}
function mn(e) {
	var t, n = 150, r = 480, i = 250, a = 0, o = 0, s = 0, c = 0, l = 0, u, d = 0, f = 1, p = 1, m = null, h = Ve, g = null, _, v, y, b = Xe, x = .5, S, C, w, T, E;
	function D(e) {
		return w(e[0] * H, e[1] * H);
	}
	function O(e) {
		return e = w.invert(e[0], e[1]), e && [e[0] * V, e[1] * V];
	}
	D.stream = function(e) {
		return T && E === e ? T : T = ln(un(u)(h(S(b(E = e)))));
	}, D.preclip = function(e) {
		return arguments.length ? (h = e, m = void 0, A()) : h;
	}, D.postclip = function(e) {
		return arguments.length ? (b = e, g = _ = v = y = null, A()) : b;
	}, D.clipAngle = function(e) {
		return arguments.length ? (h = +e ? Ge(m = e * H) : (m = null, Ve), A()) : m * V;
	}, D.clipExtent = function(e) {
		return arguments.length ? (b = e == null ? (g = _ = v = y = null, Xe) : Ye(g = +e[0][0], _ = +e[0][1], v = +e[1][0], y = +e[1][1]), A()) : g == null ? null : [[g, _], [v, y]];
	}, D.scale = function(e) {
		return arguments.length ? (n = +e, k()) : n;
	}, D.translate = function(e) {
		return arguments.length ? (r = +e[0], i = +e[1], k()) : [r, i];
	}, D.center = function(e) {
		return arguments.length ? (a = e[0] % 360 * H, o = e[1] % 360 * H, k()) : [a * V, o * V];
	}, D.rotate = function(e) {
		return arguments.length ? (s = e[0] % 360 * H, c = e[1] % 360 * H, l = e.length > 2 ? e[2] % 360 * H : 0, k()) : [
			s * V,
			c * V,
			l * V
		];
	}, D.angle = function(e) {
		return arguments.length ? (d = e % 360 * H, k()) : d * V;
	}, D.reflectX = function(e) {
		return arguments.length ? (f = e ? -1 : 1, k()) : f < 0;
	}, D.reflectY = function(e) {
		return arguments.length ? (p = e ? -1 : 1, k()) : p < 0;
	}, D.precision = function(e) {
		return arguments.length ? (S = on(C, x = e * e), A()) : q(x);
	}, D.fitExtent = function(e, t) {
		return $t(D, e, t);
	}, D.fitSize = function(e, t) {
		return en(D, e, t);
	}, D.fitWidth = function(e, t) {
		return tn(D, e, t);
	}, D.fitHeight = function(e, t) {
		return nn(D, e, t);
	};
	function k() {
		var e = fn(n, 0, 0, f, p, d).apply(null, t(a, o)), m = fn(n, r - e[0], i - e[1], f, p, d);
		return u = Te(s, c, l), C = Ce(t, m), w = Ce(u, C), S = on(C, x), A();
	}
	function A() {
		return T = E = null, D;
	}
	return function() {
		return t = e.apply(this, arguments), D.invert = t.invert && O, k();
	};
}
//#endregion
//#region node_modules/.pnpm/d3-geo@3.1.1/node_modules/d3-geo/src/projection/equirectangular.js
function hn(e, t) {
	return [e, t];
}
hn.invert = hn;
function gn() {
	return pn(hn).scale(152.63);
}
//#endregion
//#region app/urf-3d/organic-terrain.ts
function _n(e, t, n, r, i, a = 1) {
	let o = ((r + 180) % 360 + 360) % 360 / 360 * t, s = l.clamp((90 - i) / 180 * (n - 1), 0, n - 1), c = Math.floor(o), u = Math.floor(s), d = o - c, f = s - u, p = (n, r) => e[(r * t + (n + t) % t) * a] || 0;
	return l.lerp(l.lerp(p(c, u), p(c + 1, u), d), l.lerp(p(c, Math.min(n - 1, u + 1)), p(c + 1, Math.min(n - 1, u + 1)), d), f);
}
async function vn() {
	if (typeof document > "u") return () => 0;
	try {
		let e = new Image();
		e.src = "/urf-data/elevation.jpg", await e.decode();
		let t = document.createElement("canvas");
		t.width = 2048, t.height = 1024;
		let n = t.getContext("2d", { willReadFrequently: !0 });
		n.drawImage(e, 0, 0, 2048, 1024);
		let r = n.getImageData(0, 0, 2048, 1024).data;
		return (e, t) => _n(r, 2048, 1024, e, t, 4) / 255;
	} catch {
		return () => 0;
	}
}
function yn(e, t, i, a, s = 96) {
	let c = new o(1, s), u = c.getAttribute("position"), d = [], m = [], h = [], g = /* @__PURE__ */ new Map(), _ = new r(), v = new r();
	for (let n = 0; n < u.count; n += 3) {
		v.set(0, 0, 0);
		for (let e = 0; e < 3; e++) v.add(_.fromBufferAttribute(u, n + e));
		v.normalize();
		let r = Math.atan2(v.x, v.z) * 180 / Math.PI, o = Math.asin(v.y) * 180 / Math.PI;
		if (!e.isLand(r, o)) continue;
		for (let r = 0; r < 3; r++) {
			_.fromBufferAttribute(u, n + r).normalize();
			let o = Math.atan2(_.x, _.z) * 180 / Math.PI, s = Math.asin(_.y) * 180 / Math.PI, c = e.isIce(o, s), p = t(o, s), g = a ? _n(a, 480, 240, o, s) : 0, v = Math.max(i + .003, i + .078 + p * .135 + g);
			d.push(_.x * v, _.y * v, _.z * v), h.push(o, s);
			let y = new f();
			c ? y.set("#c8eef1") : (y.set("#397c61").lerp(new f("#a9ab70"), l.smoothstep(p, .05, .45)), y.lerp(new f("#bcb6a1"), l.smoothstep(p, .35, .72)), y.lerp(new f("#eee6d7"), l.smoothstep(p, .75, 1))), m.push(y.r, y.g, y.b);
		}
		let s = d.length - 9, c = m.length - 9, p = h.length - 6;
		for (let e = 0; e < 3; e++) {
			let t = (e + 1) % 3, n = d.slice(s + e * 3, s + e * 3 + 3), r = d.slice(s + t * 3, s + t * 3 + 3), i = [n.map((e) => e.toFixed(5)).join(","), r.map((e) => e.toFixed(5)).join(",")].sort().join("|"), a = g.get(i);
			a ? a.count++ : g.set(i, {
				a: n,
				b: r,
				ca: m.slice(c + e * 3, c + e * 3 + 3),
				cb: m.slice(c + t * 3, c + t * 3 + 3),
				xy: [...h.slice(p + e * 2, p + e * 2 + 2), ...h.slice(p + t * 2, p + t * 2 + 2)],
				count: 1
			});
		}
	}
	for (let e of g.values()) {
		if (e.count !== 1) continue;
		let t = new r(...e.a).normalize().multiplyScalar(i + .001).toArray(), n = new r(...e.b).normalize().multiplyScalar(i + .001).toArray();
		for (let [r, i, a] of [
			[
				e.a,
				e.ca,
				e.xy.slice(0, 2)
			],
			[
				t,
				e.ca,
				e.xy.slice(0, 2)
			],
			[
				e.b,
				e.cb,
				e.xy.slice(2)
			],
			[
				e.b,
				e.cb,
				e.xy.slice(2)
			],
			[
				t,
				e.ca,
				e.xy.slice(0, 2)
			],
			[
				n,
				e.cb,
				e.xy.slice(2)
			]
		]) d.push(...r), m.push(...i.map((e) => e * .49)), h.push(...a);
	}
	c.dispose();
	let y = new p();
	return y.setAttribute("position", new n(d, 3)), y.setAttribute("color", new n(m, 3)), y.computeVertexNormals(), {
		geometry: y,
		coords: h
	};
}
//#endregion
//#region app/brain-room/lib/dreamscape.ts
var bn = /* @__PURE__ */ a({ makeDreamscape: () => xn });
function xn(n = {}) {
	let a = new t();
	a.name = "Crystal hinterland and orbital sky";
	let o = new s({
		side: 2,
		uniforms: { time: { value: 0 } },
		vertexShader: "uniform float time;varying vec3 p;void main(){p=position;vec3 q=position;q.y+=sin(time*.45+length(position.xz)*.7)*.06;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}",
		fragmentShader: "varying vec3 p;uniform float time;void main(){float a=atan(p.z,p.x),r=length(p.xz);float v=sin(a*7.+r*3.-time*.5+sin(p.y*4.+time)*2.);vec3 col=.5+.5*cos(vec3(0.,2.1,4.2)+v*3.+r*.6+time*.15);gl_FragColor=vec4(col*.85+.1,1.);}"
	}), l = [];
	for (let [n, s, f, p] of [
		[
			51,
			-42,
			8,
			4.7
		],
		[
			44,
			-64,
			11,
			6
		],
		[
			-50,
			-62,
			9,
			5
		],
		[
			-62,
			-38,
			6,
			3.5
		],
		[
			19,
			-76,
			6.5,
			4
		],
		[
			53,
			-19,
			8,
			4.5
		]
	]) {
		let m = new t();
		m.position.set(n, 0, s), a.add(m), l.push(m);
		let g = new e(new i(new d([
			new r(),
			new r(-f * .05, f * .35, .15),
			new r(f * .03, f * .7, -.15),
			new r(f * .07, f, 0)
		]), 48, .5, 20, !1), new h({
			color: 11710650,
			roughness: .75
		}));
		m.add(g);
		let _ = new e(new c(p, 72, 40, 0, Math.PI * 2, 0, Math.PI * .55), o), v = _.geometry.getAttribute("position");
		for (let e = 0; e < v.count; e++) {
			let t = v.getX(e), n = v.getZ(e), r = Math.atan2(n, t);
			v.setY(e, v.getY(e) + (Math.sin(r * 5 + p) * .14 + Math.cos(r * 3) * .19) * Math.hypot(t, n) / p), v.setX(e, t * (1 + Math.sin(r * 3 + p) * .055));
		}
		_.geometry.computeVertexNormals(), _.position.set(f * .07, f, 0), _.scale.y = .55, m.add(_);
		let y = new e(new u(p * .95, .65, 48, 1, !0), new h({
			color: 12223455,
			emissive: 9518781,
			emissiveIntensity: .25,
			side: 2
		}));
		y.position.set(f * .07, f - .25, 0), m.add(y);
	}
	if (n.mushroomOnly) {
		let e = l[0];
		return e.removeFromParent(), {
			root: e,
			planet: new t(),
			satellites: [],
			dispose: () => {},
			update: (t) => {
				o.uniforms.time.value = t, e.rotation.z = Math.sin(t * .35) * .015;
			}
		};
	}
	let f = new t();
	f.name = "Urf and its archer beyond the atmosphere", f.position.set(58, 64, -150), f.scale.setScalar(16), a.add(f);
	let p = new t();
	p.position.x = 1.3, f.add(p);
	let g = D();
	p.add(new e(new c(1.25, 48, 32), g));
	let _ = !1;
	typeof document < "u" && Promise.all([fetch("/ne-110m-land.geojson").then((e) => e.json()), vn()]).then(([t, n]) => {
		if (_) return;
		let r = document.createElement("canvas");
		r.width = 1024, r.height = 512;
		let i = r.getContext("2d");
		i.fillStyle = "#fff";
		let a = Yt(gn().scale(1024 / (Math.PI * 2)).translate([512, 256]), i);
		i.beginPath(), a(t), i.fill();
		let o = i.getImageData(0, 0, 1024, 512).data, { geometry: s } = yn({
			isLand: (e, t) => o[(Math.min(511, Math.floor((90 - t) / 180 * 512)) * 1024 + Math.min(1023, Math.floor((e + 180) / 360 * 1024))) * 4 + 3] > 100,
			isIce: (e, t) => Math.abs(t) > 72
		}, n, 1.25, void 0, 34);
		p.add(new e(s, new h({
			vertexColors: !0,
			roughness: .85,
			flatShading: !0,
			fog: !1
		})));
	}).catch(() => {});
	let v = O();
	v.group.position.set(-1.9, -.65, 0), v.group.scale.setScalar(.7), f.add(v.group);
	let y = ee("zix");
	y.root.scale.setScalar(.47), y.root.position.set(-1.9, -.65, 0), y.root.rotation.y = Math.PI / 2, y.ak.root.visible = !1, y.revolver.root.visible = !1, y.gunMount.visible = !1, y.root.add(y.bow.root), y.bow.root.position.set(.45, 1.25, .13), y.armL.rotation.z = -1.1, y.armR.rotation.x = -1, f.add(y.root), f.traverse((t) => {
		if (t instanceof e) for (let e of Array.isArray(t.material) ? t.material : [t.material]) e.fog = !1;
	});
	let b = [], x = new h({
		color: 10600394,
		metalness: .8,
		roughness: .3
	}), S = new h({
		color: 2178438,
		metalness: .55,
		roughness: .35
	});
	for (let n = 0; n < 2; n++) {
		let n = new t(), r = new e(new m(1.2, .8, .8), x);
		n.add(r);
		for (let t of [-1, 1]) {
			let r = new e(new m(2.2, .05, 1.6), S);
			r.position.x = t * 1.7, n.add(r);
		}
		let i = new e(new c(.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), x);
		i.position.y = .5, n.add(i), a.add(n), b.push(n);
	}
	return {
		root: a,
		planet: p,
		satellites: b,
		dispose: () => {
			_ = !0;
		},
		update: (e) => {
			o.uniforms.time.value = e, g.uniforms.time.value = e, p.rotation.set(e * .025, e * .05, .2), l.forEach((t, n) => t.rotation.z = Math.sin(e * .35 + n) * .015), b.forEach((t, n) => {
				let r = e * .05 + n * Math.PI;
				t.position.set(Math.cos(r) * 90, 38 + Math.sin(r * .7) * 12, Math.sin(r) * 85 - 20), t.rotation.set(.2, r, .2);
			});
		}
	};
}
//#endregion
export { re as i, xn as n, ee as r, bn as t };
