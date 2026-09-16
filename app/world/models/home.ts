import * as THREE from 'three';type CanLabel='YOOHOO'|'PEPSI'|'MONSTER'|'RAT MEAT';
export function canTexture(label: CanLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const colors = label === "YOOHOO" ? ["#3b180b", "#fff0bb"] : label === "PEPSI" ? ["#164cc7", "#e51d39"] : label === "RAT MEAT" ? ["#4a4136", "#c6b28c"] : ["#070b08", "#74ff29"];
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(.48, colors[1]);
  gradient.addColorStop(1, colors[0]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = label === "MONSTER" ? "#86ff39" : "#fff";
  ctx.font = "900 64px Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.7)";
  ctx.shadowBlur = 10;
  if (label === "MONSTER") {
    ctx.font = "900 116px Impact, sans-serif";
    ctx.fillText("M", 256, 120);
    ctx.font = "900 28px Arial Black, sans-serif";
    ctx.fillText("MONSTER ENERGY", 256, 210);
  } else ctx.fillText(label, 256, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function makeCrystalCluster(index: number) {
  const group = new THREE.Group();
  const hue = (index * .137 + .48) % 1;
  for (let shard = 0; shard < 3 + (index % 3); shard += 1) {
    const color = new THREE.Color().setHSL((hue + shard * .075) % 1, .92, .62);
    const material = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color.clone().multiplyScalar(.25),
      emissiveIntensity: .65,
      roughness: .06,
      metalness: .08,
      transmission: .72,
      thickness: .5,
      transparent: true,
      opacity: .84,
      clearcoat: 1,
      clearcoatRoughness: .08,
      ior: 1.72,
      side: THREE.DoubleSide,
    });
    const height = .72 + ((index * 17 + shard * 11) % 13) * .1;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(.16 + shard * .025, height, 6), material);
    crystal.position.set((shard - 1.5) * .16, height * .5, (shard % 2) * .13);
    crystal.rotation.z = (shard - 1.5) * .12;
    crystal.rotation.y = shard * 1.7;
    crystal.castShadow = true;
    group.add(crystal);
  }
  const glow = new THREE.PointLight(new THREE.Color().setHSL(hue, .95, .65), 3.2, 3.5, 1.8);
  glow.position.y = .42;
  group.add(glow);
  return group;
}

export function makeJungleTree(index: number) {
  const tree = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: index % 2 ? 0x3e2518 : 0x56301d, roughness: .95 });
  const leafColors = [0x0b4e2b, 0x116f38, 0x188c47, 0x2aa95a];
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColors[index % leafColors.length], roughness: .78, side: THREE.DoubleSide });
  const height = 5.8 + (index % 3) * .65;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .42, height, 10), bark);
  trunk.position.y = height * .5;
  trunk.rotation.z = (index % 2 ? 1 : -1) * .045;
  trunk.castShadow = true;
  tree.add(trunk);
  for (let crown = 0; crown < 3; crown += 1) {
    const hub = new THREE.Vector3((crown - 1) * .28, height - .2 + crown * .25, 0);
    for (let leaf = 0; leaf < 9; leaf += 1) {
      const blade = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), leafMat.clone());
      const angle = leaf / 9 * Math.PI * 2 + crown * .7;
      blade.position.copy(hub).add(new THREE.Vector3(Math.cos(angle) * 1.15, Math.sin(angle * 2) * .22, Math.sin(angle) * .85));
      blade.scale.set(1.2, .16, .42);
      blade.rotation.set(Math.sin(angle) * .35, -angle, Math.cos(angle) * .22);
      blade.castShadow = true;
      tree.add(blade);
    }
  }
  return tree;
}

export function makeCan(label: CanLabel, texture: THREE.Texture, metalColor = 0xc7cbd3) {
  const group = new THREE.Group();
  const side = new THREE.MeshStandardMaterial({ map: texture, metalness: .5, roughness: .34 });
  const silver = new THREE.MeshStandardMaterial({ color: metalColor, metalness: .9, roughness: .22 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .82, 28, 1, false), [side, silver, silver]);
  body.castShadow = true;
  group.add(body);
  for (const y of [-.42, .42]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.245, .025, 7, 28), silver);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y;
    group.add(rim);
  }
  group.userData.label = label;
  return group;
}