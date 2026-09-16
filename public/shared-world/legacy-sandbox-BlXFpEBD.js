import { $ as e, D as t, Gt as n, Ht as r, Pt as i, Vt as a, _ as o, d as s, f as c, o as l, ot as u, y as d } from "./three.module-h2PuqYDi.js";
import { f, t as p } from "./weapons-_dchzrq5.js";
//#region app/world/models/legacy-sandbox.ts
var m = (e, t = .05, n = 0) => new u({
	color: e,
	roughness: .48,
	metalness: t,
	emissive: n,
	emissiveIntensity: n ? .35 : 0,
	flatShading: !0
}), h = (t, n, r, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0) => {
	let u = new e(n, r);
	return u.position.set(i, a, o), u.rotation.set(s, c, l), u.castShadow = !0, t.add(u), u;
};
function g(e) {
	let n = new t(), r = e === "PEPSI" ? m(1332424, .55) : e === "MONSTER" ? m(1054741, .7, 1591844) : e === "RAT MEAT" ? m(12173770, .75) : m(7023894, .42);
	h(n, new d(.28, .28, .72, 18), r), h(n, new a(.25, .025, 6, 20), m(14148072, .85), 0, .35, 0, Math.PI / 2), h(n, new a(.25, .025, 6, 20), m(14148072, .85), 0, -.35, 0, Math.PI / 2);
	let i = h(n, new l(.44, .2, .025), m(e === "PEPSI" ? 15988223 : e === "MONSTER" ? 6684488 : e === "RAT MEAT" ? 14897e3 : 15848539), 0, 0, .275);
	return i.userData.label = e, n;
}
function _() {
	let e = new t(), n = m(14170939, .35), r = m(15916973), a = m(2435890, .6), o = m(8318719, .2, 1399654);
	h(e, new l(1.45, .22, .32), n), h(e, new l(1.9, .07, .48), r, 0, .32, 0), h(e, new l(1.72, .07, .44), r, 0, -.12, 0), [-.65, .65].forEach((t) => {
		h(e, new d(.025, .025, .45, 6), a, t, .1, .17), h(e, new d(.025, .025, .45, 6), a, t, .1, -.17);
	}), h(e, new d(.09, .13, .55, 10), n, 0, 0, -.42, Math.PI / 2);
	let s = h(e, new l(.06, 1.15, .08), a, 0, 0, -.73, 0, 0, .18);
	return s.userData.propeller = !0, h(e, new i(.2, 10, 7), o, 0, .17, .12), h(e, new l(.55, .06, .22), n, 0, .17, .72), e.scale.setScalar(1.3), e;
}
function v() {
	let e = new t(), n = m(1185307), r = m(15267060), a = m(16752940);
	return h(e, new i(.38, 12, 8), n, 0, .48, 0), h(e, new i(.28, 12, 8), r, 0, .46, .25), h(e, new i(.3, 12, 8), n, 0, 1.02, 0), h(e, new o(.11, .3, 5), a, 0, 1, .34, Math.PI / 2), [-1, 1].forEach((t) => h(e, new s(.07, .42, 4, 8), n, t * .4, .55, 0, 0, 0, t * .55)), e;
}
function y() {
	let e = new t(), n = m(8008989), r = m(3938063), a = m(12089674);
	return h(e, new i(.48, 12, 9), n, 0, .55, 0), h(e, new i(.34, 12, 8), n, 0, 1.15, 0), h(e, new i(.25, 10, 7), a, 0, 1.08, .27), [-1, 1].forEach((t) => {
		h(e, new s(.1, .65, 4, 8), r, t * .48, .55, 0, 0, 0, t * .62), h(e, new s(.11, .55, 4, 8), r, t * .25, .03, 0, 0, 0, t * .18);
	}), e;
}
function b(e) {
	if (e === "ak47") return p().root;
	if (e === "revolver") return f().root;
	if (e === "pepsi") return g("PEPSI");
	if (e === "yoohoo") return g("YOO-HOO");
	if (e === "monster") return g("MONSTER");
	if (e === "rat-meat") return g("RAT MEAT");
	if (e === "biplane") return _();
	if (e === "penguin") return v();
	if (e === "bongo") return y();
	let i = new t();
	return e === "bow" && (h(i, new r(new c([
		new n(0, -.65, .16),
		new n(0, 0, -.12),
		new n(0, .65, .16)
	]), 18, .035, 6, !1), m(7619617)), h(i, new d(.009, .009, 1.32, 5), m(15267317), 0, 0, .15)), e === "arrow" && (h(i, new d(.025, .025, 1.4, 7), m(7619617), 0, 0, 0, Math.PI / 2), h(i, new o(.08, .25, 5), m(14280175, .8), 0, 0, .82, Math.PI / 2)), e === "jetpack" && (h(i, new l(.55, .72, .25), m(4213592, .8)), [-1, 1].forEach((e) => {
		h(i, new d(.13, .17, .65, 10), m(6912394, .8), e * .34, 0, 0), h(i, new o(.13, .38, 9), m(3863551, .1, 2545919), e * .34, -.53, 0, Math.PI);
	})), e === "vehicle" && (h(i, new l(1.5, .35, .9), m(9305912, .5), 0, .25, 0), [-1, 1].forEach((e) => [-1, 1].forEach((t) => h(i, new d(.22, .22, .18, 12), m(1513757, .7), e * .62, .08, t * .42, Math.PI / 2))), h(i, new l(.7, .35, .65), m(6502055, .45), 0, .58, 0)), i;
}
//#endregion
export { b as makeSandboxProp };
