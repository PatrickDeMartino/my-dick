import { $ as e, Bt as t, D as n, E as r, Et as i, Jt as a, Ot as o, Pt as s, Vt as c, _ as l, b as u, et as d, h as f, l as p, ot as m, y as h } from "./three.module-h2PuqYDi.js";
import { t as g } from "./BufferGeometryUtils-nus3RdMX.js";
//#region app/urf-3d/launch-island.ts
var _ = /* @__PURE__ */ a({
	buildLaunchIsland: () => v,
	cosmicOcean: () => y
});
function v() {
	let t = new n();
	t.name = "Grok launch island";
	let i = [
		7809714,
		13322432,
		4245952,
		15437891,
		8538572,
		7193923
	], a = i.map((e) => new m({
		color: e,
		flatShading: !0,
		roughness: .73,
		emissive: e,
		emissiveIntensity: .08
	})), o = new h(.88, .16, .85, 28, 4).toNonIndexed(), u = o.getAttribute("position"), _ = [];
	for (let e = 0; e < u.count; e += 3) {
		let t = new f(i[Math.floor(e / 3) * 7 % i.length]).multiplyScalar(.45 + .3 * (e * 13 % 17 / 17));
		for (let e = 0; e < 3; e++) _.push(t.r, t.g, t.b);
	}
	o.setAttribute("color", new r(_, 3)), o.computeVertexNormals();
	let v = new e(o, new m({
		vertexColors: !0,
		flatShading: !0,
		roughness: .8
	}));
	v.position.y = -.43, t.add(v);
	let y = new e(new h(.9, .87, .035, 48), a[0]);
	t.add(y);
	let b = Array.from({ length: 6 }, () => []);
	for (let e = 0; e < 12; e++) for (let t = 0; t < 48; t++) {
		let n = t / 48 * Math.PI * 2, a = (t + 1) / 48 * Math.PI * 2, o = e / 12 * .89, s = (e + 1) / 12 * .89, c = new p();
		c.setAttribute("position", new r([
			Math.cos(n) * o,
			.024,
			Math.sin(n) * o,
			Math.cos(a) * s,
			.024,
			Math.sin(a) * s,
			Math.cos(n) * s,
			.024,
			Math.sin(n) * s,
			Math.cos(n) * o,
			.024,
			Math.sin(n) * o,
			Math.cos(a) * o,
			.024,
			Math.sin(a) * o,
			Math.cos(a) * s,
			.024,
			Math.sin(a) * s
		], 3)), c.computeVertexNormals(), b[(Math.floor(t / 4) + e * 2) % i.length].push(c);
	}
	b.forEach((n, r) => {
		let i = g(n);
		i && t.add(new e(i, a[r])), n.forEach((e) => e.dispose());
	});
	let x = new m({
		color: 8607152,
		flatShading: !0
	});
	for (let [n, r, i, o] of [
		[
			-.66,
			-.25,
			.7,
			.27
		],
		[
			.63,
			-.34,
			.42,
			.2
		],
		[
			-.5,
			.45,
			.24,
			.14
		]
	]) {
		let l = new e(new h(.025, .048, i, 8), x);
		l.position.set(n, i / 2, r), t.add(l);
		let u = new e(new s(o, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), a[1]);
		u.position.set(n, i, r), u.scale.y = .65, t.add(u);
		for (let s = 0; s < 4; s++) {
			let l = new e(new c(o * (.2 + s * .2), .012, 4, 24), a[(s + 2) % 6]);
			l.rotation.x = Math.PI / 2, l.position.set(n, i + Math.sqrt(Math.max(0, o * o - (o * (.2 + s * .2)) ** 2)) * .65, r), t.add(l);
		}
	}
	for (let [n, r] of [
		[.6, .3],
		[-.75, .12],
		[.2, -.7]
	]) for (let i = 0; i < 4; i++) {
		let o = .12 + (i === 0 ? .4 : i * .05), s = new e(new l(o * .16, o, 5), a[i === 0 ? 2 : 4]);
		s.position.set(n + Math.sin(i * 2) * .065, o / 2, r + Math.cos(i * 2) * .065), s.rotation.z = Math.sin(i) * .22, t.add(s);
	}
	let S = new d({
		color: 14719999,
		transparent: !0,
		opacity: .3
	}), C = new e(new c(.9, .012, 6, 64), S);
	C.rotation.x = Math.PI / 2, C.position.y = .025, t.add(C);
	let w = new d({
		color: 7403989,
		transparent: !0,
		opacity: .2
	}), T = new e(new c(.59, .02, 6, 48), w);
	return T.rotation.x = Math.PI / 2, T.position.y = -.55, t.add(T), {
		group: t,
		edgeMaterial: S,
		underglow: w
	};
}
function y() {
	let e = typeof document < "u" ? new t().load("/media/psychedelic-earth-texture-v1.png") : new u(new Uint8Array([
		90,
		20,
		150,
		255
	]), 1, 1);
	return e.wrapS = e.wrapT = i, typeof document > "u" && (e.needsUpdate = !0), new o({
		uniforms: {
			retro: { value: e },
			time: { value: 0 },
			style: { value: 0 }
		},
		vertexShader: "varying vec3 p;varying vec3 n;varying vec4 clipPosition;void main(){p=normalize(position);n=normal;clipPosition=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=clipPosition;}",
		fragmentShader: "varying vec3 p;varying vec3 n;varying vec4 clipPosition;uniform float time;uniform float style;uniform sampler2D retro;\n    vec3 rainbow(float x){return .5+.5*cos(6.28318*(vec3(0.,.33,.67)+x));}\n    void main(){float t=time*.13;float w=sin(p.x*13.+sin(p.y*12.+t)*2.8+p.z*5.);float bands=sin(w*3.+p.y*19.+t)*.5+.5;\n      vec3 color=mix(vec3(.12,.025,.28),vec3(.1,.45,.56),smoothstep(.15,.65,bands));color=mix(color,vec3(.68,.09,.47),smoothstep(.55,.94,bands));\n      if(style>.5&&style<1.5){float flow=sin(p.x*8.+sin(p.z*10.-t)*2.)+sin(p.y*9.+cos(p.x*7.+t)*2.);color=rainbow(flow*.3+t*.09)*(.65+.35*sin(flow*4.));}\n      if(style>1.5&&style<2.5){float cells=sin(p.x*18.+t)*sin(p.y*16.-t)+sin(p.z*19.+t*.7);float edges=pow(1.-abs(sin(cells*3.)),7.);color=mix(vec3(.025,.03,.13),rainbow(cells*.2+t*.04),edges);color+=vec3(.04,.2,.23)*(.5+.5*sin(cells*7.));}\n      if(style>2.5){float ripple=sin(length(p.xy+vec2(sin(t)*.25,cos(t*.7)*.3))*36.-t*3.+sin(p.z*11.)*2.);color=mix(vec3(.23,.015,.31),vec3(1.,.36,.08),smoothstep(-.6,.6,ripple));color=mix(color,vec3(.12,.85,.67),pow(max(0.,ripple),8.));}\n      if(style>3.5){vec2 uv=clipPosition.xy/clipPosition.w*.5+.5;vec3 c=texture2D(retro,uv*vec2(1.35,1.)).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.28);c=pow(max(c,vec3(0.)),vec3(1.13));c*=.95+.075*sin(time*.55)+.035*sin(time*.31+uv.x*7.);gl_FragColor=vec4(c,1.);return;}\n      float light=.55+.45*max(0.,dot(normalize(n),normalize(vec3(-2.,2.,3.))));gl_FragColor=vec4(color*light,1.);}"
	});
}
//#endregion
export { y as n, _ as r, v as t };
