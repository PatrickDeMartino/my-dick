import { $ as e, Bt as t, D as n, Dt as r, Et as i, Gt as a, H as o, Ht as s, Jt as c, Pt as l, Q as u, U as d, Vt as f, X as p, _t as m, at as h, b as g, d as _, et as v, f as y, ft as b, gt as x, h as S, j as C, o as w, ot as T, u as E, wt as D, xt as O, y as k } from "./three.module-h2PuqYDi.js";
import { t as A } from "./BufferGeometryUtils-nus3RdMX.js";
//#region app/brain-room/lib/surface.ts
function j(e) {
	let t = new Uint8Array(256 * 256 * 4);
	for (let e = 0; e < 256; e++) for (let n = 0; n < 256; n++) {
		let r = Math.sin(n * 2.7 + Math.sin(e * .09 + n * .13) * 1.8), i = Math.sin(n * 13.7 + e * 7.31) * Math.sin(n * 4.3 - e * 2.17), a = Math.round(211 + r * 22 + i * 18), o = (e * 256 + n) * 4;
		t[o] = t[o + 1] = t[o + 2] = a, t[o + 3] = 255;
	}
	let n = new g(t, 256, 256);
	return n.wrapS = n.wrapT = i, n.magFilter = o, n.minFilter = d, n.generateMipmaps = !0, n.needsUpdate = !0, n.colorSpace = r, n.repeat.set(3, 2), new h({
		color: e,
		map: n,
		bumpMap: n,
		bumpScale: .012,
		roughness: .92,
		sheen: .6,
		sheenColor: new S(e),
		sheenRoughness: .9
	});
}
function M() {
	let e = new Uint8Array(512 * 256 * 4), t = [
		[
			.13,
			.38,
			.11,
			.21
		],
		[
			.34,
			.61,
			.12,
			.2
		],
		[
			.58,
			.35,
			.14,
			.17
		],
		[
			.78,
			.62,
			.13,
			.23
		],
		[
			.95,
			.24,
			.08,
			.13
		]
	];
	for (let n = 0; n < 256; n++) for (let r = 0; r < 512; r++) {
		let i = r / 512, a = n / 256, o = 10;
		for (let [e, n, r, s] of t) {
			let t = Math.min(Math.abs(i - e), 1 - Math.abs(i - e)) / r, c = (a - n) / s;
			o = Math.min(o, Math.hypot(t, c) + .1 * Math.sin(i * 61 + a * 39) + .06 * Math.sin(a * 93 - i * 21));
		}
		let s = p.smoothstep(o, .96, 1.035), c = (n * 512 + r) * 4, l = Math.sin(r * 3.17 + n * 7.3) * 2;
		e[c] = 28 + s * 206 + l, e[c + 1] = 27 + s * 201 + l, e[c + 2] = 31 + s * 187 + l, e[c + 3] = 255;
	}
	let n = new g(e, 512, 256);
	return n.wrapS = i, n.colorSpace = r, n.magFilter = o, n.minFilter = d, n.generateMipmaps = !0, n.needsUpdate = !0, new h({
		map: n,
		roughness: .83,
		sheen: .3,
		sheenColor: new S(13879737)
	});
}
//#endregion
//#region app/brain-room/lib/lab-art.ts
function N(e, t = "#182728", n = "#e7e8db") {
	if (typeof document > "u") return new g(new Uint8Array([
		235,
		238,
		220,
		255
	]), 1, 1);
	let i = document.createElement("canvas");
	i.width = 1024, i.height = 512;
	let a = i.getContext("2d");
	a.fillStyle = n, a.fillRect(0, 0, 1024, 512), a.fillStyle = t, a.textAlign = "left", a.textBaseline = "middle", e.forEach((e, t) => {
		a.font = t === 0 ? "bold 45px monospace" : "34px monospace", a.fillText(e, 46, 65 + t * 75, 932);
	});
	let o = new E(i);
	return o.colorSpace = r, o;
}
function P() {
	if (typeof document > "u") return N(["BONGO / NEURAL LINK", ":)"]);
	let e = document.createElement("canvas");
	e.width = 1024, e.height = 512;
	let t = e.getContext("2d");
	t.fillStyle = "#071b20", t.fillRect(0, 0, 1024, 512), t.fillStyle = "#a2ff8b", t.textAlign = "center", t.font = "bold 34px monospace", t.fillText("BONGO / NEURAL LINK", 512, 62);
	for (let e of [390, 614]) t.fillRect(e - 27, 133, 54, 66), t.fillRect(e - 15, 122, 30, 13);
	t.strokeStyle = "#a2ff8b", t.lineWidth = 18, t.lineCap = "square", t.beginPath(), t.moveTo(351, 251), t.lineTo(378, 289), t.lineTo(427, 316), t.lineTo(597, 316), t.lineTo(646, 289), t.lineTo(673, 251), t.stroke(), t.font = "28px monospace", t.fillText("WELCOME, LITTLE MIND.", 512, 410), t.font = "22px monospace", t.fillText("KEYBOARD TO CONNECT", 512, 462);
	let n = new E(e);
	return n.colorSpace = r, n;
}
//#endregion
//#region app/brain-room/lib/bongo.ts
function F() {
	let t = j(12145694), r = new T({
		color: 13792815,
		roughness: .92
	}), i = new T({
		color: 6628616,
		roughness: 1
	}), o = new T({
		color: 11368024,
		roughness: .82
	}), c = new T({
		color: 6173992,
		roughness: .88
	}), u = new T({
		color: 1182985,
		roughness: .16,
		metalness: .05
	}), d = new T({
		color: 10354547,
		emissive: 2853717,
		emissiveIntensity: 1.5,
		roughness: .25
	}), p = new T({
		color: 3477518,
		roughness: .72
	}), m = j(16777215).map, g = new h({
		color: 14247299,
		emissive: 3147799,
		emissiveIntensity: .25,
		roughness: .64,
		bumpMap: m,
		bumpScale: .026,
		clearcoat: .32,
		clearcoatRoughness: .4,
		sheen: .38,
		sheenColor: new S(16753847)
	}), b = new T({
		color: 7215410,
		roughness: .86
	}), C = new h({
		color: 9377585,
		roughness: .52,
		clearcoat: .5
	}), E = new T({
		color: 10992324,
		roughness: .28,
		metalness: .82
	}), D = new T({
		color: 4385535,
		emissive: 556956,
		emissiveIntensity: 1.8,
		roughness: .3,
		metalness: .45
	}), O = new T({
		color: 13260287,
		emissive: 6099323,
		emissiveIntensity: 1.5,
		roughness: .32,
		metalness: .38
	}), A = new n(), M = new n();
	A.add(M);
	let P = new e(new l(.39, 22, 18), i);
	P.position.set(0, .35, -.015), P.scale.set(1.05, 1.14, .82), M.add(P);
	let F = new e(new l(.38, 24, 18), t);
	F.position.set(0, .58, .015), F.scale.set(1.23, .88, .84), M.add(F);
	let I = new e(new l(.27, 18, 14), r);
	I.position.set(0, .58, .255), I.scale.set(1.2, 1, .2), M.add(I);
	let L = new n();
	L.position.set(0, .97, .02), M.add(L);
	let R = new e(new l(.36, 28, 22, 0, Math.PI * 2, .88, Math.PI - .88), t);
	R.scale.set(.94, 1.04, .92), L.add(R);
	let z = new n();
	z.position.set(0, .205, .205);
	let B = new n(), V = new e(new l(.235, 34, 26), g);
	V.position.set(-.105, .075, .012), V.scale.set(.86, .78, .8);
	let H = V.clone();
	H.position.x = .105, B.add(V, H);
	for (let t of [-1, 1]) {
		let n = t * .105;
		for (let t = 0; t < 6; t++) {
			let r = [];
			for (let e = 0; e < 10; e++) {
				let i = e / 9, o = (i - .5) * .25, s = -.035 + t * .047 + Math.sin(i * Math.PI * 4 + t * 1.7) * .014, c = o / .145, l = (s - .075) / .19, u = Math.max(0, 1 - c * c - l * l);
				r.push(new a(n + o, s, .155 + u * .065));
			}
			let i = new e(new s(new y(r), 28, .008, 7, !1), b);
			B.add(i);
		}
	}
	let U = Array.from({ length: 9 }, (e, t) => {
		let n = -.075 + t * .041;
		return new a(Math.sin(t * 1.8) * .008, n, .225);
	});
	B.add(new e(new s(new y(U), 32, .012, 8, !1), b));
	let ee = [[
		new a(-.22, .01, .17),
		new a(-.12, .08, .226),
		new a(-.04, .18, .205)
	], [
		new a(.21, -.01, .17),
		new a(.15, .09, .225),
		new a(.06, .2, .2)
	]];
	for (let t of ee) B.add(new e(new s(new y(t), 22, .005, 6, !1), C));
	z.add(B);
	let W = new e(new f(.27, .027, 10, 36), E);
	W.scale.y = .63, W.position.z = .105, z.add(W);
	let te = new T({
		color: 1522987,
		roughness: .32,
		metalness: .78
	}), ne = new e(new w(.2, .13, .045), te);
	ne.position.set(.085, .125, .245), ne.rotation.z = -.1, z.add(ne);
	let re = N(["PROPERTY OF", "THE CIA"], "#d8ffbd", "#173d2b"), ie = new e(new x(.184, .112), new v({
		map: re,
		transparent: !0
	}));
	ie.position.set(.085, .125, .269), ie.rotation.z = -.1, z.add(ie);
	for (let t of [-1, 1]) for (let n = 0; n < 5; n++) {
		let r = new e(new w(.028, .01, .012), E);
		r.position.set(.085 + t * .112, .08 + n * .023, .247), z.add(r);
	}
	let ae = [
		[
			-.21,
			.08,
			D
		],
		[
			-.05,
			.205,
			O
		],
		[
			.23,
			.025,
			D
		]
	];
	for (let [t, n, r] of ae) {
		let i = new e(new k(.042, .052, .055, 8), r);
		i.rotation.x = Math.PI / 2, i.position.set(t, n, .235), z.add(i);
	}
	let oe = new T({
		color: 1513771,
		emissive: 1772337,
		emissiveIntensity: .7,
		roughness: .46,
		metalness: .65
	}), se = [
		[
			new a(-.05, .205, .25),
			new a(.01, .19, .3),
			new a(.07, .17, .27)
		],
		[
			new a(.185, .13, .26),
			new a(.255, .1, .29),
			new a(.23, .025, .25)
		],
		[
			new a(-.015, .1, .27),
			new a(-.14, .04, .29),
			new a(-.21, .08, .25)
		]
	];
	for (let t of se) {
		let n = new y(t);
		z.add(new e(new s(n, 12, .016, 6, !1), oe));
	}
	L.add(z);
	let G = new e(new l(.27, 24, 18), o);
	G.position.set(0, -.035, .205), G.scale.set(.88, 1.08, .48), L.add(G);
	let K = new e(new l(.145, 18, 14), o);
	K.position.set(-.215, -.08, .25), K.scale.set(1, .72, .55);
	let ce = K.clone();
	ce.position.x = .215, L.add(K, ce);
	let q = new e(new l(.105, 16, 12), c);
	q.position.set(-.34, .025, 0), q.scale.set(.5, .9, .5);
	let le = q.clone();
	le.position.x = .34, L.add(q, le);
	let J = new e(new l(.052, 16, 12), u);
	J.position.set(-.105, .055, .405);
	let ue = J.clone();
	ue.position.x = .105, L.add(J, ue);
	let de = new e(new l(.019, 12, 8), d);
	de.position.set(-.105, .056, .452);
	let fe = de.clone();
	fe.position.x = .105, L.add(de, fe);
	let Y = new e(new _(.018, .105, 3, 8), i);
	Y.position.set(-.11, .14, .41), Y.rotation.z = Math.PI / 2 + .12;
	let pe = Y.clone();
	pe.position.x = .11, pe.rotation.z = Math.PI / 2 - .12, L.add(Y, pe);
	let me = new e(new l(.082, 18, 12), c);
	me.position.set(0, -.04, .475), me.scale.set(1.15, .7, .72), L.add(me);
	let X = new n();
	X.position.set(0, -.18, .36);
	let he = new e(new l(.14, 18, 14), o);
	he.scale.set(1.18, .72, .72), X.add(he);
	let Z = new e(new l(.083, 16, 10), p);
	Z.position.set(0, -.025, .095), Z.scale.set(1.35, .28, .55), X.add(Z), L.add(X);
	function ge(t) {
		let r = new n(), i = new e(new l(.105, 14, 10), c);
		i.scale.set(1.05, .82, .75), r.add(i);
		for (let n = -1; n <= 1; n++) {
			let i = new e(new _(.018, .105, 3, 7), c);
			i.position.set(n * .035, -.1, .012), i.rotation.z = n * .09 * t, r.add(i);
		}
		return r;
	}
	function _e(r) {
		let a = new n(), o = new e(new _(.105, .38, 5, 11), i);
		o.position.y = -.22, o.scale.z = .9, a.add(o);
		let s = new n();
		s.position.y = -.44;
		let c = new e(new _(.085, .39, 5, 10), t);
		c.position.y = -.22, s.add(c);
		let l = ge(r);
		return l.position.y = -.46, s.add(l), a.add(s), {
			shoulder: a,
			elbow: s,
			hand: l
		};
	}
	let Q = _e(-1);
	Q.shoulder.position.set(-.4, .67, 0), Q.shoulder.rotation.z = -.14, Q.elbow.rotation.z = -.18;
	let $ = _e(1);
	$.shoulder.position.set(.4, .67, 0), $.shoulder.rotation.z = .14, $.elbow.rotation.z = .18, M.add(Q.shoulder, $.shoulder);
	function ve(r) {
		let a = new n(), o = new e(new _(.11, .19, 5, 10), i);
		o.position.y = -.12, a.add(o);
		let s = new n();
		s.position.y = -.24;
		let u = new e(new _(.08, .15, 4, 9), t);
		u.position.y = -.1, s.add(u);
		let d = new e(new l(.105, 14, 10), c);
		return d.position.set(r * .025, -.22, .04), d.scale.set(1.35, .65, 1.55), s.add(d), a.add(s), a.position.set(r * .2, .25, -.03), a.rotation.z = r * .18, {
			hip: a,
			knee: s,
			foot: d
		};
	}
	let ye = ve(-1), be = ve(1);
	return M.add(ye.hip, be.hip), A.name = "Dr. Bongo", A.scale.setScalar(1.15), A.userData = {
		kind: "bongo",
		torso: M,
		head: L,
		limbs: [
			Q.shoulder,
			Q.elbow,
			ye.hip,
			ye.knee,
			$.shoulder,
			$.elbow,
			be.hip,
			be.knee
		],
		walk: 0,
		vy: 0
	}, A.traverse((t) => {
		t instanceof e && (t.castShadow = !0, t.receiveShadow = !0);
	}), A;
}
//#endregion
//#region app/brain-room/lib/batch-parts.ts
function I(t, r = []) {
	for (let e of [...t.children]) e instanceof n && !r.includes(e) && I(e, r);
	let i = /* @__PURE__ */ new Map();
	for (let n of t.children) if (n instanceof e && !(n instanceof C) && !Array.isArray(n.material) && n.material.visible && !r.includes(n)) {
		let e = i.get(n.material) || [];
		e.push(n), i.set(n.material, e);
	}
	for (let [n, r] of i) {
		if (r.length < 2) continue;
		let i = r.map((e) => {
			e.updateMatrix();
			let t = e.geometry.index ? e.geometry.toNonIndexed() : e.geometry.clone();
			return t.applyMatrix4(e.matrix), t;
		}), a = A(i);
		if (i.forEach((e) => e.dispose()), !a) continue;
		let o = new e(a, n);
		o.castShadow = r.some((e) => e.castShadow), o.receiveShadow = r.some((e) => e.receiveShadow), r.forEach((e) => t.remove(e)), t.add(o);
	}
}
//#endregion
//#region app/brain-room/lib/specimens.ts
function L(i, o) {
	let c = new n();
	c.name = i + " neural study chair";
	let u = {
		baboon: {
			fur: 8545093,
			skin: 7753795,
			w: .42,
			h: .65,
			head: .41
		},
		gorilla: {
			fur: 2698034,
			skin: 4539725,
			w: .69,
			h: .72,
			head: .49
		},
		chimpanzee: {
			fur: 4207401,
			skin: 12228998,
			w: .43,
			h: .64,
			head: .42
		},
		yeti: {
			fur: 14805485,
			skin: 9350333,
			w: .68,
			h: .82,
			head: .53
		}
	}[i], d = j(u.fur), p = new T({
		color: u.skin,
		roughness: .8
	}), m = new h({
		color: 1053210,
		roughness: .14,
		clearcoat: 1
	}), g = new T({ color: 14931637 }), _ = new T({
		color: 5860467,
		metalness: .75,
		roughness: .36
	}), b = new T({
		color: 2569272,
		roughness: .95
	}), S = new T({
		color: 8603690,
		roughness: .8
	}), C = new l(1, 40, 28), E = new n();
	E.name = i + " test subject", c.add(E);
	let D = (t, n, r, i) => {
		let a = new e(C, n);
		return a.position.set(r[0], r[1], r[2]), a.scale.set(i[0], i[1], i[2]), a.castShadow = a.receiveShadow = !0, t.add(a), a;
	}, O = (t, n, r) => {
		let i = new e(new w(n[0], n[1], n[2]), r);
		return i.position.set(t[0], t[1], t[2]), i.castShadow = i.receiveShadow = !0, c.add(i), i;
	}, A = new e(new k(1.16, 1.3, .19, 6), _);
	A.position.y = .095, c.add(A), O([
		0,
		.53,
		0
	], [
		.28,
		.9,
		.28
	], _), O([
		0,
		.98,
		0
	], [
		1.5,
		.22,
		1.28
	], b), O([
		0,
		1.78,
		-.5
	], [
		1.52,
		1.7,
		.23
	], b);
	for (let e of [-1, 1]) O([
		e * .81,
		1.32,
		0
	], [
		.18,
		.19,
		1.5
	], _), O([
		e * .79,
		.82,
		.44
	], [
		.11,
		1,
		.12
	], _);
	let M = new n();
	E.add(M), D(M, d, [
		0,
		1.58,
		-.08
	], [
		u.w,
		u.h,
		.37
	]), D(M, p, [
		0,
		1.6,
		.266
	], [
		u.w * .66,
		u.h * .58,
		.055
	]);
	let P = new n();
	P.position.set(0, 2.26 + (i === "yeti" ? .2 : 0), 0), E.add(P);
	let F = new e(new l(1, 32, 22, 0, Math.PI * 2, .96, Math.PI - .96), d);
	if (F.scale.set(u.head, u.head * 1.05, u.head * .91), P.add(F), D(P, p, [
		0,
		-.07,
		.28
	], [
		u.head * .76,
		.27,
		.15
	]), i === "baboon") {
		D(P, p, [
			0,
			-.12,
			.5
		], [
			.17,
			.18,
			.37
		]), D(P, p, [
			0,
			-.16,
			.78
		], [
			.15,
			.08,
			.09
		]);
		for (let e of [-1, 1]) D(P, d, [
			e * .36,
			-.01,
			-.08
		], [
			.17,
			.34,
			.27
		]), D(P, m, [
			e * .065,
			-.12,
			.856
		], [
			.033,
			.021,
			.01
		]);
	} else {
		D(P, p, [
			0,
			-.19,
			.38
		], [
			u.head * .65,
			.13,
			.15
		]), D(P, m, [
			0,
			-.08,
			.452
		], [
			.115,
			.069,
			.033
		]);
		for (let e of [-1, 1]) D(P, m, [
			e * .038,
			-.085,
			.48
		], [
			.024,
			.014,
			.018
		]);
	}
	for (let e of [-1, 1]) {
		let t = e * (i === "gorilla" ? .18 : .15);
		D(P, g, [
			t,
			.026,
			.35
		], [
			.077,
			.069,
			.034
		]), D(P, m, [
			t,
			.016,
			.381
		], [
			.039,
			.045,
			.018
		]), D(P, g, [
			t - .014,
			.035,
			.396
		], [
			.012,
			.012,
			.007
		]), D(P, d, [
			t,
			.11,
			.345
		], [
			.14,
			i === "gorilla" ? .065 : .035,
			.055
		]), D(P, p, [
			e * u.head,
			-.04,
			0
		], [
			i === "chimpanzee" ? .15 : .09,
			.16,
			.065
		]), D(P, d, [
			e * (u.head + .014),
			-.01,
			-.032
		], [
			i === "chimpanzee" ? .16 : .11,
			.18,
			.046
		]);
		let r = Array.from({ length: 6 }, (t, r) => {
			let i = new n();
			return i.name = (e < 0 ? "left" : "right") + " " + [
				"upper arm",
				"forearm",
				"hand",
				"thigh",
				"shin",
				"foot"
			][r], E.add(i), i;
		});
		D(r[0], d, [
			e * (u.w + .1),
			1.68,
			.03
		], [
			.19,
			.35,
			.19
		]), D(r[1], d, [
			e * .68,
			1.4,
			.35
		], [
			.145,
			.14,
			.46
		]), D(r[2], p, [
			e * .68,
			1.39,
			.72
		], [
			.155,
			.09,
			.2
		]);
		for (let t = 0; t < 4; t++) D(r[2], p, [
			e * .68 + (t - 1.5) * .063,
			1.37,
			.87
		], [
			.026,
			.03,
			.1
		]);
		D(r[3], d, [
			e * .31,
			.93,
			.43
		], [
			.24,
			.22,
			.47
		]), D(r[4], d, [
			e * .36,
			.56,
			.74
		], [
			.145,
			.35,
			.15
		]), D(r[5], p, [
			e * .36,
			.26,
			.91
		], [
			.21,
			.105,
			.32
		]);
		for (let t = 0; t < 3; t++) D(r[5], p, [
			e * .36 + (t - 1) * .12,
			.25,
			1.16
		], [
			.065,
			.068,
			.115
		]);
		O([
			e * .68,
			1.42,
			.46
		], [
			.32,
			.05,
			.18
		], S), O([
			e * .36,
			.5,
			.895
		], [
			.32,
			.16,
			.045
		], S);
	}
	for (let e of [-1, 1]) {
		let t = O([
			e * .15,
			1.57,
			.31
		], [
			.105,
			1.08,
			.052
		], S);
		t.rotation.z = e * .48;
	}
	O([
		0,
		1.55,
		.36
	], [
		.19,
		.18,
		.05
	], _);
	let L = new h({
		color: 14853293,
		roughness: .48,
		clearcoat: .32
	});
	typeof document < "u" && (L.map = new t().load("/brain-room/cortex.png"), L.map.colorSpace = r, L.bumpMap = L.map, L.bumpScale = .018);
	let R = new n();
	R.position.y = .21, P.add(R);
	for (let t of [-1, 1]) {
		D(R, L, [
			t * .14,
			.07,
			0
		], [
			u.head * .62,
			.26,
			u.head * .79
		]);
		for (let n = 0; n < 8; n++) {
			let r = Array.from({ length: 17 }, (e, r) => {
				let i = r / 16 * Math.PI, o = (n / 7 - .5) * u.head * 1.24;
				return new a(t * .14 + Math.cos(i) * u.head * .53, .08 + Math.sin(i) * .23 * Math.sqrt(Math.max(.15, 1 - (o / (u.head * .85)) ** 2)), o + Math.sin(r * .9 + n * 1.7) * .021);
			});
			R.add(new e(new s(new y(r), 22, .026, 8, !1), L));
		}
	}
	let z = new e(new f(u.head * .87, .027, 8, 40), _);
	z.rotation.x = Math.PI / 2, z.position.y = .23, P.add(z);
	for (let e = 0; e < 5; e++) {
		let t = O([
			-.45 + e * .22,
			2.98 + (i === "yeti" ? .2 : 0),
			-.63
		], [
			.11,
			.06,
			.12
		], _);
		t.rotation.z = (e - 2) * .1;
	}
	if (i === "yeti") for (let e = 0; e < 24; e++) {
		let t = e / 24 * Math.PI * 2;
		D(P, d, [
			Math.cos(t) * .48,
			-.11 + Math.sin(t) * .25,
			-.09
		], [
			.08,
			.19,
			.1
		]).rotation.z = -t;
	}
	i === "gorilla" && D(M, d, [
		0,
		1.93,
		-.22
	], [
		.65,
		.35,
		.31
	]);
	let B = new e(new x(1.6, .8), new v({ map: N([`0${o + 1} / ${i.toUpperCase()}`, "NEURAL STUDY / LINKED"], "#abeedc", "#15272e") }));
	return B.position.set(0, .62, 1.02), B.rotation.x = -.1, c.add(B), c.userData = {
		head: P,
		body: M,
		animal: E
	}, I(c), c;
}
//#endregion
//#region app/brain-room/lib/evil-laser.ts
function R() {
	let t = new n();
	t.name = "Bongo Evil Science — Cortex Eraser", t.position.set(5, 0, 2);
	let r = new T({
		color: 2568505,
		metalness: .85,
		roughness: .3
	}), i = new T({
		color: 10860732,
		metalness: .9,
		roughness: .22
	}), o = new T({
		color: 4597849,
		metalness: .65,
		roughness: .35
	}), c = new T({
		color: 16759847,
		roughness: .55
	}), u = new T({
		color: 11599737,
		emissive: 7012118,
		emissiveIntensity: .8,
		metalness: .2,
		roughness: .2
	}), d = (n, r, i, a = t) => {
		let o = new e(n, r);
		return o.position.set(...i), o.castShadow = o.receiveShadow = !0, a.add(o), o;
	};
	d(new k(1.6, 1.9, .45, 12), r, [
		0,
		.3,
		0
	]), d(new k(1.2, 1.45, .2, 32), i, [
		0,
		.63,
		0
	]), d(new w(1.3, 1.8, 1.4), o, [
		0,
		1.55,
		0
	]);
	for (let e of [-1, 1]) {
		d(new w(.3, 2.3, 1.3), r, [
			e,
			1.9,
			0
		]);
		for (let t of [
			.9,
			1.35,
			1.8
		]) d(new w(.32, .13, 1.34), c, [
			e,
			t,
			0
		]);
		let t = d(new k(.46, .46, .36, 32), i, [
			e,
			2.8,
			0
		]);
		t.rotation.z = Math.PI / 2;
	}
	let p = new n();
	p.position.set(0, 2.8, 0), t.add(p);
	let h = (e, t, n, r) => {
		let i = d(new k(e, e, t, 32, 1, !0), r, [
			0,
			0,
			n
		], p);
		return i.rotation.x = Math.PI / 2, i;
	};
	h(.52, 4.5, 1.15, r), h(.27, 4.55, 1.18, u);
	let g = [];
	for (let e = 0; e < 9; e++) {
		let t = d(new f(.66, .095, 12, 40), e % 2 ? i : u, [
			0,
			0,
			-.7 + e * .43
		], p);
		g.push(t);
		for (let t of [
			0,
			Math.PI / 2,
			Math.PI,
			Math.PI * 1.5
		]) {
			let n = d(new w(.16, .2, .3), o, [
				Math.cos(t) * .76,
				Math.sin(t) * .76,
				-.7 + e * .43
			], p);
			n.rotation.z = t;
		}
	}
	h(.83, .42, 3.35, i), h(.59, .47, 3.36, r), d(new f(.6, .08, 12, 40), u, [
		0,
		0,
		3.61
	], p);
	for (let e of [-1.65, 1.65]) d(new _(.36, 1.65, 10, 24), o, [
		e,
		1.65,
		-1.15
	]), d(new f(.37, .045, 8, 24), i, [
		e,
		1.65,
		-.79
	]), d(new s(new y([
		new a(e, .8, -1.15),
		new a(e * 1.4, .4, -1.8),
		new a(e * .6, .45, -2),
		new a(0, 2.8, -1.2)
	]), 40, .09, 10, !1), r, [
		0,
		0,
		0
	]);
	let b = d(new w(1.4, 1.4, .8), r, [
		-2.3,
		.85,
		1.2
	]);
	b.rotation.y = -.3;
	let S = d(new k(.23, .23, .1, 24), new T({
		color: 16728117,
		emissive: 16717824,
		emissiveIntensity: .7
	}), [
		-2.3,
		1.62,
		1.2
	]);
	S.name = "Fire laser button";
	let C = d(new x(2.8, .95), new v({ map: N(["CORTEX ERASER", "EVIL SCIENCE / FIRE"]) }), [
		0,
		1.5,
		1.03
	]), E = new m(9568072, 0, 12, 2);
	E.position.set(0, 2.8, 3.4), t.add(E);
	let O = new v({
		color: 11206515,
		transparent: !0,
		opacity: .8,
		depthWrite: !1,
		blending: 2
	}), A = d(new k(.12, .12, 55, 20, 1, !0), O, [
		0,
		0,
		31.15
	], p);
	A.rotation.x = Math.PI / 2, A.visible = !1;
	let j = d(new l(.65, 24, 16), new v({
		color: 12844934,
		transparent: !0,
		opacity: .7,
		blending: 2,
		depthWrite: !1
	}), [
		0,
		0,
		3.6
	], p);
	j.visible = !1;
	let M = d(new w(5, 4, 6), new v({ visible: !1 }), [
		0,
		2,
		1
	]);
	M.name = "Charge Cortex Eraser", I(t, [
		p,
		S,
		C,
		M
	]);
	let P = -1, F = !1;
	return {
		root: t,
		hitbox: M,
		get state() {
			return P < 0 ? "ready" : P < 1.8 ? "charging" : P < 2.25 ? "firing" : "cooling";
		},
		trigger() {
			return P >= 0 ? !1 : (P = 0, F = !1, !0);
		},
		update(e) {
			let n = null;
			P >= 0 && (P += Math.min(e, .1), P >= 1.8 && !F && (F = !0, t.updateWorldMatrix(!0, !0), n = new D(p.localToWorld(new a(0, 0, 3.65)), new a(0, 0, 1).transformDirection(p.matrixWorld))), P > 4.5 && (P = -1));
			let r = P < 0 ? 0 : P < 1.8 ? P / 1.8 : P < 2.25 ? 1 : Math.max(0, 1 - (P - 2.25) / 1.2);
			return u.emissiveIntensity = .8 + r * 5, E.intensity = r * 95, j.visible = r > .15, j.scale.setScalar(.3 + r * .7), A.visible = P >= 1.8 && P < 2.25, O.opacity = .6 + .2 * Math.sin(P * 70), p.position.z = P >= 1.8 && P < 2.7 ? -.25 * Math.exp(-(P - 1.8) * 6) : 0, g.forEach((t, n) => {
				t.rotation.z += e * (.15 + r * 2) * (n % 2 ? 1 : -1);
			}), n;
		}
	};
}
//#endregion
//#region app/brain-room/lib/breakables.ts
var z = class {
	constructor(e, t) {
		this.solids = e, this.parent = t, this.pieces = [];
	}
	add(t, n, r, i = new a()) {
		let o = n[0] < n[2], s = o ? n[2] : n[0], c = n[1], l = Math.max(1, Math.ceil(s / 1.15)), u = Math.max(1, Math.ceil(c / 1.05)), d = s / l, f = c / u, p = new C(new w(1, 1, 1), r, l * u);
		p.castShadow = p.receiveShadow = !0, this.parent.add(p);
		let m = new b();
		for (let h = 0; h < u; h++) for (let u = 0; u < l; u++) {
			let g = o ? [
				n[0],
				f,
				d
			] : [
				d,
				f,
				n[2]
			], _ = new a(...t);
			_.y += (h + .5) * f - c / 2, o ? _.z += (u + .5) * d - s / 2 : _.x += (u + .5) * d - s / 2;
			let v = new e(new w(...g), r);
			v.position.copy(_), v.castShadow = v.receiveShadow = !0, m.position.copy(_), m.scale.set(...g), m.updateMatrix(), p.setMatrixAt(h * l + u, m.matrix);
			let y = _.clone().add(i), b = {
				center: y,
				half: new a(...g).multiplyScalar(.5)
			};
			this.solids.push(b), this.pieces.push({
				mesh: v,
				solid: b,
				center: y,
				dead: !1,
				batch: p,
				index: h * l + u
			});
		}
	}
	hit(e, t, n) {
		if (n < 6) return [];
		let r = this.pieces.find((n) => !n.dead && Math.abs(e.x - n.center.x) < n.solid.half.x + t && Math.abs(e.y - n.center.y) < n.solid.half.y + t && Math.abs(e.z - n.center.z) < n.solid.half.z + t);
		if (!r) return [];
		let i = [];
		for (let e of this.pieces) {
			if (e.dead || e.center.distanceTo(r.center) > 1.9) continue;
			e.dead = !0, e.mesh.visible = !1, e.batch.setMatrixAt(e.index, new u().makeScale(0, 0, 0)), e.batch.instanceMatrix.needsUpdate = !0;
			let t = this.solids.indexOf(e.solid);
			t >= 0 && this.solids.splice(t, 1), i.push(e);
		}
		return i;
	}
	repair() {
		for (let e of this.pieces) if (e.dead) {
			e.dead = !1, e.mesh.visible = !0;
			let t = new u().compose(e.mesh.position, new O(), e.solid.half.clone().multiplyScalar(2));
			e.batch.setMatrixAt(e.index, t), e.batch.instanceMatrix.needsUpdate = !0, this.solids.push(e.solid);
		}
	}
}, B = /* @__PURE__ */ c({
	LAB_CENTER: () => V,
	makeLab: () => H
}), V = new a(-12, 0, -57);
new a(-12, .48, -61), new a(-12, .5, -64);
function H(i) {
	let o = new n();
	o.name = "Bongo laboratory warehouse", o.position.copy(V);
	let s = new z(i, o), c = new T({
		color: 3490636,
		metalness: .55,
		roughness: .48
	}), l = new T({
		color: 10463656,
		roughness: .91
	}), u = new T({
		color: 1582122,
		roughness: .6
	}), d = new T({
		color: 14715447,
		emissive: 11750410,
		emissiveIntensity: .3
	}), f = new v({ color: 11006436 }), p = (t, n, r, s = !1) => {
		let c = new e(new w(...n), r);
		return c.position.set(...t), c.castShadow = c.receiveShadow = !0, o.add(c), s && i.push({
			center: c.position.clone().add(V),
			half: new a(...n).multiplyScalar(.5)
		}), c;
	};
	p([
		0,
		.04,
		0
	], [
		32,
		.16,
		26
	], new T({
		color: 6582638,
		roughness: .88
	}), !0), s.add([
		-16,
		5,
		0
	], [
		.45,
		10,
		26
	], l, V), s.add([
		16,
		5,
		0
	], [
		.45,
		10,
		26
	], l, V), s.add([
		0,
		5,
		-13
	], [
		32,
		10,
		.45
	], l, V), s.add([
		-9.6,
		5,
		13
	], [
		12.8,
		10,
		.45
	], l, V), s.add([
		9.6,
		5,
		13
	], [
		12.8,
		10,
		.45
	], l, V), p([
		0,
		8,
		13
	], [
		6.4,
		4,
		.45
	], l, !0), p([
		0,
		10.2,
		0
	], [
		33,
		.45,
		27
	], c, !0);
	for (let e of [
		-14,
		-7,
		0,
		7,
		14
	]) p([
		e,
		9.8,
		0
	], [
		.18,
		.34,
		26
	], c);
	for (let e of [
		-10,
		0,
		10
	]) {
		p([
			0,
			9.1,
			e
		], [
			29,
			.12,
			.12
		], c), p([
			0,
			8.99,
			e
		], [
			18,
			.08,
			.13
		], f);
		let t = new m(12182745, 110, 22, 2);
		t.position.set(0, 7.6, e), o.add(t);
	}
	for (let e of [-15.6, 15.6]) for (let t of [
		-11,
		0,
		11
	]) p([
		e,
		5,
		t
	], [
		.3,
		10,
		.3
	], c);
	let h = new C(new k(1.08, 1.08, .015, 6), new T({
		color: 5399392,
		roughness: .9
	}), 190), g = 0, _ = new b();
	for (let e = -6; e <= 6; e++) for (let t = -7; t <= 7 && !(g >= 190); t++) _.position.set(t * 2.05 + e % 2 * 1.025, .13, e * 1.7), _.updateMatrix(), h.setMatrixAt(g++, _.matrix);
	h.count = g, o.add(h);
	for (let e of [-2.9, 2.9]) p([
		e,
		.155,
		0
	], [
		.07,
		.025,
		24
	], d);
	let y = (t, n, r, i, a = 0) => {
		let s = new e(new x(r, i), new v({ map: N(t) }));
		return s.position.set(...n), s.rotation.y = a, o.add(s), s;
	};
	y(["BONGO / NEURAL RESEARCH", "ENTER THROUGH THE CENTRAL BAY"], [
		0,
		7.4,
		13.27
	], 8, 3);
	let S = [
		[
			"NEURAL DYNAMICS",
			"i h dψ/dt = Hψ",
			"∇²φ = 4πGρ",
			"E = mc²",
			"S = k log Ω"
		],
		[
			"COGNITION / FIELD NOTES",
			"y = σ(Wx + b)",
			"dV/dt = (I - gV)/C",
			"Σ p(x) = 1",
			"BANANAS → BIG IDEAS"
		],
		[
			"QUANTUM MONKEY THEORY",
			"∮ B · dl = μ₀I",
			"F = ma",
			"e^(iπ) + 1 = 0",
			"DO NOT LICK THE ELECTRODES"
		]
	];
	for (let e = 0; e < 3; e++) p([
		-15.66,
		4.6,
		-8 + e * 8
	], [
		.1,
		3.6,
		6.4
	], c), y(S[e], [
		-15.58,
		4.6,
		-8 + e * 8
	], 6, 3.2, Math.PI / 2);
	let E = new T({ roughness: 1 });
	typeof document < "u" && (E.map = new t().load("/brain-room/primate-studies.png"), E.map.colorSpace = r);
	for (let t of [-6, 5]) {
		p([
			15.65,
			5.2,
			t
		], [
			.13,
			3.6,
			7
		], c);
		let n = new e(new x(6.6, 3.3), E);
		n.position.set(15.56, 5.2, t), n.rotation.y = -Math.PI / 2, o.add(n);
	}
	let D = [];
	[
		"baboon",
		"gorilla",
		"chimpanzee",
		"yeti"
	].forEach((e, t) => {
		let n = L(e, t);
		n.position.set(t < 2 ? -10 : 10, .14, t % 2 ? -1.5 : 6.2), n.rotation.y = t < 2 ? Math.PI / 2 : -Math.PI / 2, o.add(n), D.push(n), i.push({
			center: n.position.clone().add(V).add(new a(0, .8, 0)),
			half: new a(1.3, .9, 1.3)
		});
	});
	let O = new Set(o.children);
	p([
		0,
		2.8,
		-10
	], [
		7.2,
		5.2,
		1.7
	], u, !0), p([
		0,
		3.25,
		-9.1
	], [
		6.3,
		3.5,
		.16
	], c);
	let A = new e(new x(5.8, 2.9), new v({ map: P() }));
	A.position.set(0, 3.35, -8.98), o.add(A), p([
		0,
		1.2,
		-7.9
	], [
		7,
		.3,
		2.3
	], c, !0), p([
		0,
		1.38,
		-7.45
	], [
		2.8,
		.1,
		.75
	], u);
	let j = new C(new w(.14, .07, .12), new T({
		color: 12108972,
		roughness: .7
	}), 72);
	g = 0;
	for (let e = 0; e < 4; e++) for (let t = 0; t < 18; t++) _.position.set((t - 8.5) * .146, 1.47, -7.15 - e * .145), _.updateMatrix(), j.setMatrixAt(g++, _.matrix);
	o.add(j);
	for (let e of [-6, 6]) {
		p([
			e,
			2.4,
			-10
		], [
			2.5,
			4.7,
			2.1
		], c, !0);
		for (let t = 0; t < 9; t++) {
			p([
				e,
				.5 + t * .45,
				-8.92
			], [
				2.1,
				.3,
				.035
			], u);
			for (let n = 0; n < 4; n++) p([
				e - .8 + n * .16,
				.5 + t * .45,
				-8.89
			], [
				.055,
				.055,
				.035
			], t % 3 == 0 ? d : f);
		}
	}
	let M = p([
		0,
		1.65,
		-7.5
	], [
		3.2,
		1.1,
		1
	], new v({ visible: !1 }));
	M.name = "Bongo keyboard interaction";
	let B = new n();
	B.name = "Bongo supercomputer", o.children.filter((e) => !O.has(e)).forEach((e) => B.add(e)), o.add(B);
	let H = F();
	H.position.set(4, .5, -6.6), H.rotation.y = -.3, o.add(H), y(["DR. BONGO", "NEURAL LINK / ONLINE"], [
		0,
		6.5,
		-12.68
	], 9, 2.2);
	let U = R();
	return o.add(U.root), i.push({
		center: U.root.position.clone().add(V).add(new a(0, 1.6, 0)),
		half: new a(1.9, 1.6, 1.5)
	}), I(o, [
		B,
		U.root,
		H,
		A,
		M,
		...s.pieces.map((e) => e.mesh)
	]), {
		root: o,
		mainframe: B,
		bongo: H,
		screen: A,
		specimens: D,
		computerHitbox: M,
		breakables: s,
		laser: U
	};
}
//#endregion
export { L as a, N as c, R as i, M as l, H as n, I as o, z as r, F as s, B as t, j as u };
