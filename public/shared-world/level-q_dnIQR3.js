import { $ as e, Bt as t, Ct as n, D as r, Dt as i, E as a, Et as o, Gt as s, H as c, Ht as l, J as u, Jt as d, Kt as f, O as p, Pt as m, Q as h, S as g, U as _, Vt as v, Wt as y, X as b, _ as x, _t as S, a as C, at as w, b as T, c as E, d as D, et as O, f as k, ft as ee, gt as te, h as ne, i as A, j as re, kt as ie, l as j, nt as M, o as ae, ot as N, tt as oe, w as P, y as F } from "./three.module-h2PuqYDi.js";
import { c as I, l as L, n as se, o as ce, r as le } from "./laboratory-DcZUDm9z.js";
import { t as R } from "./BufferGeometryUtils-nus3RdMX.js";
import { t as z } from "./FBXLoader-B9Ja9Byb.js";
import { n as ue } from "./dreamscape-BAEaW25a.js";
//#region app/world/library.ts
var de = [
	{
		id: "solomon",
		title: "The Lesser Key of Solomon",
		subtitle: "Goetia · 1916 edition",
		file: "/library/solomon/index.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/72679",
		note: "Complete public-domain Goetia edition, including its diagrams. This edition is not the entire five-part Lemegeton."
	},
	{
		id: "necronomicon",
		title: "The Necronomicon shelf",
		subtitle: "Lovecraft fiction & companion",
		file: "/library/necronomicon/companion.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/68283",
		note: "A clearly labeled companion plus the complete 1928 Call of Cthulhu. The fictional Necronomicon has no authentic ancient full text; modern commercial editions are not reproduced."
	},
	{
		id: "enoch",
		title: "The Book of Enoch",
		subtitle: "R. H. Charles · 1917 translation",
		file: "/library/enoch/index.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/77935",
		note: "Complete public-domain translation and editorial apparatus."
	},
	{
		id: "illuminati",
		title: "Illuminati: the historical record",
		subtitle: "Primary source & research notebook",
		file: "/library/illuminati/companion.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/47605",
		note: "Robison’s 1797 polemic is included as a historical source, not as proof of modern claims."
	},
	{
		id: "mkultra",
		title: "MKULTRA",
		subtitle: "The 1977 Senate hearing",
		file: "/library/mkultra/manifest.json",
		kind: "pdf",
		source: "https://www.intelligence.senate.gov/wp-content/uploads/2024/08/sites-default-files-hearings-95mkultra.pdf",
		note: "Complete 173-page official hearing, split into readable volumes with original page images."
	},
	{
		id: "wwii",
		title: "The Doctors’ Trial",
		subtitle: "Nuremberg · Medical Case, Volume II",
		file: "/library/wwii/index.html",
		kind: "html",
		source: "https://www.loc.gov/item/2011525364/",
		note: "Complete official Volume II from the Medical Case, including judgments and the Nuremberg Code. Historical evidence of abusive experiments, not an endorsement."
	},
	{
		id: "programming",
		title: "From First Line to Your Own World",
		subtitle: "An AI-era programming workbook",
		file: "/library/programming/index.html",
		kind: "html",
		source: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
		note: "Original Triptotropic workbook: foundations, exercises, debugging, 3D, testing, and a practical path toward professional work."
	},
	{
		id: "flight",
		title: "Learning to Fly",
		subtitle: "FAA Airplane Flying Handbook",
		file: "/library/flight/manifest.json",
		kind: "pdf",
		source: "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook",
		note: "Complete FAA-H-8083-3C handbook, including illustrations. A study reference used with qualified flight instruction and the aircraft’s approved handbook."
	},
	{
		id: "occult",
		title: "Ritual, Charms & the Golden Bough",
		subtitle: "Two complete historical folklore volumes",
		file: "/library/occult/companion.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/3623",
		note: "A historical collection of ritual and folklore. Its dated interpretations are not a modern scientific consensus or proof of supernatural effects."
	},
	{
		id: "frankenstein",
		title: "Frankenstein",
		subtitle: "Mary Shelley",
		file: "/library/frankenstein/index.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/84",
		note: "Complete public-domain novel."
	},
	{
		id: "alice",
		title: "Alice in Wonderland",
		subtitle: "Lewis Carroll",
		file: "/library/alice/index.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/11",
		note: "Complete public-domain novel."
	},
	{
		id: "flatland",
		title: "Flatland",
		subtitle: "Edwin A. Abbott",
		file: "/library/flatland/index.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/201",
		note: "Complete illustrated public-domain novel about dimensions."
	},
	{
		id: "origin",
		title: "On the Origin of Species",
		subtitle: "Charles Darwin · 1859 first edition",
		file: "/library/origin/index.html",
		kind: "html",
		source: "https://www.gutenberg.org/ebooks/1228",
		note: "Complete historical first edition; modern evolutionary science has developed beyond this text."
	}
], B = [
	15308725,
	15308725,
	15905990,
	14516893,
	15703736,
	12485375,
	7988635,
	7715327,
	15912040,
	15491958
], V = 24;
function fe(e = .045, t = 5) {
	let r = { value: 0 }, i = { value: Array.from({ length: V }, () => new f(0, 0, 0, 0)) }, a = { value: Array.from({ length: V }, () => new s(0, 1, 0)) }, o = (n) => new s(Math.sin(n.y * t + Math.sin(n.z * t * .7 + r.value) * .8 + r.value * 1.3), Math.sin(n.z * t * .91 + Math.sin(n.x * t * .8 - r.value) * .7 + r.value * 1.1), Math.sin(n.x * t * .83 + Math.sin(n.y * t * .6 + r.value) * .8 - r.value * 1.2)).multiplyScalar(e), c = (e) => {
		let t = o(e);
		for (let n = 0; n < V; n++) {
			let r = i.value[n];
			if (r.w <= 0) continue;
			let o = e.clone().sub(new s(r.x, r.y, r.z)), c = a.value[n], l = o.dot(c);
			if (Math.abs(l) > r.w * 2 + .3) continue;
			o.addScaledVector(c, -l);
			let u = o.length();
			u > 1e-5 && u < r.w * 1.8 && t.addScaledVector(o, (r.w * 1.8 - u) * .48 / u);
		}
		return t;
	}, l = (e, t) => {
		let n = new s().crossVectors(t, Math.abs(t.y) > .9 ? new s(1, 0, 0) : new s(0, 1, 0)).normalize(), r = new s().crossVectors(t, n), i = e.clone().add(c(e)), a = e.clone().addScaledVector(n, .005), o = e.clone().addScaledVector(r, .005);
		a.add(c(a)).sub(i), o.add(c(o)).sub(i);
		let l = a.cross(o).normalize();
		return l.dot(t) < 0 && l.negate(), {
			point: i,
			normal: l
		};
	}, u = `uniform float skinTime;uniform float skinAmplitude;uniform float skinFrequency;uniform vec4 skinHoles[${V}];uniform vec3 skinNormals[${V}];varying vec3 skinPoint;
 vec3 skinOffset(vec3 p){float f=skinFrequency;float t=skinTime;vec3 d=skinAmplitude*vec3(sin(p.y*f+sin(p.z*f*.7+t)*.8+t*1.3),sin(p.z*f*.91+sin(p.x*f*.8-t)*.7+t*1.1),sin(p.x*f*.83+sin(p.y*f*.6+t)*.8-t*1.2));for(int i=0;i<${V};i++){vec4 h=skinHoles[i];if(h.w>0.){vec3 q=p-h.xyz;float z=dot(q,skinNormals[i]);q-=skinNormals[i]*z;float r=length(q);if(abs(z)<(h.w*2.+.3)&&r>.00001&&r<h.w*1.8)d+=q*(h.w*1.8-r)*.48/r;}}return d;}`, d = `varying vec3 skinPoint;uniform vec4 skinHoles[${V}];uniform vec3 skinNormals[${V}];`;
	function p(n) {
		n.onBeforeCompile = (n) => {
			Object.assign(n.uniforms, {
				skinTime: r,
				skinAmplitude: { value: e },
				skinFrequency: { value: t },
				skinHoles: i,
				skinNormals: a
			}), n.vertexShader = u + "\n" + n.vertexShader, n.vertexShader = n.vertexShader.replace("#include <begin_vertex>", "vec3 transformed=position+skinOffset(position);skinPoint=position;"), n.fragmentShader = d + "\n" + n.fragmentShader, n.fragmentShader = n.fragmentShader.replace("void main() {", `void main() {for(int i=0;i<${V};i++){vec4 h=skinHoles[i];if(h.w>0.){vec3 q=skinPoint-h.xyz;float z=dot(q,skinNormals[i]);if(abs(z)<(h.w*2.+.3)&&length(q-skinNormals[i]*z)<h.w*.83)discard;}}`);
		}, n.customProgramCacheKey = () => `living-cortex-${e}-${t}`, n.needsUpdate = !0;
	}
	function m(e) {
		for (let t of Array.isArray(e.material) ? e.material : [e.material]) p(t);
		let t = new oe({ depthPacking: n }), r = new M();
		p(t), p(r), e.customDepthMaterial = t, e.customDistanceMaterial = r, e.frustumCulled = !1;
	}
	return {
		time: r,
		holes: i,
		normals: a,
		amplitude: e,
		sample: l,
		delta: c,
		apply: m,
		clear() {
			i.value.forEach((e) => e.w = 0);
		},
		opening(e, t, n, r) {
			e >= V || (i.value[e].set(t.x, t.y, t.z, r), a.value[e].copy(n));
		}
	};
}
//#endregion
//#region app/brain-room/lib/loose-props.ts
var pe = [
	"brain",
	"lungs",
	"heart",
	"liver",
	"bones",
	"stomach",
	"dentures",
	"eyes"
], H = {
	yoohoo: "/media/can-labels/yoohoo-yellow.png",
	pepsi: "/media/can-labels/pepsi.png",
	monster: "/media/can-labels/monster-energy.png",
	"rat-meat": "/media/can-labels/rat-meat-classic.jpg",
	"rat-meat-silver": "/media/can-labels/rat-meat-silver.jpg",
	"rat-meat-gold": "/media/can-labels/rat-meat-gold.jpg"
};
function me(n) {
	let a = new r();
	a.name = n + " can";
	let o = new w({
		color: 16777215,
		metalness: .58,
		roughness: .26,
		clearcoat: .8
	});
	typeof document < "u" && (o.map = new t().load(H[n] || H.yoohoo), o.map.colorSpace = i);
	let s = new N({
		color: n === "rat-meat-gold" ? 15318616 : 13028304,
		metalness: .92,
		roughness: .21
	}), c = new e(new F(.18, .18, .51, 48, 4), [
		o,
		s,
		s
	]);
	a.add(c);
	for (let t of [-.255, .255]) {
		let n = new e(new v(.166, .014, 10, 48), s);
		n.rotation.x = Math.PI / 2, n.position.y = t, a.add(n);
	}
	let l = new e(new v(.039, .009, 8, 16), s);
	return l.rotation.x = Math.PI / 2, l.scale.z = 1.5, l.position.set(0, .263, .025), a.add(l), a.userData = {
		kind: n,
		radius: .25,
		soft: !1
	}, a;
}
function U(t) {
	if (H[t]) return me(t);
	let n = new r();
	n.name = t;
	let i = new w({
		color: 12543348,
		roughness: .38,
		clearcoat: .5,
		sheen: .2
	}), a = new w({
		color: 14983339,
		roughness: .43,
		clearcoat: .4
	}), o = new w({
		color: 10368074,
		roughness: .36,
		clearcoat: .7
	}), c = new N({
		color: 5327751,
		roughness: .45
	}), u = new N({
		color: 15327175,
		roughness: .48
	}), d = new m(1, 40, 28), f = [], h = (t, r, i, a = n) => {
		let o = new e(d, t);
		return o.position.set(r[0], r[1], r[2]), o.scale.set(i[0], i[1], i[2]), a.add(o), o;
	}, g = (t, r, i, a = n) => {
		let o = new e(new l(new k(t.map((e) => new s(...e))), 32, r, 12, !1), i);
		return a.add(o), o;
	};
	if (t === "brain") {
		for (let e of [-1, 1]) {
			h(a, [
				e * .12,
				0,
				0
			], [
				.17,
				.22,
				.26
			]);
			for (let t = 0; t < 12; t++) {
				let n = t / 12 * Math.PI * 2;
				g(Array.from({ length: 16 }, (r, i) => {
					let a = i / 15 * Math.PI;
					return [
						e * .12 + Math.cos(n) * Math.sin(a) * .155,
						Math.cos(a) * .22,
						Math.sin(n) * Math.sin(a) * .253 + Math.sin(i * 1.6 + t) * .015
					];
				}), .021, i);
			}
		}
		g([
			[
				0,
				-.17,
				-.13
			],
			[
				0,
				-.26,
				-.15
			],
			[
				.025,
				-.33,
				-.12
			]
		], .054, a);
	} else if (t === "lungs") {
		for (let e of [-1, 1]) {
			let t = new r();
			t.position.x = e * .18, n.add(t), f.push(t), h(a, [
				0,
				-.04,
				0
			], [
				.17,
				.31,
				.145
			], t), h(i, [
				e * .015,
				-.17,
				.02
			], [
				.16,
				.14,
				.13
			], t), g([
				[
					0,
					.09,
					.13
				],
				[
					e * .08,
					-.04,
					.137
				],
				[
					e * .025,
					-.13,
					.145
				]
			], .008, c, t), g([
				[
					0,
					.17,
					0
				],
				[
					-e * .13,
					.24,
					0
				],
				[
					-e * .18,
					.32,
					0
				]
			], .046, u, t);
		}
		g([
			[
				0,
				.21,
				0
			],
			[
				0,
				.4,
				0
			],
			[
				0,
				.49,
				0
			]
		], .052, a);
		for (let t = 0; t < 7; t++) {
			let r = new e(new v(.053, .01, 8, 20), u);
			r.rotation.x = Math.PI / 2, r.position.y = .26 + t * .035, n.add(r);
		}
	} else if (t === "heart") {
		h(o, [
			0,
			-.05,
			0
		], [
			.2,
			.24,
			.16
		]).rotation.z = -.3, h(i, [
			-.12,
			.11,
			.015
		], [
			.115,
			.12,
			.13
		]), h(o, [
			.1,
			.14,
			-.02
		], [
			.11,
			.11,
			.13
		]), g([
			[
				-.03,
				.12,
				-.04
			],
			[
				-.05,
				.33,
				-.04
			],
			[
				.06,
				.37,
				-.04
			],
			[
				.14,
				.29,
				-.04
			]
		], .045, o);
		for (let e of [
			-.07,
			.01,
			.08
		]) g([[
			e,
			.31,
			-.04
		], [
			e,
			.42,
			-.05
		]], .023, o);
		g([
			[
				.1,
				.04,
				.1
			],
			[
				.2,
				.21,
				.08
			],
			[
				.24,
				.27,
				.07
			]
		], .035, c), g([
			[
				0,
				.15,
				.159
			],
			[
				.05,
				.03,
				.161
			],
			[
				0,
				-.11,
				.14
			],
			[
				-.05,
				-.21,
				.095
			]
		], .008, u);
	} else if (t === "liver") h(new w({
		color: 7617348,
		roughness: .34,
		clearcoat: .6
	}), [
		-.08,
		0,
		0
	], [
		.31,
		.18,
		.19
	]).rotation.z = .16, h(o, [
		.21,
		-.02,
		0
	], [
		.19,
		.105,
		.155
	]).rotation.z = -.3, h(new N({ color: 7639392 }), [
		.05,
		-.14,
		.08
	], [
		.047,
		.1,
		.05
	]);
	else if (t === "bones") {
		let e = new r();
		n.add(e), g([
			[
				0,
				-.29,
				0
			],
			[
				.025,
				0,
				0
			],
			[
				0,
				.3,
				0
			]
		], .059, u, e);
		for (let t of [-.3, .3]) for (let n of [-.05, .05]) h(u, [
			n,
			t,
			0
		], [
			.072,
			.075,
			.075
		], e);
		e.rotation.z = .4;
		let t = e.clone();
		t.position.x = .17, t.scale.setScalar(.7), t.rotation.z = -.3, n.add(t);
	} else if (t === "stomach") {
		h(a, [
			.02,
			-.15,
			0
		], [
			.22,
			.25,
			.14
		]).rotation.z = -.35, h(i, [
			-.14,
			-.27,
			0
		], [
			.18,
			.11,
			.105
		]), g([
			[
				-.25,
				-.28,
				0
			],
			[
				-.32,
				-.23,
				0
			],
			[
				-.29,
				-.13,
				0
			]
		], .04, a);
		let t = n;
		for (let e = 0; e < 7; e++) {
			let n = new r();
			n.position.set(e === 0 ? .09 : 0, e === 0 ? .06 : .085, 0), t.add(n), h(a, [
				0,
				.044,
				0
			], [
				.046,
				.052,
				.046
			], n), f.push(n), t = n;
		}
		h(i, [
			0,
			.11,
			.05
		], [
			.078,
			.11,
			.026
		], t);
		for (let t = 0; t < 5; t++) {
			let r = new e(new v(.052, .009, 8, 20), u);
			r.rotation.x = Math.PI / 2, r.position.set(.16, .2 + t * .048, -.02), n.add(r);
		}
	} else if (t === "dentures") for (let t of [-1, 1]) {
		let i = new r();
		i.position.y = t * .06, n.add(i), f.push(i);
		let o = new e(new v(.18, .044, 12, 40, Math.PI * 1.5), a);
		o.rotation.x = Math.PI / 2, o.rotation.z = -Math.PI * .25, i.add(o);
		for (let e = 0; e < 14; e++) {
			let n = -Math.PI * .25 + e / 13 * Math.PI * 1.5;
			h(u, [
				Math.cos(n) * .18,
				t * .048,
				Math.sin(n) * .18
			], [
				.032,
				.056,
				.036
			], i);
		}
	}
	else if (t === "eyes") for (let e of [-1, 1]) {
		let t = new r();
		t.position.x = e * .125, n.add(t), f.push(t), h(new w({
			color: 16116444,
			roughness: .16,
			clearcoat: 1
		}), [
			0,
			0,
			0
		], [
			.11,
			.115,
			.115
		], t), h(new w({
			color: 5739435,
			roughness: .15
		}), [
			0,
			0,
			.102
		], [
			.055,
			.058,
			.02
		], t), h(new O({ color: 791844 }), [
			0,
			0,
			.119
		], [
			.027,
			.032,
			.008
		], t), h(u, [
			-.016,
			.025,
			.126
		], [
			.014,
			.014,
			.008
		], t), g([
			[
				0,
				0,
				-.1
			],
			[
				.02,
				-.06,
				-.18
			],
			[
				-.01,
				-.08,
				-.26
			]
		], .018, a, t);
	}
	else if (t === "worm") {
		a.color.setHex(B[Math.floor(Math.random() * B.length)]);
		let e = n;
		for (let t = 0; t < 14; t++) {
			let n = new r();
			n.position.set(0, 0, t === 0 ? -.42 : .067), e.add(n), h(a, [
				0,
				0,
				0
			], [
				.065,
				.065,
				.065
			], n), f.push(n), e = n;
		}
		for (let t of [-1, 1]) h(u, [
			t * .025,
			.025,
			.045
		], [
			.018,
			.018,
			.018
		], e);
	} else {
		let t = new p(.24, 3), r = t.getAttribute("position");
		for (let e = 0; e < r.count; e++) {
			let t = 1 + .1 * Math.sin(r.getX(e) * 29 + r.getY(e) * 17);
			r.setXYZ(e, r.getX(e) * t, r.getY(e) * t * .8, r.getZ(e) * t);
		}
		t.computeVertexNormals(), n.add(new e(t, new N({
			color: 7830929,
			roughness: .82
		})));
	}
	return n.traverse((t) => {
		t instanceof e && (t.castShadow = t.receiveShadow = !0);
	}), n.userData = {
		kind: t,
		soft: t !== "rock" && t !== "bones",
		radius: t === "stomach" ? .34 : t === "lungs" ? .35 : .26,
		flex: f,
		flexVelocity: f.map(() => 0)
	}, n;
}
function W(e, t, n, r) {
	let { flex: i = [], flexVelocity: a = [] } = e.userData;
	i.forEach((i, o) => {
		let s = Math.sin(t * 2.5 - o * .65) * (.045 + Math.min(r, 10) * .025);
		a[o] += ((s - i.rotation.z) * 35 - a[o] * 7) * n, i.rotation.z += a[o] * n, e.userData.kind === "worm" && (i.rotation.y = Math.sin(t * 3 - o * .55) * .13, i.rotation.z = 0), i.rotation.x = Math.sin(t * 2 - o * .4) * .06;
	});
	let o = e.userData.soft ? Math.min(.13, r * .01) : 0, c = e.userData.baseScale || new s(1, 1, 1);
	e.scale.set(c.x * (1 + Math.sin(t * 6) * o), c.y * (1 - Math.sin(t * 6) * o), c.z);
}
//#endregion
//#region app/brain-room/lib/cows.ts
function he(t, n = 8) {
	let i = L(), a = new N({
		color: 15656919,
		roughness: .85
	}), o = new N({
		color: 2367782,
		roughness: .65
	}), s = new N({
		color: 14260889,
		roughness: .7
	}), c = new N({
		color: 13876633,
		roughness: .7
	}), l = new m(1, 36, 24), u = (t, n, r, i) => {
		let a = new e(l, n);
		return a.position.set(r[0], r[1], r[2]), a.scale.set(i[0], i[1], i[2]), a.castShadow = a.receiveShadow = !0, t.add(a), a;
	}, d = (e, t, n) => {
		let r = new A();
		return r.position.set(t[0], t[1], t[2]), r.name = n, e.add(r), r;
	}, f = [];
	for (let l = 0; l < n; l++) {
		let n = new r();
		n.name = `Pasture cow ${l + 1}`, n.position.set(-17 - t() * 23, 0, -10 + t() * 27), u(n, i, [
			0,
			1.16,
			0
		], [
			.63,
			.61,
			1.13
		]), u(n, i, [
			0,
			1.33,
			.8
		], [
			.37,
			.45,
			.46
		]);
		let p = d(n, [
			0,
			1.42,
			1.06
		], "Neck and head");
		u(p, i, [
			0,
			0,
			.12
		], [
			.3,
			.39,
			.34
		]), u(p, s, [
			0,
			-.15,
			.4
		], [
			.3,
			.18,
			.18
		]);
		let m = [];
		for (let t of [-1, 1]) {
			u(p, o, [
				t * .245,
				.09,
				.3
			], [
				.06,
				.067,
				.047
			]), u(p, a, [
				t * .25,
				.11,
				.338
			], [
				.017,
				.018,
				.008
			]), u(p, o, [
				t * .14,
				-.12,
				.55
			], [
				.048,
				.025,
				.016
			]);
			let n = d(p, [
				t * .29,
				.23,
				.01
			], "Ear");
			n.rotation.z = -t * .2, u(n, i, [
				t * .12,
				0,
				0
			], [
				.22,
				.073,
				.12
			]), u(n, s, [
				t * .13,
				.031,
				.045
			], [
				.15,
				.024,
				.067
			]), m.push(n);
			let r = new e(new x(.062, .29, 12), c);
			r.position.set(t * .19, .45, .025), r.rotation.z = -t * .35, p.add(r);
		}
		let h = [], g = [];
		for (let e of [-.4, .4]) for (let t of [-.69, .69]) {
			let r = d(n, [
				e,
				.94,
				t
			], "Hip");
			u(r, i, [
				0,
				-.19,
				0
			], [
				.105,
				.25,
				.115
			]);
			let s = d(r, [
				0,
				-.42,
				0
			], "Knee");
			u(s, a, [
				0,
				-.19,
				0
			], [
				.075,
				.25,
				.075
			]);
			for (let e of [-1, 1]) u(s, o, [
				e * .041,
				-.43,
				.035
			], [
				.041,
				.065,
				.12
			]);
			h.push(r), g.push(s);
		}
		u(n, s, [
			0,
			.64,
			-.38
		], [
			.21,
			.15,
			.25
		]);
		for (let e of [-.09, .09]) for (let t of [-.48, -.28]) u(n, s, [
			e,
			.51,
			t
		], [
			.032,
			.08,
			.032
		]);
		let _ = [], v = n;
		for (let e = 0; e < 6; e++) {
			let t = d(v, e === 0 ? [
				0,
				1.36,
				-1.08
			] : [
				0,
				-.15,
				-.025
			], `Tail bone ${e}`);
			u(t, e === 5 ? o : a, [
				0,
				-.078,
				-.013
			], e === 5 ? [
				.065,
				.14,
				.06
			] : [
				.025,
				.1,
				.025
			]), _.push(t), v = t;
		}
		f.push({
			root: n,
			legs: h,
			knees: g,
			tail: _,
			head: p,
			ears: m,
			spring: [
				,
				,
				,
				,
				,
				,
			].fill(0),
			phase: t() * 6.28,
			origin: n.position.clone(),
			travel: 0,
			stride: 0
		});
	}
	return f;
}
function ge(e, t, n) {
	let r = Math.sin(t * .18 + e.phase) > .86;
	r || (e.travel += n * .12, e.stride += n * 3.2);
	let i = e.travel + e.phase;
	e.root.position.set(e.origin.x + Math.cos(i) * 3.2, 0, e.origin.z + Math.sin(i) * 2.4), e.root.rotation.y = Math.atan2(-Math.sin(i) * 3.2, Math.cos(i) * 2.4), e.head.rotation.x = b.damp(e.head.rotation.x, r ? .78 : .04 + Math.sin(e.stride) * .025, 7, n), e.legs.forEach((t, n) => {
		let i = e.stride + [
			0,
			Math.PI,
			Math.PI,
			0
		][n], a = r ? 0 : Math.cos(i) * .24, o = .94 - (.065 + (r ? 0 : Math.max(0, Math.sin(i)) * .16)), s = b.clamp(Math.hypot(a, o), .15, .858), c = Math.PI - Math.acos(b.clamp((.37 - s * s) / (2 * .42 * .44), -1, 1));
		t.rotation.x = -Math.atan2(a, o) - Math.acos(b.clamp((.42 * .42 + s * s - .44 * .44) / (2 * .42 * s), -1, 1)), e.knees[n].rotation.x = c;
	}), e.tail.forEach((r, i) => {
		let a = .11 * Math.sin(t * 2.2 + e.phase - i * .45) + (i === 0 ? .13 : 0);
		e.spring[i] += ((a - r.rotation.z) * 28 - e.spring[i] * 7) * n, r.rotation.z += e.spring[i] * n, r.rotation.x = .07 + Math.sin(t * 1.5 - i * .4) * .035;
	}), e.ears.forEach((n, r) => n.rotation.x = Math.sin(t * 2.4 + e.phase + r) * .12);
}
//#endregion
//#region app/brain-room/lib/cortex-shell.ts
function _e(n, c = {}) {
	let u = new r();
	u.name = "Organic cortical shell";
	let d = new w({
		color: 14725286,
		roughness: .44,
		clearcoat: .32,
		sheen: .2
	});
	if (d.name = "Cortex tissue", typeof document < "u") {
		let e = new t().load("/brain-room/cortex.png");
		e.colorSpace = i, e.wrapS = e.wrapT = o, e.anisotropy = 8, d.map = d.bumpMap = e, d.bumpScale = .012;
	}
	let f = new p(1, c.detail ?? 54), m = f.getAttribute("position"), h = f.getAttribute("uv"), g = [], _ = [];
	for (let e = 0; e < m.count; e += 3) {
		let t = [
			0,
			1,
			2
		].map((t) => n(new s().fromBufferAttribute(m, e + t).normalize()).point);
		if (!c.skip?.(t[0].clone().add(t[1]).add(t[2]).divideScalar(3))) for (let n = 0; n < 3; n++) g.push(...t[n].toArray()), _.push(h.getX(e + n) * 2, h.getY(e + n) * 2);
	}
	f.dispose();
	let v = new j();
	v.setAttribute("position", new a(g, 3)), v.setAttribute("uv", new a(_, 2)), v.computeVertexNormals();
	let y = d.clone();
	y.name = "Cortex recesses", y.color.setHex(12094857), u.add(new e(v, y));
	let b = [], x = c.count ?? 540, S = c.radius ?? .037;
	for (let e = 0; e < x; e++) {
		let t = 1 - 2 * (e + .5) / x, r = e * 2.39996323, i = new s(Math.sqrt(1 - t * t) * Math.cos(r), t, Math.sqrt(1 - t * t) * Math.sin(r)), a = new s(0, 1, 0), o = new s().crossVectors(i, Math.abs(t) > .9 ? new s(1, 0, 0) : a).normalize().applyAxisAngle(i, Math.sin(e * 127.1) * Math.PI), u = new s().crossVectors(i, o).normalize(), d = [];
		for (let t = 0; t < 13; t++) {
			let r = t / 12 - .5, a = e % 4 == 0 ? Math.cos(r * Math.PI * 3.1 + e) * (.07 + (r + .5) * .1) : r * .56, s = e % 4 == 0 ? Math.sin(r * Math.PI * 3.1 + e) * (.07 + (r + .5) * .1) : Math.sin(r * 15 + e * 1.8) * .065 + Math.sin(r * 23 + e) * .014, c = n(i.clone().addScaledVector(o, a).addScaledVector(u, s).normalize());
			d.push(c.point.addScaledVector(c.normal, S * .2));
		}
		if (d.some((e) => c.skip?.(e))) continue;
		let f = new k(d), p = new l(f, c.segments ?? 38, S * (.86 + .15 * Math.sin(e)), c.radial ?? 10, !1), m = p.getAttribute("uv");
		for (let e = 0; e < m.count; e++) m.setX(e, m.getX(e) * f.getLength() / 1.6);
		b.push(p);
	}
	let C = R(b);
	return b.forEach((e) => e.dispose()), C && u.add(new e(C, d)), u.traverse((t) => {
		t instanceof e && (t.castShadow = t.receiveShadow = !0);
	}), u;
}
function ve(e) {
	let t = [-1, 1].map((e) => ({
		center: new s(e * .52, .12, -.04),
		axes: new s(.9676, 1.2036, 1.3924)
	})), n = 0, r = t[0];
	for (let i of t) {
		let t = e.clone().divide(i.axes), a = i.center.clone().divide(i.axes), o = t.dot(t), s = t.dot(a), c = s * s - o * (a.dot(a) - 1);
		if (c >= 0) {
			let e = (s + Math.sqrt(c)) / o;
			e > n && (n = e, r = i);
		}
	}
	let i = e.clone().multiplyScalar(n);
	return {
		point: i,
		normal: i.clone().sub(r.center).divide(r.axes).divide(r.axes).normalize()
	};
}
function ye(t) {
	let n = new r();
	n.name = "Swaying dream tree";
	let i = new N({
		color: t % 2 ? 6833248 : 4867667,
		roughness: .83
	}), a = new w({
		color: t % 3 ? 7117170 : 8552613,
		roughness: .7,
		sheen: .5
	}), o = 4 + t % 3 * .65, c = new k([
		new s(),
		new s(.25, o * .35, .12),
		new s(-.18, o * .7, 0),
		new s(.25, o, 0)
	]);
	n.add(new e(new l(c, 36, .19, 14, !1), i));
	for (let t = 0; t < 7; t++) {
		let r = t * 2.4, u = new s(Math.cos(r) * 1.9, o - .7 + Math.sin(t) * .6, Math.sin(r) * 1.7);
		n.add(new e(new l(new k([
			c.getPoint(.6),
			u.clone().multiplyScalar(.7).add(new s(0, 1, 0)),
			u
		]), 20, .07, 10, !1), i));
		let d = new e(new m(1, 28, 18), a);
		d.position.copy(u), d.scale.set(1.1, .63, .95), n.add(d);
	}
	return n.traverse((t) => {
		t instanceof e && (t.castShadow = t.receiveShadow = !0);
	}), n;
}
//#endregion
//#region app/lib/homeBrain.ts
var G = [
	...[-1, 1].map((e) => ({
		center: new s(e * .52, .12, -.04),
		axes: new s(.9676, 1.2036, 1.3924)
	})),
	...[-1, 1].map((e) => ({
		center: new s(e * .72, -.48, .3),
		axes: new s(.546, .434, .714)
	})),
	{
		center: new s(0, -.88, -.72),
		axes: new s(.798, .406, .476)
	}
];
function be(e) {
	let t = 0, n = G[0];
	for (let r of G) {
		let i = e.clone().divide(r.axes), a = r.center.clone().divide(r.axes), o = i.dot(i), s = i.dot(a), c = s * s - o * (a.dot(a) - 1);
		if (c < 0) continue;
		let l = (s + Math.sqrt(c)) / o;
		l > t && (t = l, n = r);
	}
	let r = e.clone().multiplyScalar(t);
	return {
		point: r,
		normal: r.clone().sub(n.center).divide(n.axes).divide(n.axes).normalize()
	};
}
function xe(t, n = {}) {
	let i = new r(), a = n.surface || be, o = n.skin || fe(.045, 5), c = n.unit ?? 1, l = n.center || new s(), d = !1, f = 0;
	if (n.shell !== !1) {
		let t = _e(a, {
			count: 650,
			radius: .07
		});
		t.traverse((t) => {
			t instanceof e && o.apply(t);
		}), i.add(t);
		let n = new e(new D(.19, .72, 10, 20), new w({
			color: 13008798,
			roughness: .5,
			clearcoat: .35
		}));
		n.position.set(.06, -1.42, -.46), n.rotation.z = -.11, i.add(n), i.rotation.z = -.08;
	}
	let p = [], _ = new w({
		color: 1444641,
		roughness: .15,
		clearcoat: 1
	}), v = () => {
		let e = new s();
		for (let t = 0; t < 80 && (e.randomDirection(), !(!n.valid || n.valid(e))); t++);
		return e;
	};
	function x(t = !1, o = !1) {
		if (p.length >= 12) return;
		let s = p.length, u = new r(), d = (.05 + s % 5 * .008) * c, f = 10 + s * 3 % 7, h = t ? 2.1 * c : f * d * 1.45, y = v(), b = {
			group: u,
			direction: y,
			heading: v().projectOnPlane(y).normalize(),
			target: v(),
			history: [],
			age: o ? 20 : s * 3.17,
			turnAt: 0,
			speed: t ? .21 : .24 + s % 3 * .035,
			spacing: d * 1.45,
			radius: (t ? .075 * c : d) + (n.surfaceLift ?? .085),
			monkey: t,
			entryDirection: y.clone(),
			exitDirection: y.clone(),
			lastCycle: o ? 19.9 : 0,
			length: h,
			thickness: d
		};
		if (!t) {
			let t = B[Math.floor(Math.random() * B.length)], n = new w({
				color: t,
				vertexColors: !0,
				roughness: .43,
				clearcoat: .7,
				sheen: .3
			}), i = new Float32Array(637 * 3), a = new Float32Array(i.length), o = new Float32Array(i.length), s = [];
			for (let e = 0; e <= 48; e++) for (let t = 0; t <= 12; t++) {
				let n = e * 13 + t, r = .88 + .12 * (.5 + .5 * Math.cos(e * Math.PI));
				o.set([
					r,
					r,
					r
				], n * 3), e < 48 && t < 12 && s.push(n, n + 12 + 1, n + 1, n + 1, n + 12 + 1, n + 12 + 2);
			}
			let c = new j();
			c.setAttribute("position", new E(i, 3).setUsage(g)), c.setAttribute("normal", new E(a, 3).setUsage(g)), c.setAttribute("color", new E(o, 3)), c.setIndex(s), b.geometry = c;
			let l = new e(c, n);
			l.castShadow = !0, l.frustumCulled = !1, u.add(l);
			let f = n.clone();
			f.vertexColors = !1;
			let p = new r(), h = new e(new m(d, 20, 14), f);
			p.add(h), b.head = p, u.add(p);
			for (let t of [-1, 1]) {
				let n = new e(new m(d * .19, 12, 8), _);
				n.position.set(t * d * .48, d * .54, d * .63), p.add(n);
			}
			b.tail = new e(h.geometry, f), u.add(b.tail);
		}
		for (let e = 0; e < 180; e++) {
			let t = y.clone().addScaledVector(b.heading, -e / 179 * h / Math.max(.5, a(y).point.distanceTo(l))).normalize(), n = a(o ? y : t);
			b.history.push({
				point: n.point.clone(),
				normal: n.normal.clone(),
				offset: o ? -c * .55 : b.radius
			});
		}
		return p.push(b), i.add(u), b;
	}
	for (let e = 0; e < (n.count ?? 8); e++) x();
	let S = x(!0), T = new u();
	T.onLoad = () => {
		d || t();
	}, T.onError = T.onLoad, typeof document < "u" && new z(T).load("/models/monkey-centipede.fbx", (t) => {
		if (d) {
			K(t);
			return;
		}
		t.updateMatrixWorld(!0);
		let n = new C().setFromObject(t), r = n.getCenter(new s()), i = 2.1 / n.getSize(new s()).z, a = Array.from({ length: 32 }, () => new s()), o = a.map(() => new s(0, 1, 0)), l = a.map(() => new s(0, 0, 1)), u = { value: 0 }, f = { value: new y() };
		S.spine = {
			positions: a,
			normals: o,
			tangents: l,
			time: u,
			look: f
		}, t.traverse((t) => {
			if (!(t instanceof e)) return;
			let s = t.geometry.clone().applyMatrix4(t.matrixWorld);
			s.translate(-r.x, -n.min.y, -r.z), s.scale(i, i * .72, i);
			let d = new N({
				color: 7031092,
				roughness: .92
			});
			d.onBeforeCompile = (e) => {
				e.uniforms.trailP = { value: a }, e.uniforms.trailN = { value: o }, e.uniforms.trailT = { value: l }, e.uniforms.crawlTime = u, e.uniforms.headLook = f, e.uniforms.creatureUnit = { value: c }, e.vertexShader = "uniform float creatureUnit;uniform vec3 trailP[32];uniform vec3 trailN[32];uniform vec3 trailT[32];uniform float crawlTime;uniform vec2 headLook;\n" + e.vertexShader, e.vertexShader = e.vertexShader.replace("#include <beginnormal_vertex>", "float trailIndex=clamp((1.05-position.z)/2.1*31.0,0.0,30.999);int ti=int(floor(trailIndex));float blend=fract(trailIndex);vec3 n=normalize(mix(trailN[ti],trailN[ti+1],blend));vec3 t=normalize(mix(trailT[ti],trailT[ti+1],blend));vec3 side=normalize(cross(n,t));n=normalize(cross(t,side));mat3 basis=mat3(side,n,t);vec3 objectNormal=basis*normal;"), e.vertexShader = e.vertexShader.replace("#include <begin_vertex>", "vec3 local=position;float head=smoothstep(.52,1.02,-position.z);local.xy*=1.0+head*.30;local.x+=head*headLook.x*.13;local.y+=head*headLook.y*.09;float feet=1.0-smoothstep(.04,.24,position.y);float stepWave=max(0.0,sin(crawlTime*8.0+trailIndex*1.42+sign(position.x)*3.14159));local.y+=feet*stepWave*.075;local.x+=feet*sin(crawlTime*8.0+trailIndex*1.42)*.025;vec3 transformed=mix(trailP[ti],trailP[ti+1],blend)+basis*vec3(local.x,local.y-.075,0.0)*creatureUnit;"), e.fragmentShader = e.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\nfloat furGrain=fract(sin(dot(vViewPosition,vec3(167.1,311.7,74.7)))*43758.5453);diffuseColor.rgb*=.78+.32*furGrain;");
			};
			let p = new e(s, d);
			p.frustumCulled = !1, p.castShadow = !0, S.group.add(p);
		}), K(t);
	}, void 0, () => {
		console.warn("Monkey-centipede model could not load."), t();
	});
	let O = b.smoothstep;
	function k(e, t) {
		let n = a(e.direction);
		e.history.unshift({
			point: n.point,
			normal: n.normal,
			offset: t
		}), e.history.length > 600 && e.history.pop();
	}
	function ee(e) {
		f += e, o.time.value = f, o.clear();
		for (let [t, r] of p.entries()) {
			r.age += e;
			let i = r.age % 30;
			if (i >= 12 && r.lastCycle < 12 && (r.entryDirection.copy(r.direction), r.exitDirection.copy(v())), i >= 20 && r.lastCycle < 20) {
				r.direction.copy(r.exitDirection), r.history.length = 0;
				for (let e = 0; e < 180; e++) k(r, -c * .6);
			}
			let l = O(i, 11.7, 13) * (1 - O(i, 18.2, 19)), u = O(i, 19.3, 20.3) * (1 - O(i, 25.5, 27)), d = a(r.entryDirection), f = a(r.exitDirection), m = r.monkey ? .34 * c : r.thickness * 1.9;
			if (o.opening(t * 2, d.point, d.normal, m * l), o.opening(t * 2 + 1, f.point, f.normal, m * u), r.group.visible = i < 18.7 || i >= 20, i < 12 || i >= 24) {
				r.age >= r.turnAt && (r.target.copy(v()), r.turnAt = r.age + 2 + Math.random() * 3);
				let i = r.target.clone().projectOnPlane(r.direction).normalize();
				for (let e of p) {
					if (e === r || !e.group.visible) continue;
					let t = r.direction.clone().sub(e.direction), n = t.length();
					n > .001 && n < .19 * c && i.addScaledVector(t.projectOnPlane(r.direction).normalize(), (.19 * c - n) * 7);
				}
				r.heading.lerp(i.normalize(), 1 - Math.exp(-e * 1.7)).projectOnPlane(r.direction).normalize();
				let a = new s().crossVectors(r.direction, r.heading), o = r.direction.clone().addScaledVector(r.heading, r.speed * e).addScaledVector(a, Math.sin(r.age * 4.5 + t) * r.speed * e * .35).normalize();
				!n.valid || n.valid(o) ? r.direction.copy(o) : (r.target.copy(v()), r.heading.negate());
			} else i < 18.7 && r.direction.lerp(r.entryDirection, 1 - Math.exp(-e * 3)).normalize();
			let h = i < 20 ? O(i, 13, 17) : 1 - O(i, 20, 24);
			k(r, r.radius - h * (r.radius + c * .58)), r.lastCycle = i;
		}
	}
	function te(e, t) {
		for (let n = 1; n < e.history.length; n++) {
			let r = e.history[n - 1], i = e.history[n], a = r.point.distanceTo(i.point) + Math.abs(r.offset - i.offset);
			if (t <= a) {
				let e = a ? t / a : 0;
				return {
					point: r.point.clone().lerp(i.point, e),
					normal: r.normal.clone().lerp(i.normal, e).normalize(),
					offset: b.lerp(r.offset, i.offset, e)
				};
			}
			t -= a;
		}
		return e.history[e.history.length - 1];
	}
	function ne(e) {
		let t = a(e.point.clone().sub(l).normalize()), n = o.sample(t.point, t.normal);
		return n.point.addScaledVector(n.normal, e.offset), n;
	}
	let A = 0;
	return {
		root: i,
		skin: o,
		crawlers: p,
		spawnWorm() {
			return x(!1, !0);
		},
		update(e) {
			for (A += Math.min(e, .1); A >= 1 / 60;) ee(1 / 60), A -= 1 / 60;
			for (let e of p) {
				if (!e.group.visible) continue;
				let t = e.monkey ? 32 : 49, n = Array.from({ length: t }, (n, r) => {
					let i = te(e, r * e.length / (t - 1));
					if (!e.monkey) {
						let n = new s().crossVectors(i.normal, e.heading).normalize(), a = Math.sin(e.age * 4 - r * .3) * Math.sin(r / (t - 1) * Math.PI) * e.thickness * 1.65;
						i.point = i.point.clone().addScaledVector(n, a);
					}
					return ne(i);
				});
				for (let r = 0; r < t; r++) {
					let { point: i, normal: a } = n[r], o = n[Math.max(0, r - 1)].point, c = n[Math.min(t - 1, r + 1)].point, l = o.clone().sub(c);
					l.lengthSq() < 1e-7 && l.copy(e.heading), l.normalize();
					let u = new s().crossVectors(a, l).normalize(), d = new s().crossVectors(l, u).normalize();
					if (e.monkey && e.spine) e.spine.positions[r].copy(i), e.spine.normals[r].copy(d), e.spine.tangents[r].copy(l), e.spine.time.value = e.age, e.spine.look.value.set(Math.sin(e.age * .9), Math.sin(e.age * 1.37) * .7);
					else if (e.geometry) {
						let n = e.geometry.getAttribute("position"), a = e.geometry.getAttribute("normal");
						for (let t = 0; t <= 12; t++) {
							let o = t / 12 * Math.PI * 2, s = u.clone().multiplyScalar(Math.cos(o)).addScaledVector(d, Math.sin(o)), c = i.clone().addScaledVector(s, e.thickness);
							n.setXYZ(r * 13 + t, c.x, c.y, c.z), a.setXYZ(r * 13 + t, s.x, s.y, s.z);
						}
						r === 0 && (e.head.position.copy(i), e.head.quaternion.setFromRotationMatrix(new h().makeBasis(u, d, l))), r === t - 1 && e.tail.position.copy(i), n.needsUpdate = a.needsUpdate = !0;
					}
				}
			}
		},
		dispose() {
			d = !0, K(i);
		}
	};
}
function K(t) {
	let n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
	t.traverse((t) => {
		t instanceof e && (n.add(t.geometry), (Array.isArray(t.material) ? t.material : [t.material]).forEach((e) => r.add(e)));
	}), n.forEach((e) => e.dispose()), r.forEach((e) => e.dispose());
}
//#endregion
//#region app/brain-room/lib/environment-detail.ts
function q(e) {
	let t = new Uint8Array(256 * 256 * 4);
	for (let e = 0; e < 256; e++) for (let n = 0; n < 256; n++) {
		let r = n / 256, i = e / 256, a = Math.sin(i * 6.28) * .06 * Math.exp(-(((r - .43) * 6) ** 2)), o = Math.sin((r + a) * 260 + Math.sin(i * 8) * 1.8) * .055 + Math.sin(r * 730 + i * 15) * .027, s = Math.sin(Math.sqrt((r - .43) ** 2 + ((i - .48) * .25) ** 2) * 360) * Math.exp(-((r - .43) ** 2 * 90 + (i - .48) ** 2 * 13)) * .12, c = Math.max(0, Math.min(255, (.82 + o + s) * 255)), l = (e * 256 + n) * 4;
		t.set([
			c,
			c,
			c,
			255
		], l);
	}
	let n = new T(t, 256, 256);
	return n.needsUpdate = !0, n.wrapS = n.wrapT = o, n.magFilter = c, n.minFilter = _, n.generateMipmaps = !0, n.colorSpace = i, new N({
		color: e,
		map: n,
		bumpMap: n,
		bumpScale: .035,
		roughness: .79
	});
}
function Se(t, n) {
	let r = [];
	t.traverse((t) => {
		t instanceof e && t.geometry instanceof ae && t.geometry.parameters.height > 1 && r.push(t);
	});
	let i = new N({
		color: 7168593,
		metalness: .8,
		roughness: .38
	});
	for (let a of r) {
		let r = new e(new x(.12, .14, 4), n);
		r.position.copy(a.position), r.position.y += .86, r.rotation.y = Math.PI / 4, t.add(r);
		for (let n of [.55, 1.1]) for (let r of [-.081, .081]) {
			let o = new e(new m(.024, 8, 6), i);
			o.scale.z = .3, o.position.set(a.position.x, n, a.position.z + r), t.add(o);
		}
	}
}
//#endregion
//#region app/world/models/fixtures.ts
function J(t) {
	let n = new r();
	n.name = t;
	let i = new w({
		color: 4535134,
		metalness: .86,
		roughness: .22,
		clearcoat: 1
	}), a = new w({
		color: 16762450,
		metalness: 1,
		roughness: .12,
		clearcoat: 1
	}), o = new N({
		color: 15524039,
		roughness: .45
	}), c = new N({
		color: 2168367,
		roughness: .68
	}), u = new N({
		color: 9437090,
		emissive: 3800960,
		emissiveIntensity: 1.5
	}), d = (t, r, i = [
		0,
		0,
		0
	], a = n) => {
		let o = new e(t, r);
		return o.position.set(...i), o.castShadow = o.receiveShadow = !0, a.add(o), o;
	}, f = (e, t, n = i) => d(new ae(...e), n, t), p = (e, t, n = o) => {
		let r = d(new m(1, 28, 18), n, e);
		return r.scale.set(...t), r;
	}, h = (e, t, n = o) => d(new l(new k(e.map((e) => new s(...e))), 32, t, 12, !1), n), g = (e, t, n, r, i = .06) => {
		h([
			[
				e,
				t - r / 2,
				n
			],
			[
				e + .02,
				t,
				n
			],
			[
				e,
				t + r / 2,
				n
			]
		], i);
		for (let a of [-1, 1]) for (let o of [-1, 1]) p([
			e + o * i * .6,
			t + a * r / 2,
			n
		], [
			i * .9,
			i,
			i
		]);
	};
	if (t.startsWith("bone-")) {
		let e = t.slice(5);
		if (e === "skull") {
			p([
				0,
				.14,
				0
			], [
				.22,
				.26,
				.2
			]);
			for (let e of [-1, 1]) p([
				e * .085,
				.13,
				.178
			], [
				.063,
				.055,
				.035
			], c);
			p([
				0,
				.015,
				.19
			], [
				.028,
				.044,
				.027
			], c), h([
				[
					-.17,
					.03,
					.1
				],
				[
					-.14,
					-.12,
					.17
				],
				[
					0,
					-.17,
					.21
				],
				[
					.14,
					-.12,
					.17
				],
				[
					.17,
					.03,
					.1
				]
			], .033);
			for (let e = 0; e < 10; e++) p([
				(e - 4.5) * .024,
				-.1,
				.23
			], [
				.01,
				.023,
				.012
			]);
		} else if (e === "ribcage") {
			for (let e = 0; e < 10; e++) {
				let t = .45 - e * .085, n = .19 + Math.sin(e / 10 * Math.PI) * .15;
				for (let e of [-1, 1]) h([
					[
						0,
						t,
						-.13
					],
					[
						e * n,
						t + .01,
						-.03
					],
					[
						e * n,
						t - .045,
						.16
					],
					[
						e * .035,
						t - .085,
						.23
					]
				], .018);
			}
			g(0, .04, -.14, .9, .04), g(0, .1, .25, .55, .025);
		} else if (e === "spine") for (let e = 0; e < 24; e++) {
			let t = e * .045, n = Math.sin(e * .14) * .07;
			d(new F(.048, .055, .037, 12), o, [
				0,
				t,
				n
			]), f([
				.14,
				.016,
				.06
			], [
				0,
				t,
				n + .012
			], o);
		}
		else if (e === "pelvis") {
			for (let e of [-1, 1]) {
				let t = p([
					e * .15,
					.08,
					0
				], [
					.15,
					.2,
					.065
				]);
				t.rotation.z = -e * .35, d(new v(.087, .024, 10, 24), o, [
					e * .085,
					-.08,
					.02
				]);
			}
			p([
				0,
				.01,
				-.04
			], [
				.064,
				.13,
				.05
			]);
		} else if (e === "hand" || e === "foot") {
			let t = e === "foot";
			for (let e = 0; e < 5; e++) {
				let n = (e - 2) * .055, r = t ? .17 : .19;
				g(n, 0, 0, r, .018);
				for (let t = 0; t < 3; t++) g(n + (e - 2) * t * .006, r / 2 + .05 + t * .065, 0, .058, .012);
			}
			for (let e = 0; e < 8; e++) p([
				(e % 4 - 1.5) * .04,
				-.14 - Math.floor(e / 4) * .04,
				0
			], [
				.028,
				.027,
				.032
			]);
		} else e === "forearm" ? (g(-.047, 0, 0, .43, .027), g(.047, 0, .018, .45, .025)) : g(0, 0, 0, e === "femur" ? .5 : .38, e === "femur" ? .07 : .05);
	} else if (t === "tombstone") {
		let e = new ie();
		e.moveTo(-.55, 0), e.lineTo(.55, 0), e.lineTo(.55, 1.15), e.absarc(0, 1.15, .55, 0, Math.PI, !1), e.lineTo(-.55, 0);
		let t = new N({
			color: 6710649,
			roughness: .55,
			metalness: .25
		});
		d(new P(e, {
			depth: .22,
			bevelEnabled: !0,
			bevelSize: .055,
			bevelThickness: .055,
			bevelSegments: 3,
			steps: 1
		}), t), f([
			1.4,
			.2,
			.7
		], [
			0,
			.05,
			.1
		], t), f([
			.08,
			.53,
			.03
		], [
			0,
			.94,
			.3
		], a), f([
			.34,
			.07,
			.03
		], [
			0,
			1.07,
			.3
		], a);
	} else if (t === "altar") {
		d(new F(.85, 1.05, .22, 8), a, [
			0,
			.12,
			0
		]);
		for (let e of [-.55, .55]) for (let t of [-.35, .35]) d(new F(.09, .13, 1.25, 20), a, [
			e,
			.81,
			t
		]), d(new v(.13, .035, 8, 20), a, [
			e,
			1.18,
			t
		]).rotation.x = Math.PI / 2;
		f([
			1.8,
			.2,
			1.2
		], [
			0,
			1.47,
			0
		], a), f([
			1.6,
			.05,
			1.02
		], [
			0,
			1.6,
			0
		], c);
	} else if (t === "book") {
		f([
			.85,
			.08,
			1.06
		], [
			0,
			.04,
			0
		], c), f([
			.78,
			.21,
			.98
		], [
			0,
			.17,
			0
		], o), f([
			.85,
			.07,
			1.06
		], [
			0,
			.31,
			0
		], c);
		for (let e of [-.35, .35]) for (let t of [-.44, .44]) f([
			.13,
			.025,
			.13
		], [
			e,
			.36,
			t
		], a);
		d(new v(.2, .017, 8, 40), a, [
			0,
			.356,
			0
		]).rotation.x = Math.PI / 2;
		for (let e of [-.15, .15]) p([
			e,
			.36,
			.04
		], [
			.038,
			.018,
			.025
		], u);
		f([
			.04,
			.03,
			.6
		], [
			0,
			.36,
			0
		], a);
	} else if (t === "crystal") for (let e = 0; e < 9; e++) {
		let t = [
			5434769,
			9171324,
			3393184,
			7949285,
			13908066,
			3309279,
			15649618
		][e % 7], i = new w({
			color: t,
			emissive: t,
			emissiveIntensity: .15,
			metalness: .45,
			roughness: .14,
			clearcoat: 1
		}), a = new r();
		a.position.set(Math.sin(e * 2.4) * .55, .05, Math.cos(e * 2.4) * .55), a.rotation.z = Math.sin(e * 3) * .2;
		let o = 1.5 + e * 7 % 9 * .18;
		d(new F(.15, .22, o, 6), i, [
			0,
			o / 2,
			0
		], a), d(new x(.15, .55, 6), i, [
			0,
			o + .275,
			0
		], a), n.add(a);
	}
	else if (t === "fence") {
		let e = q(9201228);
		for (let t of [-1.5, 1.5]) f([
			.16,
			1.5,
			.16
		], [
			t,
			.75,
			0
		], e), d(new x(.14, .15, 4), e, [
			t,
			1.57,
			0
		]).rotation.y = Math.PI / 4;
		for (let t of [.5, 1.1]) f([
			3.1,
			.14,
			.12
		], [
			0,
			t,
			0
		], e);
	} else if (t === "alien-laser" || t === "cannon" || t === "anti-air") {
		let e = t !== "alien-laser", o = e ? .24 : .06, s = e ? 2.6 : .8;
		d(new F(e ? 1 : .16, e ? 1.2 : .2, .22, 16), i, [
			0,
			.12,
			0
		]), f([
			e ? .8 : .12,
			e ? .9 : .2,
			e ? 1 : .25
		], [
			0,
			e ? .6 : .1,
			0
		]);
		let l = t === "anti-air" ? [-.36, .36] : [0];
		for (let c of l) {
			let l = new r();
			l.position.set(c, e ? 1.25 : .18, 0), l.rotation.x = t === "anti-air" ? -.45 : 0;
			let f = d(new F(o, o * 1.15, s, 24, 1, !0), i, [
				0,
				0,
				s * .32
			], l);
			f.rotation.x = Math.PI / 2;
			for (let e = 0; e < 5; e++) d(new v(o * 1.2, o * .18, 8, 24), e % 2 ? a : u, [
				0,
				0,
				e * s / 6
			], l);
			n.add(l);
		}
		if (e) for (let e of [-.85, .85]) {
			let t = d(new F(.5, .5, .22, 24), c, [
				e,
				.5,
				-.2
			]);
			t.rotation.z = Math.PI / 2;
		}
	} else if (t === "warship") {
		let e = new ie();
		e.moveTo(-.9, -2.6), e.lineTo(.9, -2.6), e.lineTo(1.1, 1.9), e.quadraticCurveTo(.8, 2.8, 0, 3.3), e.quadraticCurveTo(-.8, 2.8, -1.1, 1.9), e.closePath();
		let t = d(new P(e, {
			depth: .65,
			bevelEnabled: !0,
			bevelSize: .18,
			bevelThickness: .18,
			bevelSegments: 3
		}), i);
		t.rotation.x = Math.PI / 2, t.position.y = .9, f([
			1.3,
			1.3,
			1.7
		], [
			0,
			1.45,
			-.5
		]), f([
			1.55,
			.45,
			1.2
		], [
			0,
			2.28,
			-.65
		], c);
		for (let e of [-1.8, 1.5]) {
			let t = J("cannon");
			t.scale.setScalar(.42), t.position.set(0, 1.02, e), n.add(t);
		}
		d(new F(.055, .07, 2, 12), a, [
			0,
			3,
			-.9
		]);
		for (let e of [-.94, .94]) for (let t = 0; t < 12; t++) f([
			.03,
			.35,
			.03
		], [
			e,
			1.1,
			-2.4 + t * .42
		], a);
	} else if (t === "ammo") for (let e = 0; e < 6; e++) d(new F(.033, .033, .14, 12), a, [
		e % 3 * .085,
		.07,
		Math.floor(e / 3) * .1
	]), d(new x(.033, .065, 12), i, [
		e % 3 * .085,
		.17,
		Math.floor(e / 3) * .1
	]);
	else if (t === "satellite") {
		f([
			.7,
			.5,
			.5
		], [
			0,
			0,
			0
		], a);
		for (let e of [-1, 1]) {
			f([
				1.15,
				.035,
				.8
			], [
				e,
				0,
				0
			], new w({
				color: 2443694,
				metalness: .8,
				roughness: .2
			}));
			for (let t = 0; t < 5; t++) f([
				.01,
				.045,
				.8
			], [
				e - .5 + t * .25,
				0,
				0
			], a);
		}
		d(new m(.33, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), i, [
			0,
			.3,
			0
		]);
	}
	return n;
}
new s(25, .5, -40);
function Ce(t) {
	let n = new r();
	n.name = "Crystal anatomy garden", n.position.set(26, 0, -57);
	let i = [], a = [], o = [], c = new e(new F(15, 15.5, .25, 72), new N({
		color: 3483970,
		roughness: .65,
		metalness: .2
	}));
	c.position.y = -.08, n.add(c);
	for (let e = 0; e < 21; e++) {
		let r = Math.PI * 1.16 + e / 20 * Math.PI * .68, i = 14 + Math.sin(e * 2.7) * .8, o = J("crystal");
		o.position.set(Math.cos(r) * i, 0, Math.sin(r) * i), o.scale.set(1.6 + e % 3 * .25, 3.6 + Math.sin(e * 1.3) * 1.1, 1.6), o.rotation.y = e * 2.4, n.add(o), a.push(o), t.push({
			center: o.position.clone().add(n.position).add(new s(0, 3, 0)),
			half: new s(1, 3, 1)
		});
	}
	for (let t = 0; t < 7; t++) {
		let r = J("tombstone");
		r.position.set((t - 3) * 2.35, 0, -1 + Math.sin(t * 1.1) * 1.2), r.rotation.y = Math.sin(t) * .18;
		let i = new e(new te(.83, .4), new N({
			map: I(["REST IN PIECES", String(t + 1).padStart(3, "0")], "#e2d6f0", "#4b4359"),
			roughness: .8
		}));
		i.position.set(0, .58, .3), r.add(i), n.add(r);
	}
	de.forEach((r, a) => {
		let o = .18 + a / 12 * Math.PI * .83, c = Math.cos(o) * 11.5, l = Math.sin(o) * 10 - 2, u = J("altar");
		u.position.set(c, 0, l), u.rotation.y = -o - Math.PI / 2, n.add(u);
		let d = J("book");
		d.position.set(0, 1.7, 0), d.rotation.x = -.18, d.scale.setScalar(1.35), d.userData.bookId = r.id, u.add(d), i.push(d);
		let f = new e(new te(1.45, .6), new N({
			map: I([
				String(a + 1).padStart(2, "0") + " / LIBRARY",
				r.title,
				r.subtitle
			], "#ffeac0", "#2b123d"),
			emissive: 5255709,
			emissiveIntensity: .3
		}));
		f.position.set(0, 1.1, .71), u.add(f), t.push({
			center: u.position.clone().add(n.position).add(new s(0, .65, 0)),
			half: new s(.75, .65, .75)
		});
	}), [
		"bone-skull",
		"bone-ribcage",
		"bone-spine",
		"bone-pelvis",
		"bone-humerus",
		"bone-forearm",
		"bone-femur",
		"bone-hand",
		"bone-foot"
	].forEach((e, t) => {
		let r = J(e);
		r.position.set((t % 5 - 2) * 1.5, 1 + t % 3 * .5, -5 - Math.floor(t / 5) * 2), r.rotation.z = (t - 4) * .15, n.add(r), o.push(r);
	}), pe.forEach((e, t) => {
		let r = U(e);
		r.position.set(Math.cos(t) * 5, 1.3 + Math.sin(t) * .4, -4 + Math.sin(t) * 3), n.add(r), o.push(r);
	}), o.forEach((e) => e.userData.restY = e.position.y);
	let l = new S(9830336, 40, 30, 2);
	l.position.set(0, 6, -4), n.add(l);
	let u = new S(13727743, 25, 24, 2);
	return u.position.set(0, 4, 4), n.add(u), {
		root: n,
		books: i,
		update(e, t) {
			a.forEach((t, n) => {
				t.rotation.z = Math.sin(e * .35 + n) * .012;
			}), o.forEach((n, r) => {
				n.position.y = n.userData.restY + Math.sin(e * .7 + r) * .16, n.rotation.y += t * .15, W(n, e, t, 1);
			}), i.forEach((t, n) => t.rotation.z = Math.sin(e * .4 + n) * .018);
		}
	};
}
//#endregion
//#region app/brain-room/lib/level.ts
var we = /* @__PURE__ */ d({
	ROOM_FLOOR: () => 3,
	collide: () => Y,
	makeLevel: () => Te
});
new s(1, 3.22, 2.5);
function Te(n = {}) {
	let a = new r();
	a.name = "Brain Room and Cow Meadow";
	let c = new r();
	c.name = "Sculpted human brain room", a.add(c);
	let u = [], d = 1771, f = () => (d = d * 1664525 + 1013904223 >>> 0, d / 4294967296), h = (e, t = .85) => new N({
		color: e,
		roughness: t
	}), g = new w({
		color: 15255484,
		roughness: .43,
		clearcoat: .32,
		clearcoatRoughness: .3,
		sheen: .18,
		sheenColor: new ne(15703188)
	});
	g.name = "Cortex tissue";
	let _ = g.clone();
	if (_.name = "Cortex recesses", _.color.setHex(9333096), typeof document < "u") {
		let e = new t().load("/brain-room/cortex.png");
		e.colorSpace = i, e.wrapS = e.wrapT = o, e.anisotropy = 4, g.map = e, g.bumpMap = e, g.bumpScale = .045;
		let n = new t().load("/brain-room/cortex.png");
		n.colorSpace = i, n.wrapS = n.wrapT = o, n.anisotropy = 4, n.repeat.set(2.7, 1.8), _.map = n, _.bumpMap = n, _.bumpScale = .11;
	}
	let v = h(4796459), y = q(11438691), b = (t, n, r, i = a) => {
		let o = new e(t, n);
		return o.position.set(r[0], r[1], r[2]), o.castShadow = !0, o.receiveShadow = !0, i.add(o), o;
	}, C = (e, t, n, r = a, i = !1) => {
		let o = b(new ae(t[0], t[1], t[2]), n, e, r);
		return i && u.push({
			center: o.position.clone(),
			half: new s(t[0] / 2, t[1] / 2, t[2] / 2)
		}), o;
	};
	C([
		0,
		2.72,
		0
	], [
		12.7,
		.56,
		12.7
	], _, c, !0), C([
		0,
		6.5,
		-6
	], [
		12.6,
		7,
		.55
	], _, c, !0), C([
		0,
		6.5,
		6
	], [
		12.6,
		7,
		.55
	], _, c, !0), C([
		6,
		6.5,
		0
	], [
		.55,
		7,
		12.6
	], _, c, !0), C([
		-6,
		6.5,
		-3.9
	], [
		.55,
		7,
		4.2
	], _, c, !0), C([
		-6,
		6.5,
		3.9
	], [
		.55,
		7,
		4.2
	], _, c, !0), C([
		-6,
		3.2,
		0
	], [
		.65,
		.7,
		3.6
	], _, c, !0), C([
		-6,
		9.2,
		0
	], [
		.55,
		1.6,
		3.6
	], _, c, !0), C([
		0,
		10,
		0
	], [
		12.6,
		.45,
		12.6
	], _, c, !0);
	let T = [], E = _e(ve, {
		count: n.lightweight ? 180 : 650,
		radius: .07,
		detail: n.lightweight ? 16 : 54,
		segments: n.lightweight ? 18 : 38,
		radial: n.lightweight ? 6 : 10,
		skip: (e) => e.x < -.78 && Math.abs(e.z) < .36 && e.y > -.65 && e.y < .66
	});
	E.position.set(0, 6.3, 0), E.scale.set(6.2, 4.8, 6), c.add(E);
	function D(e, t, r, i, a, o, s) {
		let c = n.lightweight ? .76 : .39, u = Math.floor(e / c), d = Math.floor(t / c), p = new Uint8Array(u * d), h = (n) => ({
			x: -e / 2 + (n % u + .5) * e / u,
			y: -t / 2 + (Math.floor(n / u) + .5) * t / d
		});
		for (let e = 0; e < p.length; e++) {
			let t = h(e);
			s?.(t.x, t.y) && (p[e] = 1);
		}
		let g = Array.from({ length: p.length }, (e, t) => t);
		for (let e = g.length - 1; e > 0; e--) {
			let t = Math.floor(f() * (e + 1));
			[g[e], g[t]] = [g[t], g[e]];
		}
		for (let e of g) {
			if (p[e]) continue;
			let t = e, s = [], g = 12 + Math.floor(f() * 28);
			for (let e = 0; e < g; e++) {
				p[t] = 1;
				let { x: e, y: n } = h(t);
				s.push(r.clone().addScaledVector(i, e + Math.sin(n * 1.6 + e * .4) * .11 + (f() - .5) * c * .4).addScaledVector(a, n + Math.sin(e * 1.3 + n * .4) * .13 + (f() - .5) * c * .3).addScaledVector(o, .065 + f() * .05));
				let l = Math.floor(t / u), m = t % u, g = [];
				for (let [e, t] of [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1],
					[1, 1],
					[-1, 1],
					[1, -1],
					[-1, -1]
				]) {
					let n = m + e, r = l + t;
					n >= 0 && n < u && r >= 0 && r < d && !p[r * u + n] && g.push(r * u + n);
				}
				if (!g.length) break;
				t = g[Math.floor(f() * g.length)];
			}
			let _ = n.lightweight ? .18 : .187;
			if (s.length > 1) {
				let e = new k(s, !1, "centripetal"), t = new l(e, Math.max(5, (s.length - 1) * (n.lightweight ? 2 : 8)), _, n.lightweight ? 5 : 14, !1), r = t.getAttribute("uv");
				for (let t = 0; t < r.count; t++) r.setX(t, r.getX(t) * e.getLength() / 2.5);
				T.push(t);
			}
			for (let e of s.length === 1 ? s : [s[0], s[s.length - 1]]) {
				let t = new m(_, n.lightweight ? 6 : 10, n.lightweight ? 4 : 8);
				t.translate(e.x, e.y, e.z), T.push(t);
			}
		}
	}
	D(11.8, 6.6, new s(0, 6.5, -5.69), new s(1, 0, 0), new s(0, 1, 0), new s(0, 0, 1)), D(11.8, 6.6, new s(0, 6.5, 5.69), new s(1, 0, 0), new s(0, 1, 0), new s(0, 0, -1)), D(11.8, 6.6, new s(5.69, 6.5, 0), new s(0, 0, 1), new s(0, 1, 0), new s(-1, 0, 0)), D(11.8, 6.6, new s(-5.69, 6.5, 0), new s(0, 0, 1), new s(0, 1, 0), new s(1, 0, 0), (e, t) => Math.abs(e) < 2 && t + 6.5 > 3.4 && t + 6.5 < 8.55), D(11.8, 11.8, new s(0, 3.02, 0), new s(1, 0, 0), new s(0, 0, 1), new s(0, 1, 0)), D(11.8, 11.8, new s(0, 9.72, 0), new s(1, 0, 0), new s(0, 0, 1), new s(0, -1, 0));
	let A = [new s(-5.65, 3.5, -1.82), new s(-5.65, 7.25, -1.82)];
	for (let e = 0; e <= 20; e++) {
		let t = Math.PI - e / 20 * Math.PI;
		A.push(new s(-5.65, 7.25 + Math.sin(t) * 1.05, Math.cos(t) * 1.82));
	}
	A.push(new s(-5.65, 3.5, 1.82)), T.push(new l(new k(A), 80, .23, 10, !1));
	let ie = R(T);
	if (T.forEach((e) => e.dispose()), ie) {
		let e = b(ie, g, [
			0,
			0,
			0
		], c);
		e.name = "Raised cortical gyri — walls, floor, ceiling and arch";
	}
	let j = new r();
	j.name = "Brain armchair", j.position.set(3.1, 3.15, -3.1), c.add(j), b(new m(1, 32, 20), g, [
		0,
		.4,
		0
	], j).scale.set(1.5, .55, 1.35);
	let M = [];
	for (let e = 0; e < 23; e++) {
		let t = -.15 + e / 22 * (Math.PI + .3), n = Array.from({ length: 16 }, (e, n) => {
			let r = n / 15 * Math.PI;
			return new s(Math.cos(t) * (1.3 + .13 * Math.sin(n * 1.8)), .4 + Math.sin(r) * (.65 + Math.sin(t) * .8), Math.sin(t) * -1.05 + Math.cos(r) * .22);
		});
		M.push(new l(new k(n), 24, .13, 8, !1));
	}
	let oe = R(M);
	M.forEach((e) => e.dispose()), oe && b(oe, g, [
		0,
		0,
		0
	], j), u.push({
		center: new s(3.1, 3.5, -3.1),
		half: new s(1.4, .5, 1.15)
	});
	let P = new r();
	P.name = "Brain ottoman", c.add(P), b(new m(1, 32, 18), g, [
		-1.3,
		3.5,
		1
	], P).scale.set(1, .45, .85);
	for (let e = 0; e < 24; e++) {
		let t = e / 24 * Math.PI * 2;
		b(new l(new k(Array.from({ length: 14 }, (e, n) => {
			let r = n / 13 * Math.PI;
			return new s(-1.3 + Math.cos(t) * Math.sin(r), 3.5 + Math.cos(r) * .45, 1 + Math.sin(t + .06 * Math.sin(n * 1.9)) * Math.sin(r) * .85);
		})), 28, .115, 10, !1), g, [
			0,
			0,
			0
		], P);
	}
	u.push({
		center: new s(-1.3, 3.4, 1),
		half: new s(.95, .42, .8)
	});
	let I = new r();
	I.name = "Reading table", c.add(I), b(new F(.95, .95, .13, 40), v, [
		-2.65,
		4.3,
		-3.65
	], I);
	for (let e of [-.6, .6]) for (let t of [-.5, .5]) b(new F(.055, .08, 1.2, 8), v, [
		-2.65 + e,
		3.65,
		-3.65 + t
	], I);
	u.push({
		center: new s(-2.65, 3.7, -3.65),
		half: new s(.9, .65, .9)
	});
	for (let e = 0; e < 3; e++) C([
		-2.3,
		4.42 + e * .12,
		-3.8
	], [
		.55,
		.105,
		.43
	], h([
		8939863,
		4536642,
		11836796
	][e]), I);
	let L = new r();
	L.name = "Warm globe lamp", c.add(L), b(new F(.24, .27, .13, 24), v, [
		-3.03,
		4.44,
		-3.55
	], L), b(new m(.29, 24, 16), new N({
		color: 16770994,
		emissive: 16759923,
		emissiveIntensity: 2.4
	}), [
		-3.03,
		4.8,
		-3.55
	], L);
	let z = new S(16760453, 42, 12, 2);
	z.position.set(-3.03, 4.9, -3.4), c.add(z), C([
		5.35,
		6.4,
		-2.5
	], [
		.16,
		2.75,
		2.05
	], v, c), C([
		5.24,
		6.4,
		-2.5
	], [
		.05,
		2.42,
		1.72
	], h(1512223), c);
	let de = new O({ color: 15046607 });
	for (let e = 0; e < 16; e++) {
		let t = e / 16 * Math.PI * 2;
		b(new l(new k(Array.from({ length: 7 }, (e, n) => new s(5.18, 6.4 + Math.sin(t) * n * .16 + (f() - .5) * .14, -2.5 + Math.cos(t) * n * .12 + (f() - .5) * .14))), 16, .009, 4, !1), de, [
			0,
			0,
			0
		], c);
	}
	let B = new r();
	B.name = "Original brain room reference — framed", B.position.set(2.4, 6.6, -5.28), c.add(B);
	let V = new N({
		color: 16777215,
		roughness: .95
	});
	V.name = "Reference painting", typeof document < "u" && (V.map = new t().load("/brain-room/reference-art.jpg"), V.map.colorSpace = i);
	let pe = b(new te(3.2, 3.2 * 506 / 900), V, [
		0,
		0,
		.07
	], B);
	pe.name = "Brain room reference artwork", C([
		0,
		0,
		0
	], [
		3.5,
		2.1,
		.1
	], v, B);
	let H = new N({
		color: 11965012,
		metalness: .65,
		roughness: .3
	});
	for (let e of [-1.66, 1.66]) C([
		e,
		0,
		.1
	], [
		.14,
		2.05,
		.15
	], v, B);
	for (let e of [-.965, .965]) C([
		0,
		e,
		.1
	], [
		3.45,
		.14,
		.15
	], v, B);
	for (let e of [-1.615, 1.615]) C([
		e,
		0,
		.15
	], [
		.018,
		1.83,
		.025
	], H, B);
	for (let e of [-.911, .911]) C([
		0,
		e,
		.15
	], [
		3.24,
		.018,
		.025
	], H, B);
	let me = {};
	if (n.catalog) for (let [t, n] of [
		["chair", j],
		["painting", B],
		["ottoman", P],
		["lamp", c.getObjectByName("Warm globe lamp")],
		["table", c.getObjectByName("Reading table")]
	]) {
		let i = n.clone(!0);
		i.traverse((t) => {
			t instanceof e && (t.geometry = t.geometry.clone());
		});
		let a = new r();
		a.add(i), me[t] = a;
	}
	let U = fe(.065, 2.5), W = fe(.035, 5);
	c.updateMatrixWorld(!0);
	for (let t of [g, _]) {
		let n = [];
		c.traverse((r) => {
			r instanceof e && r.material === t && n.push(r);
		});
		let r = n.map((e) => {
			let t = e.geometry.index ? e.geometry.toNonIndexed() : e.geometry.clone();
			return t.applyMatrix4(e.matrixWorld), t;
		});
		if (r.length) {
			let e = R(r);
			if (r.forEach((e) => e.dispose()), n.forEach((e) => {
				e.removeFromParent(), e.geometry.dispose();
			}), e) {
				let n = b(e, t, [
					0,
					0,
					0
				], c);
				n.name = "Living cortical tissue", U.apply(n);
			}
		}
	}
	E.traverse((t) => {
		t instanceof e && W.apply(t);
	});
	let ge = new s(0, 6.5, 0), G = new s(5.43, 3.18, 5.43), be = (e) => {
		let t = [
			G.x / Math.max(1e-5, Math.abs(e.x)),
			G.y / Math.max(1e-5, Math.abs(e.y)),
			G.z / Math.max(1e-5, Math.abs(e.z))
		], n = t.indexOf(Math.min(...t)), r = e.clone().multiplyScalar(t[n]).add(ge), i = new s();
		return i.setComponent(n, -Math.sign(e.getComponent(n))), {
			point: r,
			normal: i
		};
	}, K = typeof document > "u" ? null : xe(() => {}, {
		surface: be,
		skin: U,
		shell: !1,
		unit: .85,
		count: 6,
		center: ge,
		surfaceLift: .025,
		valid: (e) => {
			let t = be(e).point;
			return !(t.x < -5 && Math.abs(t.z) < 2.15 && t.y < 8.6);
		}
	}), J = typeof document > "u" ? null : xe(() => {}, {
		surface: ve,
		skin: W,
		shell: !1,
		unit: .23,
		count: 5,
		valid: (e) => {
			let t = ve(e).point;
			return !(t.x < -.78 && Math.abs(t.z) < .4 && t.y > -.7 && t.y < .7);
		}
	});
	K && a.add(K.root), J && E.add(J.root);
	let we = 0, Te = C([
		0,
		-.35,
		0
	], [
		180,
		.7,
		180
	], h(7701588), a, !0);
	Te.name = "Walkable meadow", C([
		-13,
		.005,
		0
	], [
		14,
		.02,
		3.1
	], h(11442034));
	for (let e = 0; e < 6; e++) C([
		-10.9 + e * .8,
		(e + 1) * .275,
		0
	], [
		.83,
		(e + 1) * .55,
		3
	], y, a, !0);
	let Y = new r();
	Y.name = "Pasture fence", a.add(Y);
	for (let e = -34; e <= 34; e += 3.4) for (let t of [-48, 21]) {
		C([
			t,
			.8,
			e
		], [
			.14,
			1.6,
			.14
		], y, Y);
		for (let n of [.55, 1.1]) C([
			t,
			n,
			e + 1.7
		], [
			.1,
			.1,
			3.4
		], y, Y);
	}
	for (let e = -48; e <= 21; e += 3.4) for (let t of [-34, 34]) if (!(t === -34 && e > -18 && e < -8)) {
		C([
			e,
			.8,
			t
		], [
			.14,
			1.6,
			.14
		], y, Y);
		for (let n of [.55, 1.1]) C([
			e + 1.7,
			n,
			t
		], [
			3.4,
			.1,
			.1
		], y, Y);
	}
	for (let [e, t, n, r] of [
		[
			-48,
			0,
			.15,
			68
		],
		[
			21,
			0,
			.15,
			68
		],
		[
			-33,
			-34,
			30,
			.15
		],
		[
			6,
			-34,
			30,
			.15
		],
		[
			-13.5,
			34,
			69,
			.15
		]
	]) u.push({
		center: new s(e, .65, t),
		half: new s(n / 2, .65, r / 2)
	});
	Se(Y, y), ce(Y);
	let X = new r();
	X.name = "Red meadow barn", a.add(X);
	let Z = new le(u, X), Q = q(10374728);
	Z.add([
		-37,
		2.5,
		-20
	], [
		.3,
		5,
		8
	], Q), Z.add([
		-27,
		2.5,
		-20
	], [
		.3,
		5,
		8
	], Q), Z.add([
		-32,
		2.5,
		-24
	], [
		10,
		5,
		.3
	], Q), Z.add([
		-35.3,
		2.5,
		-16
	], [
		3.4,
		5,
		.3
	], Q), Z.add([
		-28.7,
		2.5,
		-16
	], [
		3.4,
		5,
		.3
	], Q), Z.add([
		-32,
		4.4,
		-16
	], [
		3.2,
		1.2,
		.3
	], Q);
	let Ee = b(new F(0, 7.2, 3, 4, 1), h(4471368), [
		-32,
		6.5,
		-20
	], X);
	Ee.rotation.y = Math.PI / 4, Ee.scale.z = .8, Z.add([
		-32,
		1.8,
		-15.94
	], [
		3,
		3.6,
		.16
	], q(4795953));
	for (let e of [-1.7, 1.7]) C([
		-32 + e,
		1.85,
		-15.85
	], [
		.14,
		3.7,
		.1
	], h(15390391), X);
	C([
		-32,
		3.68,
		-15.85
	], [
		3.55,
		.16,
		.1
	], h(15390391), X);
	let De = new F(.06, .09, .48, 8, 4), Oe = new x(.06, .22, 8);
	Oe.translate(0, .35, 0);
	let ke = R([De, Oe]);
	De.dispose(), Oe.dispose();
	let Ae = new w({
		color: 16777215,
		metalness: .32,
		roughness: .16,
		clearcoat: 1,
		clearcoatRoughness: .12,
		emissive: 16777215,
		emissiveIntensity: .16
	}), je = { value: 0 };
	Ae.onBeforeCompile = (e) => {
		e.uniforms.windTime = je, e.fragmentShader = e.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n #ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance*=vColor;\n #endif"), e.vertexShader = "uniform float windTime;\n" + e.vertexShader, e.vertexShader = e.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n transformed.x+=sin(windTime*.7+instanceMatrix[3].x*.6+instanceMatrix[3].z*.4)*pow(max(0.,position.y+.24),2.)*.055;");
	};
	let Me = new re(ke, Ae, 2200), $ = new ee(), Ne = [
		7465635,
		4176504,
		10026872,
		5564616,
		11429887,
		15617895,
		4952319,
		16369777
	];
	for (let e = 0; e < 2200; e++) {
		e % 4 == 0 && ($.userData.x = -66 + f() * 114, $.userData.z = -78 + f() * 135);
		let t = $.userData.x + (f() - .5) * .6, n = $.userData.z + (f() - .5) * .6;
		(Math.abs(t) < 7 && Math.abs(n) < 7 || t > -29 && t < 5 && n < -43 || Math.abs(t + 12) < 3 && n < -28) && (t = 35 + f() * 15);
		let r = .45 + f() * 1.2;
		$.position.set(t, .25 * r, n), $.rotation.set((f() - .5) * .3, f() * 6.28, (f() - .5) * .4), $.scale.set(.7, r, .7), $.updateMatrix(), Me.setMatrixAt(e, $.matrix), Me.setColorAt(e, new ne(Ne[f() < .66 ? Math.floor(f() * 3) : 3 + Math.floor(f() * 5)]));
	}
	a.add(Me);
	let Pe = new re(new p(.065, 0), h(16046508), 340);
	for (let e = 0; e < 340; e++) $.position.set(-45 + f() * 60, .32, -31 + f() * 62), $.scale.setScalar(1), $.rotation.set(0, 0, 0), $.updateMatrix(), Pe.setMatrixAt(e, $.matrix);
	a.add(Pe);
	let Fe = [];
	for (let e = 0; e < 20; e++) {
		let t = -58 + f() * 90, n = (e % 2 ? 1 : -1) * (24 + f() * 22);
		if (t < -39 && n < 0 || t > -31 && t < 8 && n < -36 || t > 9 && t < 44 && n < -35) continue;
		let r = ye(e);
		r.position.set(t, 0, n), a.add(r), Fe.push(r);
	}
	for (let e = 0; e < 24; e++) {
		let t = e / 24 * Math.PI * 2, n = b(new x(15 + f() * 12, 13 + f() * 23, 6), h(e % 2 ? 9141657 : 10720422), [
			Math.cos(t) * 95,
			-2,
			Math.sin(t) * 95
		]);
		n.rotation.y = f() * 6.28;
	}
	let Ie = he(f);
	Ie.forEach((e) => a.add(e.root));
	let Le = se(u);
	a.add(Le.root);
	let Re = Ce(u);
	a.add(Re.root);
	let ze = ue();
	return a.add(ze.root), {
		root: a,
		room: c,
		catalogParts: me,
		graveyard: Re,
		solids: u,
		cows: Ie,
		lamp: z,
		lab: Le,
		dreamscape: ze,
		barnWalls: Z,
		spawnBrainWorm(e) {
			return (Math.abs(e.x) < 6 && Math.abs(e.z) < 6 ? K : J)?.spawnWorm();
		},
		disposeBrainLife() {
			K?.dispose(), J?.dispose();
		},
		updateAmbience: (e) => {
			let t = Math.max(0, Math.min(.05, e - we));
			we = e, Re.update(e, t), K?.update(t), J?.update(t), Fe.forEach((t, n) => {
				t.rotation.z = Math.sin(e * .4 + n) * .012, t.rotation.x = Math.sin(e * .31 + n * 2) * .009;
			}), E.scale.y = 4.8 + Math.sin(e * .43) * .015, je.value = e;
		}
	};
}
function Y(e, t, n, r, i = 0) {
	let a = !1;
	for (let o of n) {
		if (Math.abs(e.x - o.center.x) > o.half.x + t || Math.abs(e.y - o.center.y) > o.half.y + t || Math.abs(e.z - o.center.z) > o.half.z + t) continue;
		let n = e.clone().sub(o.center), s = n.clone().clamp(o.half.clone().negate(), o.half), c = n.clone().sub(s), l = c.length();
		if (l >= t) continue;
		let u = t - l;
		if (l > 1e-5) c.divideScalar(l);
		else {
			let e = [
				o.half.x - Math.abs(n.x),
				o.half.y - Math.abs(n.y),
				o.half.z - Math.abs(n.z)
			], r = e.indexOf(Math.min(...e));
			c.set(0, 0, 0), c.setComponent(r, Math.sign(n.getComponent(r)) || 1), u = t + e[r];
		}
		if (e.addScaledVector(c, u + 1e-4), c.y > .5 && (a = !0), r) {
			let e = r.dot(c);
			e < 0 && r.addScaledVector(c, -e * (1 + i));
		}
	}
	return a;
}
//#endregion
export { ye as a, W as c, xe as i, U as l, we as n, he as o, J as r, ge as s, Y as t, de as u };
