import * as THREE from "three";

const GLSL_NOISE = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p){
  float v = 0.0; float amp = 0.55;
  for(int i = 0; i < 4; i++){ v += amp * vnoise(p); p *= 2.05; amp *= 0.55; }
  return v;
}
vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
`;

export const VOID_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main(){
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const VOID_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFX;
uniform vec3 uLightDir;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
${GLSL_NOISE}
void main(){
  vec3 shadeNormal = normalize(vNormalW);
  vec2 flow = vPosW.xz * 0.045 + vec2(uTime * 0.028, uTime * 0.016) * uFX;
  float n = fbm(flow + fbm(flow * 1.6 - uTime * 0.045 * uFX) * 2.2);
  float hue = fract(0.52 + n * 0.32 + uTime * 0.016 * uFX + vPosW.x * 0.004);
  float sat = 0.58 + 0.26 * n;
  float val = 0.48 + 0.42 * n;
  vec3 col = hsv2rgb(vec3(hue, sat, val));
  float diff = max(dot(shadeNormal, normalize(uLightDir)), 0.0);
  float spec = pow(diff, 22.0) * 0.55;
  vec3 base = col * (0.52 + diff * 0.62) + spec;
  gl_FragColor = vec4(base, 0.92);
}
`;

const GLOBE_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
void main(){
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GLOBE_FRAG = /* glsl */ `
uniform sampler2D uLandMask;
uniform float uTime;
uniform vec3 uLandColor;
uniform float uFX;
uniform vec3 uLightDir;
varying vec2 vUv;
varying vec3 vNormalW;
${GLSL_NOISE}
void main(){
  float mask = texture2D(uLandMask, vUv).r;
  bool isLand = mask < 0.5;
  vec3 shadeNormal = normalize(vNormalW);
  vec3 base;
  if (isLand) {
    float n = fbm(vUv * 14.0);
    vec3 soil = mix(uLandColor, vec3(0.78, 0.72, 0.28), n * 0.35);
    soil = mix(soil, vec3(0.22, 0.38, 0.18), smoothstep(0.55, 0.9, n));
    float diff = max(dot(shadeNormal, normalize(uLightDir)), 0.0);
    float lit = 0.48 + diff * 0.82;
    base = soil * lit;
  } else {
    vec2 flow = vUv * 9.0 + vec2(uTime * 0.035, uTime * 0.02) * uFX;
    float n = fbm(flow + fbm(flow * 1.6 - uTime * 0.05 * uFX) * 2.2);
    float hue = fract(0.52 + n * 0.32 + uTime * 0.018 * uFX + vUv.x * 0.12);
    float sat = 0.55 + 0.28 * n;
    float val = 0.5 + 0.4 * n;
    vec3 col = hsv2rgb(vec3(hue, sat, val));
    float diff = max(dot(shadeNormal, normalize(uLightDir)), 0.0);
    float spec = pow(diff, 24.0) * 0.6;
    base = col * (0.55 + diff * 0.6) + spec;
  }
  gl_FragColor = vec4(base, 1.0);
}
`;

const ATMO_VERT = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosW;
void main(){
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const ATMO_FRAG = /* glsl */ `
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec3 vNormalW;
varying vec3 vPosW;
void main(){
  vec3 viewDir = normalize(cameraPosition - vPosW);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormalW), 0.0), 2.6);
  vec3 col = mix(uColor1, uColor2, 0.5 + 0.5 * sin(vPosW.y * 0.08));
  gl_FragColor = vec4(col, fresnel * 0.78);
}
`;

export type GlobeHandle = {
  group: THREE.Group;
  uniforms: {
    uTime: { value: number };
    uLandMask: { value: THREE.Texture };
    uLandColor: { value: THREE.Color };
    uFX: { value: number };
    uLightDir: { value: THREE.Vector3 };
  };
  textures: THREE.Texture[];
};

function fallbackLandMask() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f2f6ff";
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#1a1a1a";
  const blobs: Array<[number, number, number, number]> = [
    [180, 210, 160, 90],
    [280, 160, 90, 70],
    [250, 300, 70, 80],
    [430, 200, 70, 50],
    [520, 230, 140, 110],
    [640, 170, 180, 90],
    [720, 250, 120, 80],
    [780, 320, 90, 50],
    [860, 360, 70, 40],
    [500, 430, 280, 40],
    [820, 200, 80, 40],
  ];
  for (const [x, y, rx, ry] of blobs) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createGlobe(): GlobeHandle {
  const group = new THREE.Group();
  const textures: THREE.Texture[] = [];
  const land: THREE.Texture = fallbackLandMask();
  textures.push(land);

  const uniforms = {
    uLandMask: { value: land },
    uTime: { value: 0 },
    uLandColor: { value: new THREE.Color(0xd4e25a) },
    uFX: { value: 1.15 },
    uLightDir: { value: new THREE.Vector3(0.35, 0.7, 0.55).normalize() },
  };

  const loader = new THREE.TextureLoader();
  loader.load(
    `${import.meta.env.BASE_URL}land_mask.jpg`,
    (tex) => {
      tex.colorSpace = THREE.NoColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      uniforms.uLandMask.value = tex;
      textures.push(tex);
    },
    undefined,
    () => {
      /* keep procedural fallback */
    },
  );

  const R = 22;
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: GLOBE_VERT,
    fragmentShader: GLOBE_FRAG,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), mat);
  group.add(mesh);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.16, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color(0x57d9c8) },
        uColor2: { value: new THREE.Color(0xb98cff) },
      },
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  group.add(atmo);

  const sat = buildMiniSat();
  sat.position.set(R * 1.55, 4, 0);
  const satOrbit = new THREE.Group();
  satOrbit.add(sat);
  satOrbit.rotation.x = 0.7;
  satOrbit.name = "satOrbit";
  group.add(satOrbit);

  group.position.set(32, 6, -48);
  group.rotation.z = THREE.MathUtils.degToRad(12);
  group.rotation.y = 2.4;
  return { group, uniforms, textures };
}

function buildMiniSat() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd7dde3,
    metalness: 0.6,
    roughness: 0.35,
    fog: false,
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1c3f7a,
    metalness: 0.2,
    roughness: 0.4,
    emissive: 0x0a1a3a,
    emissiveIntensity: 0.4,
    fog: false,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.7), bodyMat);
  g.add(body);
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.9), panelMat);
  p1.position.x = -2.1;
  const p2 = p1.clone();
  p2.position.x = 2.1;
  g.add(p1, p2);
  const blink = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff3355, emissive: 0xff2244, emissiveIntensity: 1, fog: false }),
  );
  blink.position.set(0.5, -0.4, 0.9);
  blink.name = "blink";
  g.add(blink);
  g.scale.setScalar(0.55);
  return g;
}

export function updateGlobe(h: GlobeHandle, time: number) {
  h.uniforms.uTime.value = time;
  h.group.rotation.y += 0.00035;
  const orbit = h.group.getObjectByName("satOrbit");
  if (orbit) orbit.rotation.y = time * 0.22;
  const blink = h.group.getObjectByName("blink") as THREE.Mesh | undefined;
  if (blink) {
    const m = blink.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.6 + Math.sin(time * 6) * 0.5;
  }
}
