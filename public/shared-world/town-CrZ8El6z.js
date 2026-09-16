import { $ as e, D as t, Dt as n, Et as r, Gt as i, Lt as a, Pt as o, Rt as s, Vt as c, _ as l, kt as u, m as d, o as f, ot as p, p as m, u as h, w as g, y as _ } from "./three.module-h2PuqYDi.js";
//#region app/world/models/town.ts
var v = (e, t = .78, n = .02) => new p({
	color: e,
	roughness: t,
	metalness: n,
	flatShading: !0
});
function y(e) {
	let t = Math.sin(e * 12.9898) * 43758.5453;
	return t - Math.floor(t);
}
function b(e) {
	let t = document.createElement("canvas");
	t.width = 256, t.height = 256;
	let n = t.getContext("2d"), i = n.createImageData(256, 256);
	for (let t = 0; t < 256; t += 1) for (let n = 0; n < 256; n += 1) {
		let r = y(e + n * .05 + t * .05 * 1.7), a = y(e + 91 + n * .4 + t * .4 * 2.3), o = Math.round((r * .65 + a * .35) * 255), s = (t * 256 + n) * 4;
		i.data[s] = o, i.data[s + 1] = o, i.data[s + 2] = o, i.data[s + 3] = 255;
	}
	n.putImageData(i, 0, 0);
	let a = new h(t);
	return a.wrapS = r, a.wrapT = r, a.repeat.set(6, 6), a;
}
function x(t, n, r, i, a = [
	0,
	0,
	0
]) {
	let o = new e(new f(...n), v(i));
	return o.position.set(...r), o.rotation.set(...a), o.castShadow = !0, o.receiveShadow = !0, t.add(o), o;
}
function S(t, n, r, i, a, o, s = [
	0,
	0,
	0
], c = 12) {
	let l = new e(new _(n, r, i, c), v(o));
	return l.position.set(...a), l.rotation.set(...s), l.castShadow = !0, l.receiveShadow = !0, t.add(l), l;
}
function C(t, n, r, i, a = [
	1,
	1,
	1
]) {
	let s = new e(new o(n, 18, 12), v(i));
	return s.position.set(...r), s.scale.set(...a), s.castShadow = !0, s.receiveShadow = !0, t.add(s), s;
}
function w(e, t, n, r, a) {
	let o = t.clone().add(n).multiplyScalar(.5), s = S(e, r, r, t.distanceTo(n), [
		o.x,
		o.y,
		o.z
	], a, [
		0,
		0,
		0
	], 8);
	return s.quaternion.setFromUnitVectors(new i(0, 1, 0), n.clone().sub(t).normalize()), s;
}
function T(e, t) {
	let r = document.createElement("canvas");
	r.width = 512, r.height = 112;
	let i = r.getContext("2d");
	i.fillStyle = "rgba(4, 12, 23, .91)", i.beginPath(), i.roundRect(4, 4, 504, 104, 18), i.fill(), i.strokeStyle = t, i.lineWidth = 6, i.stroke(), i.fillStyle = t, i.font = "900 34px Arial", i.textAlign = "center", i.textBaseline = "middle", i.fillText(e, 256, 56);
	let o = new h(r);
	o.colorSpace = n;
	let c = new a(new s({
		map: o,
		transparent: !0,
		depthTest: !0,
		depthWrite: !1
	}));
	return c.scale.set(3.35, .74, 1), c.renderOrder = 20, c;
}
function E(e) {
	let t = document.createElement("canvas");
	t.width = 512, t.height = 256;
	let i = t.getContext("2d");
	e.forEach((n, r) => {
		i.fillStyle = n, i.fillRect(r / e.length * t.width, 0, t.width / e.length + 1, t.height);
	});
	let a = new h(t);
	return a.colorSpace = n, a.wrapS = r, a;
}
function D() {
	let e = document.createElement("canvas");
	e.width = 512, e.height = 512;
	let t = e.getContext("2d");
	t.fillStyle = "#eef8ff", t.fillRect(0, 0, 512, 512);
	for (let e = 0; e < 8; e += 1) {
		let n = e * 64, r = 7 + e, i = e % 2 * (512 / r / 2);
		for (let a = 0; a < r; a += 1) {
			let o = a / r * 512 + i, s = .92 + y(e * 13.7 + a * 3.1) * .1;
			t.fillStyle = `rgba(${Math.round(214 * s)},${Math.round(236 * s)},${Math.round(250 * s)},1)`, t.fillRect(o, n, 512 / r + 1, 65);
		}
		t.strokeStyle = "rgba(120,172,201,.55)", t.lineWidth = 3, t.beginPath(), t.moveTo(0, n), t.lineTo(512, n), t.stroke();
		for (let e = 0; e <= r; e += 1) {
			let a = (e / r * 512 + i) % 512;
			t.beginPath(), t.moveTo(a, n), t.lineTo(a, n + 64), t.stroke();
		}
	}
	let i = new h(e);
	return i.wrapS = r, i.wrapT = d, i.colorSpace = n, i;
}
function O(e, t) {
	let r = document.createElement("canvas");
	r.width = 256, r.height = 256;
	let i = r.getContext("2d");
	for (let n = 0; n < 9; n += 1) i.fillStyle = n % 2 ? e : t, i.fillRect(0, n / 9 * 256, 256, 29.444444444444443);
	i.strokeStyle = "rgba(0,0,0,.28)", i.lineWidth = 2;
	for (let e = 0; e <= 9; e += 1) i.beginPath(), i.moveTo(0, e / 9 * 256), i.lineTo(256, e / 9 * 256), i.stroke();
	for (let e = 0; e < 60; e += 1) i.fillStyle = "rgba(0,0,0,.07)", i.fillRect(y(e) * 256, y(e + 50) * 256, 8 + y(e + 90) * 26, 1.4);
	let a = new h(r);
	return a.colorSpace = n, a;
}
function k(t, n, r, i, a) {
	for (let o = 0; o < i; o += 1) {
		let s = (o + .5) / i, c = n.clone().lerp(r, s);
		c.y -= Math.sin(s * Math.PI) * .05;
		let u = new e(new l(.055, .14, 3), v(a[o % a.length]));
		u.rotation.z = Math.PI, u.rotation.y = Math.PI / 2, u.position.copy(c), u.castShadow = !0, t.add(u);
	}
	let o = w(t, n, r, .012, 3813926);
	o.castShadow = !1;
}
function A() {
	let n = new t(), r = 1416112;
	S(n, .23, .32, 2.3, [
		0,
		.72,
		0
	], r, [
		Math.PI / 2,
		0,
		0
	], 18), C(n, .33, [
		0,
		.72,
		-1.12
	], 16050116, [
		1,
		1,
		.75
	]), C(n, .25, [
		0,
		.73,
		.98
	], r, [
		1,
		1,
		1.4
	]), x(n, [
		2.75,
		.09,
		.58
	], [
		0,
		1.24,
		-.03
	], 16247505), x(n, [
		2.45,
		.09,
		.5
	], [
		0,
		.43,
		-.08
	], r);
	for (let e of [-.95, .95]) for (let t of [-.2, .22]) w(n, new i(e, .47, t), new i(e, 1.2, t), .025, 15259043);
	x(n, [
		.9,
		.07,
		.35
	], [
		0,
		.83,
		1.18
	], 16247505), x(n, [
		.06,
		.58,
		.4
	], [
		0,
		1.04,
		1.15
	], r), x(n, [
		.07,
		1.34,
		.08
	], [
		0,
		.72,
		-1.46
	], 12090165, [
		0,
		0,
		Math.PI / 4
	]), x(n, [
		.07,
		1.34,
		.08
	], [
		0,
		.72,
		-1.46
	], 12090165, [
		0,
		0,
		-Math.PI / 4
	]);
	for (let e of [-.54, .54]) x(n, [
		.14,
		.12,
		1.35
	], [
		e,
		.12,
		.08
	], 12090165, [
		0,
		0,
		e > 0 ? -.08 : .08
	]);
	C(n, .2, [
		0,
		.93,
		.15
	], 1586243, [
		1.25,
		.75,
		1
	]);
	let a = new e(new f(.5, .16, .02), new p({
		color: 12576754,
		roughness: .15,
		metalness: .3,
		transparent: !0,
		opacity: .55
	}));
	a.position.set(0, 1.02, .34), n.add(a);
	let o = new e(new m(.62, 20), new p({
		color: 14211288,
		transparent: !0,
		opacity: .22,
		side: 2
	}));
	return o.position.set(0, .72, -1.5), o.userData.spinPhase = 0, n.add(o), n;
}
function j(e, t) {
	let i = document.createElement("canvas");
	i.width = 256, i.height = 256;
	let a = i.getContext("2d");
	a.fillStyle = e, a.fillRect(0, 0, 256, 256);
	for (let e = 0; e < 4; e += 1) {
		let n = (e + .5) * (256 / 4);
		for (let r = 0; r < 10; r += 1) {
			let i = (r + e % 2 * .5) / 10 * 256;
			a.beginPath(), a.arc(i, n, 3.4, 0, Math.PI * 2), a.fillStyle = t, a.fill();
		}
	}
	let o = new h(i);
	return o.wrapS = r, o.wrapT = r, o.repeat.set(3, 1), o.colorSpace = n, o;
}
function M(n) {
	let r = new t(), i = n ? 11454161 : 14001733;
	S(r, 1, 1.12, .28, [
		0,
		.14,
		0
	], 7356705, [
		0,
		0,
		0
	], 18), S(r, .72, .82, .9, [
		0,
		.65,
		0
	], 8474669, [
		0,
		0,
		0
	], 18);
	for (let e of [-.52, .52]) x(r, [
		.18,
		1.35,
		.24
	], [
		e,
		1.2,
		0
	], 8409134, [
		0,
		0,
		e * .14
	]);
	x(r, [
		.16,
		1.32,
		.2
	], [
		0,
		1.16,
		.58
	], 8014377, [
		-.16,
		0,
		0
	]);
	let a = new t(), o = new e(new _(.34, .41, 1.85, 18, 1, !1), new p({
		map: j(n ? "#3a4d61" : "#8b522d", n ? "#dbe8ee" : "#f0d488"),
		roughness: .55,
		metalness: n ? .55 : .12,
		flatShading: !1
	}));
	o.rotation.z = Math.PI / 2, o.castShadow = !0, a.add(o), S(a, .46, .46, .16, [
		-.92,
		0,
		0
	], i, [
		0,
		0,
		Math.PI / 2
	], 18), S(a, .39, .39, .1, [
		.88,
		0,
		0
	], i, [
		0,
		0,
		Math.PI / 2
	], 18), S(a, .16, .19, .22, [
		-1.05,
		0,
		0
	], 14263855, [
		0,
		0,
		Math.PI / 2
	], 10), a.position.set(0, 1.72, 0), a.rotation.z = .35, r.add(a), x(r, [
		.13,
		1.45,
		.13
	], [
		0,
		1.12,
		0
	], i, [
		0,
		0,
		-.35
	]);
	let s = new t();
	S(s, .02, .02, 1.3, [
		0,
		.65,
		0
	], 4864548, [
		0,
		0,
		0
	], 6);
	let c = new e(new l(.11, .3, 3), v(14498356));
	return c.rotation.z = Math.PI / 2, c.rotation.y = Math.PI / 2, c.position.set(.14, 1.16, 0), s.add(c), s.position.set(.78, 0, .72), r.add(s), r;
}
function N() {
	let n = new t(), r = E([
		"#dd3a34",
		"#f6c637",
		"#1574bc",
		"#f6c637",
		"#dd3a34",
		"#1574bc"
	]), a = new e(new _(.95, 1.12, 1.05, 20, 1, !0), new p({
		map: r,
		roughness: .82,
		side: 2
	}));
	a.position.y = .55, a.castShadow = !0, n.add(a);
	let o = new e(new l(1.25, 1.35, 24), new p({
		map: r,
		roughness: .8
	}));
	o.position.y = 1.72, o.castShadow = !0, n.add(o), S(n, .035, .035, .8, [
		0,
		2.72,
		0
	], 14263855, [
		0,
		0,
		0
	], 8), x(n, [
		.78,
		.34,
		.04
	], [
		.38,
		2.93,
		0
	], 14629940, [
		0,
		0,
		-.12
	]), x(n, [
		.42,
		.68,
		.08
	], [
		0,
		.37,
		-1.01
	], 1322585);
	for (let e of [
		0,
		Math.PI / 2,
		Math.PI,
		Math.PI * 1.5
	]) S(n, .035, .035, 1.5, [
		Math.cos(e) * 1.16,
		.75,
		Math.sin(e) * 1.16
	], 14263855, [
		0,
		0,
		0
	], 8);
	let s = 1.28;
	for (let e = 0; e < 8; e += 1) {
		let t = e / 8 * Math.PI * 2, r = (e + 1) / 8 * Math.PI * 2;
		k(n, new i(Math.cos(t) * 1.02, s, Math.sin(t) * 1.02), new i(Math.cos(r) * 1.02, s, Math.sin(r) * 1.02), 2, [
			14498356,
			16172599,
			1406140
		]);
	}
	return n;
}
function P() {
	let n = new t(), r = 9422301, i = D(), a = new p({
		map: i,
		bumpMap: b(1971),
		bumpScale: .05,
		roughness: .82,
		flatShading: !1
	}), s = new e(new o(1.03, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), a);
	s.position.y = 0, s.castShadow = !0, s.receiveShadow = !0, n.add(s);
	for (let t of [
		.23,
		.48,
		.73
	]) {
		let i = new e(new c(Math.sqrt(Math.max(.1, 1.03 * 1.03 - t * t)), .018, 5, 32), v(r));
		i.position.y = t, i.rotation.x = Math.PI / 2, n.add(i);
	}
	let l = x(n, [
		.7,
		.62,
		.78
	], [
		0,
		.31,
		-1.03
	], 15399167);
	l.material = new p({
		map: i,
		roughness: .85
	});
	let u = new t(), d = new e(new f(.4, .43, .06), new p({
		map: O("#7a4a29", "#6a3e21"),
		roughness: .78
	}));
	u.add(d);
	let h = new e(new m(.075, 16), new p({
		color: 794412,
		roughness: .3,
		metalness: .4
	}));
	h.position.set(.06, .08, .035), u.add(h);
	let g = new e(new c(.075, .014, 6, 16), v(2760726));
	g.position.set(.06, .08, .035), u.add(g);
	let _ = new e(new o(.02, 8, 6), v(3812378));
	_.position.set(-.12, -.02, .04), u.add(_), u.position.set(0, .24, -1.44), n.add(u);
	for (let e of [-.34, .34]) x(n, [
		.06,
		.54,
		.7
	], [
		e,
		.3,
		-1.07
	], r);
	return n;
}
function F() {
	let n = new t(), r = new p({
		map: O("#7c4327", "#6b3a21"),
		bumpMap: b(552),
		bumpScale: .04,
		roughness: .88
	}), a = new e(new f(1.85, 1.25, 1.45), r);
	a.position.set(0, .63, 0), a.castShadow = !0, a.receiveShadow = !0, n.add(a), x(n, [
		2.05,
		.16,
		1.35
	], [
		0,
		1.38,
		-.45
	], 2314109, [
		.55,
		0,
		0
	]), x(n, [
		2.05,
		.16,
		1.35
	], [
		0,
		1.38,
		.45
	], 2314109, [
		-.55,
		0,
		0
	]), x(n, [
		.42,
		.78,
		.05
	], [
		0,
		.39,
		-.74
	], 2430735);
	for (let e of [-.65, .65]) x(n, [
		.36,
		.35,
		.05
	], [
		e,
		.8,
		-.74
	], 6735842);
	let o = T("WORK HARD", "#ffcf5c");
	o.scale.set(1, .22, 1), o.position.set(0, 1.08, -.78), n.add(o), S(n, .19, .23, 1.42, [
		.62,
		1.88,
		.32
	], 6772298, [
		0,
		0,
		0
	], 10);
	for (let e = 0; e < 4; e += 1) {
		let t = C(n, .24 + e * .06, [
			.62 + e * .1,
			2.65 + e * .32,
			.32
		], 14213343, [
			1,
			.8,
			1
		]);
		t.userData.smokePhase = e * .8, t.userData.smokeBaseY = t.position.y;
	}
	for (let e = 0; e < 5; e += 1) x(n, [
		.42,
		.42,
		.42
	], [
		-.92 + e * .46,
		.21,
		.92
	], e % 2 ? 1795490 : 10894898);
	let s = 1.28;
	for (let e of [
		-1.2,
		-.6,
		0,
		.6,
		1.2
	]) S(n, .035, .04, .5, [
		e,
		.27,
		s
	], 4863008, [
		0,
		0,
		0
	], 6);
	for (let e of [.32, .46]) w(n, new i(-1.25, e, s), new i(1.25, e, s), .022, 5914920);
	for (let e of [-1.05, -.85]) S(n, .16, .18, .3, [
		e,
		.16,
		1.05
	], 5914920, [
		0,
		0,
		0
	], 10);
	return n;
}
function I() {
	let n = new t(), r = new u();
	r.moveTo(-1.5, 0), r.lineTo(1.25, 0), r.lineTo(1.55, .38), r.lineTo(-1.25, .52), r.closePath();
	let a = new g(r, {
		depth: 1.05,
		bevelEnabled: !0,
		bevelSize: .08,
		bevelThickness: .08,
		bevelSegments: 2
	});
	a.center();
	let o = new e(a, v(10433836));
	o.rotation.x = -Math.PI / 2, o.position.y = .42, o.castShadow = !0, n.add(o), x(n, [
		2.5,
		.14,
		1
	], [
		0,
		.78,
		0
	], 13080148), x(n, [
		.72,
		.67,
		.72
	], [
		.72,
		1.16,
		0
	], 15327687), x(n, [
		.74,
		.17,
		.76
	], [
		.72,
		1.53,
		0
	], 1921902);
	for (let [e, t, r] of [
		[
			-.78,
			-.27,
			2057638
		],
		[
			-.78,
			.27,
			11877171
		],
		[
			-.27,
			-.27,
			14723122
		],
		[
			-.27,
			.27,
			2057638
		]
	]) x(n, [
		.45,
		.38,
		.45
	], [
		e,
		1.05,
		t
	], r);
	S(n, .035, .035, 1.65, [
		.18,
		1.65,
		0
	], 5190948, [
		0,
		0,
		0
	], 8), x(n, [
		.04,
		.48,
		.68
	], [
		.2,
		2.06,
		0
	], 15585129);
	let s = new t();
	S(s, .045, .06, 1.5, [
		0,
		0,
		0
	], 2895667, [
		0,
		0,
		0
	], 8);
	let d = new i(0, .72, 0), f = new i(-.95, .34, 0);
	w(s, d, f, .035, 2895667), w(s, new i(0, .1, 0), f, .022, 5593953), w(s, f, new i(-.95, .05, 0), .012, 1842721);
	let p = new e(new c(.045, .012, 6, 10, Math.PI * 1.4), v(1842721));
	p.position.set(-.95, .04, 0), s.add(p), s.position.set(-.55, 1.55, -.32), n.add(s);
	let m = new e(new l(.09, .24, 3), v(14498356));
	return m.rotation.z = Math.PI / 2, m.rotation.y = Math.PI / 2, m.position.set(.13, 2.24, 0), m.userData.flagWave = !0, n.add(m), n;
}
function L() {
	let n = new t();
	x(n, [
		2.7,
		.34,
		2.05
	], [
		0,
		.17,
		0
	], 3950166), x(n, [
		2.35,
		.12,
		1.7
	], [
		0,
		.42,
		0
	], 1527192);
	let r = [
		[-1.14, -.82],
		[1.14, -.82],
		[-1.14, .82],
		[1.14, .82]
	];
	for (let [e, t] of r) S(n, .09, .11, 1.28, [
		e,
		.92,
		t
	], 10824744, [
		0,
		0,
		0
	], 10);
	for (let e of [
		.66,
		.91,
		1.16
	]) w(n, new i(-1.14, e, -.82), new i(1.14, e, -.82), .025, 14268042), w(n, new i(-1.14, e, .82), new i(1.14, e, .82), .025, 14268042), w(n, new i(-1.14, e, -.82), new i(-1.14, e, .82), .025, 14268042), w(n, new i(1.14, e, -.82), new i(1.14, e, .82), .025, 14268042);
	let a = T("K9  KNOCKOUT", "#ff635c");
	a.position.set(0, .52, 0), a.scale.set(1.65, .36, 1), n.add(a);
	for (let [t, i] of r) {
		let r = 1.9 + y(t * 3 + i) * .3;
		S(n, .03, .04, r, [
			t * 1.12,
			r / 2,
			i * 1.12
		], 2369323, [
			0,
			0,
			0
		], 6);
		let a = new e(new o(.09, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), new p({
			color: 16774084,
			emissive: 16768906,
			emissiveIntensity: .9,
			roughness: .4
		}));
		a.position.set(t * 1.12, r, i * 1.12), a.rotation.x = Math.PI, a.lookAt(0, .3, 0), n.add(a);
	}
	return n;
}
function R(e, n) {
	if (e === "plane") return A();
	if (e === "telescope") {
		let e = new t(), r = M(!1);
		r.userData.variant = "wood";
		let i = M(!0);
		return i.userData.variant = "metal", i.visible = n, r.visible = !n, e.add(r, i), e;
	}
	return e === "magic" ? N() : e === "igloo" ? P() : e === "sweatshop" ? F() : e === "docks" ? I() : L();
}
function z(n = 2572221) {
	let r = new t(), i = C(r, .18, [
		0,
		.24,
		0
	], n, [
		.85,
		1.3,
		.75
	]);
	i.userData.isPenguinBody = !0, C(r, .12, [
		0,
		.48,
		0
	], n), C(r, .11, [
		0,
		.25,
		-.13
	], 16052447, [
		.75,
		1.15,
		.3
	]), x(r, [
		.1,
		.035,
		.16
	], [
		-.1,
		.035,
		0
	], 16743723, [
		0,
		.2,
		0
	]), x(r, [
		.1,
		.035,
		.16
	], [
		.1,
		.035,
		0
	], 16743723, [
		0,
		-.2,
		0
	]);
	let a = new e(new l(.055, .16, 4), v(16743723));
	a.rotation.x = -Math.PI / 2, a.position.set(0, .48, -.15), r.add(a);
	let s = new o(.1, 10, 8);
	for (let t of [-1, 1]) {
		let i = new e(s, v(n));
		i.scale.set(.34, .95, .55), i.position.set(t * .19, .27, .01), i.rotation.z = t * .3, i.userData.isFlipper = !0, i.userData.flipperSide = t, r.add(i);
	}
	for (let e of [-1, 1]) {
		let t = x(r, [
			.075,
			.03,
			.13
		], [
			e * .07,
			.015,
			.04
		], 16743723);
		t.userData.isFoot = !0, t.userData.footSide = e;
	}
	return r;
}
//#endregion
export { R as buildBuildingModel, z as buildPenguin, M as buildTelescope };
