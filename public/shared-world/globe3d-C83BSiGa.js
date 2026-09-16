import { Gt as e } from "./three.module-h2PuqYDi.js";
import "./WorldSimulation-O9Gd1zEA.js";
import { r as t } from "./dreamscape-BAEaW25a.js";
new e(1.12, .23, -.5);
//#endregion
//#region app/lib/territories.ts
var n = [
	{
		name: "Antarctica",
		pin: !1,
		unlocked: !0,
		center: [0, -84],
		west: -180,
		east: 180,
		south: -90,
		north: -60
	},
	{
		name: "Madagascar",
		pin: !0,
		unlocked: !1,
		center: [47, -19],
		west: 43,
		east: 51,
		south: -26,
		north: -11.5
	},
	{
		name: "Israel",
		pin: !1,
		unlocked: !1,
		center: [35.2, 31.5],
		west: 34.1,
		east: 35.9,
		south: 29.4,
		north: 33.5
	},
	{
		name: "Saudi",
		pin: !1,
		unlocked: !1,
		center: [45, 24],
		west: 34.4,
		east: 55.7,
		south: 16.2,
		north: 32.3
	},
	{
		name: "Persian Wasteland",
		pin: !1,
		unlocked: !1,
		center: [53.5, 32.5],
		west: 44,
		east: 63.4,
		south: 24.8,
		north: 39.9
	},
	{
		name: "The Great Free Democratic People Republic of North Korea",
		pin: !1,
		unlocked: !1,
		center: [127.2, 40.2],
		west: 124.1,
		east: 130.8,
		south: 37.6,
		north: 43.1
	},
	{
		name: "South Korea",
		pin: !1,
		unlocked: !1,
		center: [127.8, 36.4],
		west: 125,
		east: 129.7,
		south: 33.1,
		north: 38.7
	},
	{
		name: "Japan",
		pin: !1,
		unlocked: !1,
		center: [138.2, 36.5],
		west: 129.3,
		east: 146.2,
		south: 30.2,
		north: 45.6
	},
	{
		name: "Himalayas",
		pin: !0,
		unlocked: !1,
		center: [84, 29.5],
		west: 72.5,
		east: 96.2,
		south: 26.4,
		north: 37.2
	},
	{
		name: "India",
		pin: !0,
		unlocked: !1,
		center: [79, 22],
		west: 68,
		east: 89.5,
		south: 6.6,
		north: 35.6
	},
	{
		name: "Southeast Asia",
		pin: !0,
		unlocked: !1,
		center: [115, 8],
		west: 92,
		east: 141,
		south: -11.2,
		north: 23.4
	},
	{
		name: "China",
		pin: !0,
		unlocked: !1,
		center: [104, 35],
		west: 73.4,
		east: 134.8,
		south: 18.1,
		north: 53.6
	},
	{
		name: "Australia",
		pin: !0,
		unlocked: !1,
		center: [134, -25],
		west: 112,
		east: 154,
		south: -44,
		north: -10
	},
	{
		name: "Middle East",
		pin: !0,
		unlocked: !1,
		center: [44, 28],
		west: 32,
		east: 65,
		south: 12,
		north: 42
	},
	{
		name: "Europe",
		pin: !0,
		unlocked: !1,
		center: [15, 50],
		west: -11,
		east: 40,
		south: 35,
		north: 72
	},
	{
		name: "Africa",
		pin: !0,
		unlocked: !1,
		center: [19, 4],
		west: -18,
		east: 52,
		south: -35,
		north: 37.5
	},
	{
		name: "North America",
		pin: !0,
		unlocked: !1,
		center: [-100, 45],
		west: -168,
		east: -52,
		south: 14,
		north: 84
	},
	{
		name: "South America",
		pin: !0,
		unlocked: !1,
		center: [-60, -17],
		west: -82,
		east: -34,
		south: -56,
		north: 13
	},
	{
		name: "Russia",
		pin: !0,
		unlocked: !1,
		center: [90, 62],
		west: 27,
		east: -169,
		south: 46,
		north: 82
	},
	{
		name: "Asia",
		pin: !0,
		unlocked: !1,
		center: [90, 40],
		west: 60,
		east: 150,
		south: 5,
		north: 56
	}
];
n.map((e) => ({
	name: e.name,
	center: e.center,
	unlocked: e.unlocked
})), n.filter((e) => e.pin && !e.unlocked);
function r(e, n = "original") {
	let r = t(n === "doop" ? "pip" : n === "zorp" ? "vex" : "zix"), i = r.bow.root;
	r.root.add(i), i.scale.setScalar(.9), i.children.find((t) => t instanceof e.Line)?.removeFromParent();
	let a = i.children.find((t) => t instanceof e.Group), o = new e.MeshBasicMaterial({ color: 16314367 }), s = new e.Mesh(new e.CylinderGeometry(.003, .003, 1, 5), o), c = s.clone();
	i.add(s, c);
	let l = new e.Object3D();
	i.add(l), r.ak.root.visible = !1, r.revolver.root.visible = !1, r.bow.flash.visible = !1;
	let u = r.quiverMount, d = new e.Mesh(new e.CylinderGeometry(.085, .06, .42, 8), new e.MeshStandardMaterial({
		color: 4794434,
		flatShading: !0
	}));
	u.add(d);
	for (let t = 0; t < 5; t++) {
		let n = new e.Mesh(new e.CylinderGeometry(.009, .009, .55, 5), new e.MeshStandardMaterial({ color: 10383961 }));
		n.position.set((t - 2) * .027, .18, 0), u.add(n);
		let r = new e.Mesh(new e.ConeGeometry(.026, .12, 3), new e.MeshStandardMaterial({ color: 12477678 }));
		r.position.copy(n.position), r.position.y += .22, u.add(r);
	}
	return {
		group: r.root,
		body: r.hips,
		torso: r.torso,
		head: r.head,
		frontLeg: {
			hip: r.legR,
			knee: r.shinR
		},
		backLeg: {
			hip: r.legL,
			knee: r.shinL
		},
		bowArm: {
			shoulder: r.armL,
			elbow: r.forearmL
		},
		drawArm: {
			shoulder: r.armR,
			elbow: r.forearmR
		},
		gunArm: {
			shoulder: r.armR,
			elbow: r.forearmR
		},
		bow: i,
		quiver: u,
		revolver: r.revolver.root,
		ak47: r.ak.root,
		muzzle: r.bow.muzzle,
		stringUpper: s,
		stringLower: c,
		nockedArrow: a,
		nock: l
	};
}
function i(e) {
	let t = new e.Group(), n = new e.MeshStandardMaterial({
		color: 14214898,
		flatShading: !0,
		roughness: .42,
		metalness: .55
	}), r = new e.MeshStandardMaterial({
		color: 2058960,
		flatShading: !0,
		roughness: .3,
		metalness: .65
	}), i = new e.MeshStandardMaterial({
		color: 16732013,
		emissive: 16722509,
		emissiveIntensity: 2.2,
		roughness: .4
	}), a = new e.Mesh(new e.BoxGeometry(.075, .06, .09), n);
	t.add(a), [-1, 1].forEach((i) => {
		let a = new e.Mesh(new e.BoxGeometry(.13, .007, .062), r);
		a.position.x = i * .106, t.add(a);
		let o = new e.Mesh(new e.BoxGeometry(.045, .008, .008), n);
		o.position.x = i * .06, t.add(o);
	});
	let o = new e.Mesh(new e.ConeGeometry(.035, .045, 8, 1, !0), n);
	o.rotation.x = Math.PI * .62, o.position.set(0, -.03, .05), t.add(o);
	let s = new e.Mesh(new e.CylinderGeometry(.004, .004, .08, 4), n);
	s.position.y = .06, t.add(s);
	let c = new e.Mesh(new e.IcosahedronGeometry(.011, 0), i);
	return c.position.set(0, .1, 0), t.add(c), {
		group: t,
		light: c,
		beacon: i
	};
}
function a(e, t) {
	let n = new e.MeshStandardMaterial({
		color: 14214898,
		flatShading: !0,
		roughness: .42,
		metalness: .55
	}), r = new e.MeshStandardMaterial({
		color: 16753212,
		flatShading: !0,
		roughness: .3,
		metalness: .6
	}), i = new e.MeshStandardMaterial({
		color: 3686473,
		flatShading: !0,
		roughness: .5,
		metalness: .4,
		emissive: 2780159,
		emissiveIntensity: .6
	}), a = new e.Group();
	if (t === "thrusters") [-1, 1].forEach((t) => {
		let n = new e.Mesh(new e.ConeGeometry(.018, .05, 6), i);
		n.position.set(t * .03, -.045, -.05), n.rotation.x = Math.PI, a.add(n);
	});
	else if (t === "big-dish") {
		let t = new e.Mesh(new e.ConeGeometry(.06, .05, 10, 1, !0), n);
		t.rotation.x = Math.PI * .62, t.position.set(0, .05, .07), a.add(t);
	} else t === "extra-panels" && [-1, 1].forEach((t) => {
		let n = new e.Mesh(new e.BoxGeometry(.09, .006, .05), r);
		n.position.set(t * .19, .03, 0), a.add(n);
	});
	return a;
}
function o(e) {
	let t = new e.MeshStandardMaterial({
		color: 13620184,
		flatShading: !0,
		roughness: 1,
		metalness: 0
	}), n = new e.MeshStandardMaterial({
		color: 10133156,
		flatShading: !0,
		roughness: 1
	}), r = new e.Group(), i = new e.Mesh(new e.IcosahedronGeometry(.22, 1), t);
	return r.add(i), [
		[
			.12,
			.08,
			.19,
			.05
		],
		[
			-.1,
			-.05,
			.2,
			.04
		],
		[
			.02,
			.16,
			-.15,
			.06
		],
		[
			-.14,
			.02,
			-.16,
			.045
		],
		[
			.15,
			-.13,
			-.08,
			.035
		]
	].forEach(([t, i, a, o]) => {
		let s = new e.Mesh(new e.CircleGeometry(o, 8), n);
		s.position.set(t, i, a), s.lookAt(t * 2, i * 2, a * 2), r.add(s);
	}), {
		group: r,
		body: i
	};
}
function s(e) {
	let t = new e.MeshStandardMaterial({
		color: 9414328,
		flatShading: !0,
		roughness: .35,
		metalness: .7
	}), n = new e.MeshStandardMaterial({
		color: 10217727,
		flatShading: !0,
		roughness: .15,
		metalness: .2,
		transparent: !0,
		opacity: .75
	}), r = new e.MeshBasicMaterial({
		color: 10354608,
		transparent: !0,
		opacity: .5
	}), i = new e.Group(), a = new e.Mesh(new e.CylinderGeometry(.09, .13, .03, 12), t);
	i.add(a);
	let o = new e.Mesh(new e.SphereGeometry(.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), n);
	o.position.y = .02, i.add(o);
	let s = new e.Mesh(new e.ConeGeometry(.05, .16, 10, 1, !0), r);
	return s.position.y = -.1, s.rotation.x = Math.PI, i.add(s), {
		group: i,
		beam: s
	};
}
function c(e) {
	let t = new e.MeshStandardMaterial({
		color: 5913130,
		flatShading: !0,
		roughness: .95,
		emissive: 16734751,
		emissiveIntensity: .9
	}), n = new e.MeshBasicMaterial({
		color: 16753479,
		transparent: !0,
		opacity: .55
	}), r = new e.Group(), i = new e.Mesh(new e.IcosahedronGeometry(.035, 0), t);
	r.add(i);
	let a = new e.Mesh(new e.ConeGeometry(.03, .5, 6, 1, !0), n);
	return a.position.z = .28, a.rotation.x = -Math.PI / 2, r.add(a), r;
}
//#endregion
export { r as buildAlien, c as buildMeteorTrail, o as buildMoon, i as buildSatellite, a as buildSatelliteUpgrade, s as buildUfo };
