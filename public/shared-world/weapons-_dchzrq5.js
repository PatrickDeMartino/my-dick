import { $ as e, D as t, Gt as n, Ht as r, R as i, Vt as a, _ as o, et as s, f as c, ft as l, l as u, o as d, ot as f, pt as p, y as m, z as h } from "./three.module-h2PuqYDi.js";
//#region app/urf-3d/grok/outline.ts
function g(t, n, r = 1.06) {
	let i = new e(t.geometry, new s({
		color: n,
		side: 1
	}));
	return i.scale.setScalar(r), t.add(i), i;
}
function _(t, n, r = 1.06) {
	let i = [];
	t.traverse((t) => {
		t instanceof e && !t.userData.noOutline && i.push(t);
	});
	for (let e of i) g(e, n, r);
}
var v = 2754632, y = 662090, b = 4851736;
//#endregion
//#region app/urf-3d/grok/weapons.ts
function x(e, t) {
	return new f({
		color: e,
		roughness: .42,
		metalness: .35,
		flatShading: !0,
		...t
	});
}
function S(t, n, r, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = 1, d = 1, f = 1) {
	let p = new e(n, r);
	return p.position.set(i, a, o), p.rotation.set(s, c, l), p.scale.set(u, d, f), p.castShadow = !0, t.add(p), p;
}
var C = x(2366010, {
	metalness: .75,
	roughness: .26,
	emissive: 1313322,
	emissiveIntensity: .25
}), w = x(656928, {
	metalness: .7,
	roughness: .3,
	emissive: 656432,
	emissiveIntensity: .2
}), T = x(16738874, {
	roughness: .55,
	metalness: .1,
	emissive: 9054730,
	emissiveIntensity: .25
}), E = x(666170, {
	roughness: .45,
	metalness: .2,
	emissive: 674394,
	emissiveIntensity: .3
}), D = x(14765055, {
	emissive: 8392896,
	emissiveIntensity: .6,
	roughness: .3
}), O = x(16765498, {
	metalness: .65,
	roughness: .28,
	emissive: 16747024,
	emissiveIntensity: .35
}), k = x(8191802, {
	emissive: 2787856,
	emissiveIntensity: .35
});
function A() {
	let e = new t();
	e.name = "ak", S(e, new d(.09, .11, .34), C, 0, .02, .02), S(e, new d(.08, .07, .22), E, 0, .04, .18);
	let n = new m(.018, .02, .48, 10);
	n.rotateX(Math.PI / 2), S(e, n, w, 0, .05, .48);
	let r = new m(.01, .01, .28, 8);
	r.rotateX(Math.PI / 2), S(e, r, C, 0, .09, .38), S(e, new d(.05, .04, .2), T, 0, -.01, .22), S(e, new d(.04, .045, .22), T, 0, .01, -.24, .18), S(e, new d(.045, .12, .05), T, 0, -.08, -.06, .25), S(e, new d(.03, .06, .03), w, 0, -.05, .06), S(e, new d(.01, .05, .02), C, 0, .1, .68), S(e, new d(.04, .03, .02), C, 0, .09, -.04);
	let i = new m(.026, .022, .06, 8);
	i.rotateX(Math.PI / 2), S(e, i, w, 0, .05, .74), S(e, new d(.018, .018, .08), D, .04, .03, .1);
	let a = new t();
	a.name = "mag", a.position.set(0, -.16, .04), a.rotation.z = .18, a.rotation.x = .35, S(a, new d(.055, .28, .09), w, 0, 0, 0), S(a, new d(.06, .02, .1), D, 0, -.13, 0), e.add(a);
	let o = new l();
	o.position.set(0, .05, .8), e.add(o);
	let s = M();
	return s.position.copy(o.position), e.add(s), e.scale.setScalar(1.15), _(e, y), {
		root: e,
		muzzle: o,
		mag: a,
		cylinder: null,
		flash: s,
		kind: "ak"
	};
}
function j() {
	let n = new t();
	n.name = "revolver", S(n, new d(.07, .08, .18), C, 0, .01, .02);
	let r = new m(.022, .024, .32, 12);
	r.rotateX(Math.PI / 2), S(n, r, w, 0, .03, .28), S(n, new d(.05, .13, .045), T, 0, -.08, -.04, .28), S(n, new d(.02, .05, .02), w, 0, -.04, .05), S(n, new d(.03, .04, .04), C, 0, .07, -.05), S(n, new d(.012, .03, .02), C, 0, .06, .42);
	let i = new t();
	i.name = "cylinder", i.position.set(0, .03, .08);
	let a = new e(new m(.055, .055, .08, 12), C);
	a.rotation.x = Math.PI / 2, i.add(a);
	for (let t = 0; t < 6; t++) {
		let n = t / 6 * Math.PI * 2, r = new e(new m(.012, .012, .082, 8), w);
		r.rotation.x = Math.PI / 2, r.position.set(Math.cos(n) * .032, Math.sin(n) * .032, 0), i.add(r);
		let a = new e(new m(.01, .01, .04, 8), O);
		a.rotation.x = Math.PI / 2, a.position.set(Math.cos(n) * .032, Math.sin(n) * .032, .01), a.name = `slug${t}`, i.add(a);
	}
	n.add(i), S(n, new d(.015, .015, .06), D, .038, 0, 0);
	let o = new l();
	o.position.set(0, .03, .46), n.add(o);
	let s = M();
	return s.position.copy(o.position), s.scale.setScalar(.7), n.add(s), n.scale.setScalar(1.2), _(n, y), {
		root: n,
		muzzle: o,
		mag: null,
		cylinder: i,
		flash: s,
		kind: "revolver"
	};
}
function M() {
	let t = new o(.07, .22, 8);
	t.rotateX(-Math.PI / 2);
	let n = new e(t, new s({
		color: 16769354,
		transparent: !0,
		opacity: .9,
		depthWrite: !1,
		blending: 2
	}));
	return n.visible = !1, n.name = "flash", n.userData.noOutline = !0, n;
}
function N() {
	let e = new t(), n = new m(.035, .04, .16, 8);
	n.rotateX(Math.PI / 2), S(e, n, O);
	let r = new o(.035, .08, 8);
	return r.rotateX(Math.PI / 2), S(e, r, C, 0, 0, .11), e;
}
function P() {
	let e = new t();
	return S(e, new d(.16, .42, .22), w, 0, 0, 0, .2), S(e, new d(.18, .05, .24), D, 0, -.18, 0, .2), S(e, new d(.18, .05, .24), D, 0, .16, 0, .2), e.scale.setScalar(1.15), _(e, y), e;
}
function F(e, t) {
	if (e.cylinder) for (let n = 0; n < 6; n++) {
		let r = e.cylinder.getObjectByName(`slug${n}`);
		r && (r.visible = n < t);
	}
}
function I() {
	let s = new t();
	s.name = "bow";
	let d = new e(new r(new c([
		new n(0, -.62, -.1),
		new n(0, -.42, .08),
		new n(0, -.17, .15),
		new n(0, 0, .11),
		new n(0, .2, .16),
		new n(0, .45, .06),
		new n(0, .65, -.12)
	]), 48, .027, 8, !1), T);
	s.add(d), S(s, new m(.045, .045, .22, 10), w, 0, 0, .11);
	for (let t = 0; t < 5; t++) {
		let n = new e(new a(.047, .008, 5, 12), D);
		n.rotation.x = Math.PI / 2, n.position.set(0, -.08 + t * .04, .11), s.add(n);
	}
	let f = [
		new n(0, -.62, -.1),
		new n(0, 0, -.22),
		new n(0, .65, -.12)
	], p = new i(new u().setFromPoints(f), new h({
		color: 16314367,
		transparent: !0,
		opacity: .95
	}));
	s.add(p);
	let g = new t(), v = new m(.012, .012, .95, 8);
	v.rotateX(Math.PI / 2), S(g, v, T, 0, 0, .25);
	let b = new o(.032, .12, 6);
	b.rotateX(Math.PI / 2), S(g, b, C, 0, 0, .79);
	for (let e = 0; e < 3; e++) {
		let t = new o(.04, .13, 3);
		t.rotateX(-Math.PI / 2), S(g, t, D, 0, 0, -.2, 0, 0, e / 3 * Math.PI * 2);
	}
	s.add(g);
	let x = new l();
	x.position.set(0, 0, .86), s.add(x);
	let E = M();
	return E.position.copy(x.position), E.scale.setScalar(.5), s.add(E), s.scale.setScalar(1.05), _(s, y), {
		root: s,
		muzzle: x,
		mag: null,
		cylinder: null,
		flash: E,
		kind: "bow"
	};
}
function L() {
	let e = new t(), n = new m(.018, .018, 1.25, 8);
	n.rotateX(Math.PI / 2), S(e, n, T);
	let r = new o(.055, .18, 6);
	r.rotateX(Math.PI / 2), S(e, r, C, 0, 0, .71);
	for (let t = 0; t < 3; t++) {
		let n = new o(.055, .16, 3);
		n.rotateX(-Math.PI / 2), S(e, n, D, 0, 0, -.54, 0, t / 3 * Math.PI * 2, 0);
	}
	return _(e, y), e;
}
function R() {
	let n = new t(), r = x(15917386, {
		metalness: .05,
		roughness: .5,
		emissive: 6969872,
		emissiveIntensity: .2
	}), i = x(3811856, {
		metalness: .05,
		roughness: .6
	}), s = new e(new a(.22, .06, 6, 10, Math.PI * .9), r);
	return s.rotation.z = Math.PI * .55, n.add(s), S(n, new o(.035, .08, 6), i, .2, .14, 0, 0, 0, 1.4), S(n, new o(.03, .06, 6), i, -.2, -.05, 0, 0, 0, -1.6), n.scale.setScalar(1.1), _(n, y), n;
}
function z() {
	let e = new t();
	return S(e, new m(.11, .11, .32, 12), x(924170, {
		metalness: .5,
		roughness: .35
	}), 0, 0, 0), S(e, new m(.112, .112, .05, 12), k, 0, .06, 0), S(e, new m(.09, .11, .03, 12), C, 0, .17, 0), e.scale.setScalar(1.05), _(e, y), e;
}
function B() {
	let e = new t();
	return S(e, new m(.11, .11, .32, 12), x(1194634, {
		metalness: .55,
		roughness: .32
	}), 0, 0, 0), S(e, new m(.112, .112, .06, 12), x(14754338, {
		metalness: .2,
		roughness: .4
	}), 0, .02, 0), S(e, new m(.09, .11, .03, 12), C, 0, .17, 0), e.scale.setScalar(1.05), _(e, y), e;
}
function V() {
	let e = new t();
	return S(e, new m(.13, .13, .24, 12), O, 0, 0, 0), S(e, new m(.135, .135, .04, 12), w, 0, .14, 0), S(e, new m(.135, .135, .04, 12), w, 0, -.14, 0), S(e, new p(.05, 0), x(16769354, {
		emissive: 16756768,
		emissiveIntensity: .6,
		metalness: .2,
		roughness: .3
	}), 0, 0, .14), e.scale.setScalar(1.05), _(e, y), e;
}
function H() {
	let e = new t();
	S(e, new d(.22, .34, .14), w, 0, 0, 0), S(e, new m(.07, .08, .4, 10), C, -.09, -.02, -.02), S(e, new m(.07, .08, .4, 10), C, .09, -.02, -.02);
	let n = x(16756768, {
		emissive: 16738832,
		emissiveIntensity: .8,
		metalness: 0,
		roughness: .4
	});
	return S(e, new o(.05, .16, 8), n, -.09, -.3, -.02, Math.PI), S(e, new o(.05, .16, 8), n, .09, -.3, -.02, Math.PI), S(e, new d(.05, .2, .03), D, 0, .02, .09), e.scale.setScalar(1.1), _(e, y), e;
}
function U() {
	let e = new t(), n = x(14765055, {
		metalness: .3,
		roughness: .4,
		emissive: 6951048,
		emissiveIntensity: .25
	});
	S(e, new d(.6, .22, .9), n, 0, .22, 0), S(e, new d(.5, .16, .5), w, 0, .4, -.1);
	let r = new m(.16, .16, .12, 12);
	r.rotateZ(Math.PI / 2);
	for (let [t, n] of [
		[-.32, .32],
		[.32, .32],
		[-.32, -.32],
		[.32, -.32]
	]) S(e, r, w, t, .16, n);
	return S(e, new m(.02, .02, .5, 8), C, -.24, .55, -.35, 0, 0, .25), S(e, new m(.02, .02, .5, 8), C, .24, .55, -.35, 0, 0, -.25), e.scale.setScalar(.9), _(e, y), e;
}
function W() {
	let e = new t(), n = new m(.1, .06, .7, 10);
	n.rotateX(Math.PI / 2), S(e, n, x(15922943, {
		metalness: .1,
		roughness: .4
	}), 0, 0, 0);
	let r = x(1851258, {
		metalness: .2,
		roughness: .45,
		emissive: 662074,
		emissiveIntensity: .3
	});
	return S(e, new d(.9, .03, .18), r, 0, .06, .05), S(e, new d(.7, .03, .14), r, 0, -.05, .1), S(e, new d(.03, .18, .14), r, 0, .12, -.32), S(e, new d(.03, .32, .03), w, 0, 0, .36), e.scale.setScalar(.85), _(e, y), e;
}
//#endregion
export { b as _, N as a, P as c, B as d, j as f, v as g, y as h, I as i, z as l, F as m, L as n, V as o, U as p, R as r, H as s, A as t, W as u, g as v };
