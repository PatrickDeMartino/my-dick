//#region app/world/models/legacy-brain.ts
function e(e, t, n, r, i) {
	let a = new e.Mesh(new e.CylinderGeometry(n, r, t, 6), i);
	return a.position.y = -t / 2, a;
}
function t(t) {
	let n = new t.MeshStandardMaterial({
		color: 12145694,
		roughness: .96
	}), r = new t.MeshStandardMaterial({
		color: 13792815,
		roughness: .92
	}), i = new t.MeshStandardMaterial({
		color: 11368024,
		roughness: .82
	}), a = new t.MeshStandardMaterial({
		color: 1182985,
		roughness: .16
	}), o = new t.Group(), s = new t.Mesh(new t.SphereGeometry(.34, 20, 16), n);
	s.scale.set(1.1, 1.2, .95), s.position.y = .68, o.add(s);
	let c = new t.Mesh(new t.SphereGeometry(.24, 16, 12), r);
	c.position.set(0, .55, .24), o.add(c);
	let l = new t.Mesh(new t.SphereGeometry(.22, 18, 14), n);
	l.position.y = 1.12, o.add(l);
	let u = new t.Mesh(new t.SphereGeometry(.13, 14, 10), i);
	return u.position.set(0, 1.08, .16), u.scale.set(1, .9, .7), o.add(u), [-1, 1].forEach((e) => {
		let n = new t.Mesh(new t.SphereGeometry(.024, 8, 8), a);
		n.position.set(e * .06, 1.11, .24), o.add(n);
	}), [-1, 1].forEach((r) => {
		let i = new t.Group();
		i.position.set(r * .32, .92, 0), i.rotation.z = r * .3, o.add(i), i.add(e(t, .5, .09, .07, n));
		let a = new t.Group();
		a.position.y = -.5, a.rotation.x = .3, i.add(a), a.add(e(t, .42, .07, .06, n));
	}), [-1, 1].forEach((r) => {
		let i = new t.Group();
		i.position.set(r * .14, .42, 0), o.add(i), i.add(e(t, .42, .1, .08, n));
	}), o;
}
function n(e) {
	let t = new e.MeshStandardMaterial({
		color: 15920354,
		roughness: .7
	}), n = new e.MeshStandardMaterial({
		color: 15771830,
		roughness: .55
	}), r = new e.MeshStandardMaterial({
		color: 1708560,
		roughness: .2
	}), i = new e.Group(), a = new e.Mesh(new e.SphereGeometry(.16, 16, 12), t);
	a.scale.set(1, .82, 1.5), a.position.y = .18, i.add(a);
	let o = new e.Mesh(new e.SphereGeometry(.1, 14, 10), t);
	o.position.set(0, .2, .22), i.add(o);
	let s = new e.Mesh(new e.ConeGeometry(.05, .09, 8), n);
	s.rotation.x = Math.PI / 2, s.position.set(0, .17, .32), i.add(s), [-1, 1].forEach((t) => {
		let a = new e.Mesh(new e.CircleGeometry(.05, 12), n);
		a.position.set(t * .08, .28, .2), a.rotation.y = t * .6, i.add(a);
		let o = new e.Mesh(new e.SphereGeometry(.015, 6, 6), r);
		o.position.set(t * .06, .22, .28), i.add(o);
	});
	let c = new e.Mesh(new e.CylinderGeometry(.012, .006, .4, 5), n);
	return c.rotation.x = Math.PI / 2.2, c.position.set(0, .13, -.32), i.add(c), i;
}
function r(t) {
	let n = new t.MeshStandardMaterial({
		color: 8378687,
		flatShading: !0,
		roughness: .62
	}), r = new t.MeshStandardMaterial({
		color: 8011721,
		flatShading: !0,
		roughness: .5
	}), i = new t.MeshStandardMaterial({
		color: 656912,
		roughness: .12
	}), a = new t.Group(), o = new t.Group();
	a.add(o), [-1, 1].forEach((r) => {
		let i = new t.Group();
		i.position.set(r * .05, .5, 0), o.add(i), i.add(e(t, .5, .055, .046, n));
	});
	let s = new t.Group();
	s.position.y = .5, a.add(s);
	let c = new t.Mesh(new t.CylinderGeometry(.1, .078, .25, 6), n);
	c.position.y = .2, s.add(c);
	let l = new t.Mesh(new t.CylinderGeometry(.088, .088, .04, 6), r);
	l.position.y = .07, s.add(l);
	let u = new t.Group();
	u.position.y = .36, s.add(u);
	let d = new t.Mesh(new t.IcosahedronGeometry(.12, 1), n);
	return d.scale.set(1.05, 1.34, 1.16), d.position.y = .12, u.add(d), [-1, 1].forEach((e) => {
		let n = new t.Mesh(new t.IcosahedronGeometry(.055, 1), i);
		n.scale.set(.95, 1.28, .72), n.position.set(e * .055, .115, .1), u.add(n);
	}), a;
}
function i(e) {
	let t = new e.MeshStandardMaterial({
		color: 1844272,
		roughness: .6
	}), n = new e.MeshStandardMaterial({
		color: 16052447,
		roughness: .55
	}), r = new e.MeshStandardMaterial({
		color: 16743723,
		roughness: .5
	}), i = new e.Group(), a = new e.Mesh(new e.SphereGeometry(.18, 16, 12), t);
	a.scale.set(.85, 1.3, .75), a.position.y = .24, i.add(a);
	let o = new e.Mesh(new e.SphereGeometry(.11, 14, 10), n);
	o.scale.set(.75, 1.15, .3), o.position.set(0, .25, -.13), i.add(o);
	let s = new e.Mesh(new e.SphereGeometry(.12, 14, 10), t);
	s.position.y = .48, i.add(s);
	let c = new e.Mesh(new e.ConeGeometry(.055, .16, 4), r);
	return c.rotation.x = -Math.PI / 2, c.position.set(0, .48, -.15), i.add(c), [-1, 1].forEach((n) => {
		let r = new e.Mesh(new e.SphereGeometry(.1, 10, 8), t);
		r.scale.set(.34, .95, .55), r.position.set(n * .19, .27, .01), r.rotation.z = n * .3, i.add(r);
	}), i;
}
function a(e) {
	let t = new e.MeshStandardMaterial({
		color: 6958162,
		roughness: .92
	}), n = new e.MeshStandardMaterial({
		color: 4856888,
		roughness: .95
	}), r = new e.Group(), i = new e.Mesh(new e.SphereGeometry(.85, 20, 14), t);
	i.scale.set(1, .62, 1), i.position.y = .5, r.add(i);
	for (let t = 0; t < 5; t += 1) {
		let i = new e.Mesh(new e.TorusGeometry(.78 - t * .14, .02, 6, 20), n);
		i.rotation.x = Math.PI / 2, i.position.y = .18 + t * .06, r.add(i);
	}
	return r;
}
function o(e) {
	let t = document.createElement("canvas");
	t.width = 128, t.height = 128;
	let n = t.getContext("2d");
	n.fillStyle = "#f4f1ea", n.fillRect(0, 0, 128, 128), n.fillStyle = "#2a2622";
	let r = (e, t, r) => {
		n.beginPath(), n.ellipse(e, t, r, r * .72, .4, 0, Math.PI * 2), n.fill();
	};
	r(30, 30, 26), r(95, 45, 30), r(60, 95, 28), r(15, 100, 20);
	let i = new e.CanvasTexture(t);
	i.colorSpace = e.SRGBColorSpace;
	let a = new e.MeshStandardMaterial({
		map: i,
		roughness: .85
	}), o = new e.MeshStandardMaterial({
		color: 15250349,
		roughness: .7
	}), s = new e.MeshStandardMaterial({
		color: 14208936,
		roughness: .4
	}), c = new e.Group(), l = new e.Mesh(new e.BoxGeometry(.9, .62, 1.5), a);
	l.position.y = .72, c.add(l);
	let u = new e.Mesh(new e.BoxGeometry(.42, .4, .46), a);
	u.position.set(0, .78, .88), c.add(u);
	let d = new e.Mesh(new e.BoxGeometry(.3, .2, .16), o);
	d.position.set(0, .65, 1.1), c.add(d), [-1, 1].forEach((t) => {
		let n = new e.Mesh(new e.ConeGeometry(.04, .16, 6), s);
		n.position.set(t * .16, 1.02, .82), n.rotation.z = t * .3, c.add(n);
		let r = new e.Mesh(new e.BoxGeometry(.06, .16, .2), a);
		r.position.set(t * .24, .86, .72), c.add(r);
	}), [-1, 1].forEach((t) => [-1, 1].forEach((n) => {
		let r = new e.Mesh(new e.CylinderGeometry(.09, .08, .68, 8), a);
		r.position.set(t * .32, .34, n * .55), c.add(r);
	}));
	let f = new e.Mesh(new e.CylinderGeometry(.02, .015, .5, 5), a);
	return f.rotation.x = .3, f.position.set(0, .75, -.78), c.add(f), c;
}
function s(e) {
	let t = new e.MeshStandardMaterial({
		color: 15772848,
		roughness: .7
	}), n = new e.MeshStandardMaterial({
		color: 14912145,
		roughness: .6
	}), r = new e.MeshStandardMaterial({
		color: 4864570,
		roughness: .6
	}), i = new e.Group(), a = new e.Mesh(new e.SphereGeometry(.42, 18, 14), t);
	a.scale.set(1, .82, 1.25), a.position.y = .5, i.add(a);
	let o = new e.Mesh(new e.SphereGeometry(.24, 16, 12), t);
	o.position.set(0, .55, .55), i.add(o);
	let s = new e.Mesh(new e.CylinderGeometry(.1, .1, .08, 12), n);
	s.rotation.x = Math.PI / 2, s.position.set(0, .5, .76), i.add(s), [-1, 1].forEach((n) => {
		let r = new e.Mesh(new e.ConeGeometry(.09, .14, 6), t);
		r.position.set(n * .13, .72, .55), r.rotation.z = n * .5, r.rotation.x = -.3, i.add(r);
	}), [-1, 1].forEach((n) => [-1, 1].forEach((a) => {
		let o = new e.Mesh(new e.CylinderGeometry(.06, .06, .32, 8), t);
		o.position.set(n * .24, .16, a * .38), i.add(o);
		let s = new e.Mesh(new e.CylinderGeometry(.065, .065, .05, 8), r);
		s.position.set(n * .24, .01, a * .38), i.add(s);
	}));
	let c = new e.Mesh(new e.TorusGeometry(.05, .012, 6, 10, Math.PI * 1.5), t);
	return c.position.set(0, .6, -.62), c.rotation.y = Math.PI / 2, i.add(c), i;
}
function c(e) {
	let t = new e.MeshStandardMaterial({
		color: 16118504,
		roughness: .98
	}), n = new e.MeshStandardMaterial({
		color: 2827810,
		roughness: .7
	}), r = new e.Group();
	[
		[
			0,
			.58,
			0,
			.3
		],
		[
			-.22,
			.55,
			.15,
			.22
		],
		[
			.22,
			.55,
			.15,
			.22
		],
		[
			-.2,
			.55,
			-.25,
			.22
		],
		[
			.2,
			.55,
			-.25,
			.22
		],
		[
			0,
			.68,
			-.1,
			.24
		],
		[
			0,
			.5,
			.35,
			.2
		]
	].forEach(([n, i, a, o]) => {
		let s = new e.Mesh(new e.SphereGeometry(o, 12, 10), t);
		s.position.set(n, i, a), r.add(s);
	});
	let i = new e.Mesh(new e.SphereGeometry(.15, 14, 10), n);
	return i.position.set(0, .56, .52), i.scale.set(.85, .9, 1), r.add(i), [-1, 1].forEach((t) => {
		let i = new e.Mesh(new e.SphereGeometry(.06, 8, 6), n);
		i.scale.set(1.6, .6, .8), i.position.set(t * .16, .58, .42), r.add(i);
	}), [-1, 1].forEach((t) => [-1, 1].forEach((i) => {
		let a = new e.Mesh(new e.CylinderGeometry(.045, .045, .36, 8), n);
		a.position.set(t * .2, .18, i * .32), r.add(a);
	})), r;
}
//#endregion
export { r as buildAlienScout, a as buildBeanbag, t as buildBongo, o as buildCow, n as buildLabRat, i as buildPenguinCharacter, s as buildPig, c as buildSheep };
