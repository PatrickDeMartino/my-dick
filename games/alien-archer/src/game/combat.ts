import * as THREE from "three";
import { makeBulletMesh, makeTracerMesh, makeMagPickup, makeAmmoPickup } from "./weapons";
import { ISLANDS, sampleGround, type Island } from "./world";
import type { WeaponId } from "./characters";

export type Enemy = {
  root: THREE.Group;
  core: THREE.Mesh;
  hp: number;
  maxHp: number;
  home: Island;
  ang: number;
  rad: number;
  height: number;
  speed: number;
  fireCd: number;
  flash: number;
  alive: boolean;
  bob: number;
};

export type Shot = {
  mesh: THREE.Group;
  vel: THREE.Vector3;
  alive: boolean;
  life: number;
  prev: THREE.Vector3;
  dmg: number;
};

export type Bolt = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  alive: boolean;
  life: number;
};

export type Pickup = {
  mesh: THREE.Group;
  kind: "mag" | "ammo" | "health";
  x: number;
  z: number;
  y: number;
  alive: boolean;
  bob: number;
};

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export class Combat {
  group = new THREE.Group();
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  bolts: Bolt[] = [];
  pickups: Pickup[] = [];
  particles: THREE.Points;
  particlePos: Float32Array;
  particleVel: Float32Array;
  particleLife: Float32Array;
  private enemyMat: THREE.MeshStandardMaterial;
  private enemyMat2: THREE.MeshStandardMaterial;
  private boltMat: THREE.MeshStandardMaterial;
  private tracerPool: THREE.Group[] = [];
  private bulletPool: THREE.Group[] = [];

  constructor() {
    this.enemyMat = new THREE.MeshStandardMaterial({
      color: 0xe14bff,
      emissive: 0x9010c0,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.4,
      flatShading: true,
      transparent: true,
      opacity: 0.92,
    });
    this.enemyMat2 = new THREE.MeshStandardMaterial({
      color: 0x3ae8ff,
      emissive: 0x1088aa,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.45,
      flatShading: true,
    });
    this.boltMat = new THREE.MeshStandardMaterial({
      color: 0xff4d6d,
      emissive: 0xff2266,
      emissiveIntensity: 0.9,
      flatShading: true,
    });

    const n = 96;
    this.particlePos = new Float32Array(n * 3);
    this.particleVel = new Float32Array(n * 3);
    this.particleLife = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.particlePos, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xffe14a,
        size: 0.22,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    this.group.add(this.particles);

    for (let i = 0; i < 28; i++) {
      const mesh = i % 2 === 0 ? makeTracerMesh() : makeBulletMesh();
      mesh.visible = false;
      this.group.add(mesh);
      if (i % 2 === 0) this.tracerPool.push(mesh);
      else this.bulletPool.push(mesh);
      this.shots.push({
        mesh,
        vel: new THREE.Vector3(),
        alive: false,
        life: 0,
        prev: new THREE.Vector3(),
        dmg: 1,
      });
    }
    const boltGeo = new THREE.OctahedronGeometry(0.16, 1);
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(boltGeo, this.boltMat);
      mesh.visible = false;
      this.group.add(mesh);
      this.bolts.push({ mesh, vel: new THREE.Vector3(), alive: false, life: 0 });
    }
  }

  spawnWave(wave: number) {
    for (const e of this.enemies) {
      this.group.remove(e.root);
      e.root.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    this.enemies = [];
    const count = Math.min(4 + wave * 2, 14);
    for (let i = 0; i < count; i++) {
      const home = ISLANDS[1 + (i % (ISLANDS.length - 1))]!;
      this.enemies.push(this.makeEnemy(home, i, wave));
    }
    if (wave === 1) {
      this.spawnPickup("mag", 4, 0, 0);
      this.spawnPickup("ammo", -4.5, 2.5, 0);
      this.spawnPickup("health", -5, 3.5, 0);
    }
  }

  private makeEnemy(home: Island, idx: number, wave: number): Enemy {
    const root = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), idx % 2 ? this.enemyMat : this.enemyMat2);
    core.castShadow = true;
    root.add(core);
    for (let i = 0; i < 5; i++) {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 6), i % 2 ? this.enemyMat2 : this.enemyMat);
      shard.position.setFromSphericalCoords(0.44, (i / 5) * Math.PI, i);
      shard.lookAt(0, 0, 0);
      root.add(shard);
    }
    const ang = Math.random() * Math.PI * 2;
    const rad = home.radius * (0.35 + Math.random() * 0.45);
    root.position.set(home.x + Math.cos(ang) * rad, home.topY + 2.4, home.z + Math.sin(ang) * rad);
    this.group.add(root);
    return {
      root,
      core,
      hp: 2 + Math.floor(wave / 2),
      maxHp: 2 + Math.floor(wave / 2),
      home,
      ang,
      rad,
      height: 2.1 + Math.random() * 1.4,
      speed: 0.35 + wave * 0.06 + Math.random() * 0.15,
      fireCd: 1.5 + Math.random() * 2,
      flash: 0,
      alive: true,
      bob: Math.random() * 10,
    };
  }

  spawnPickup(kind: Pickup["kind"], x: number, z: number, islandY: number) {
    const g = kind === "mag" ? makeMagPickup() : kind === "ammo" ? makeAmmoPickup() : makeHealthPickup();
    const ground = sampleGround(x, z);
    const y = (ground.island ? ground.y : islandY) + 0.75;
    g.position.set(x, y, z);
    this.group.add(g);
    this.pickups.push({ mesh: g, kind, x, z, y, alive: true, bob: Math.random() * 5 });
  }

  fireShot(origin: THREE.Vector3, dir: THREE.Vector3, weapon: WeaponId, dmg: number, speed: number) {
    const slot = this.shots.find((s) => !s.alive);
    if (!slot) return false;
    const pref = weapon === "ak" ? this.tracerPool : this.bulletPool;
    const mesh = pref.find((m) => !m.visible) ?? slot.mesh;
    slot.mesh.visible = false;
    slot.mesh = mesh;
    slot.alive = true;
    slot.life = weapon === "ak" ? 1.6 : 2.2;
    slot.dmg = dmg;
    mesh.visible = true;
    mesh.position.copy(origin);
    slot.prev.copy(origin);
    slot.vel.copy(dir).normalize().multiplyScalar(speed);
    mesh.lookAt(origin.clone().add(dir));
    return true;
  }

  private fireBolt(from: THREE.Vector3, toward: THREE.Vector3) {
    const slot = this.bolts.find((b) => !b.alive);
    if (!slot) return;
    slot.alive = true;
    slot.life = 3;
    slot.mesh.visible = true;
    slot.mesh.position.copy(from);
    slot.vel.copy(toward).sub(from);
    slot.vel.y += 0.4;
    slot.vel.normalize().multiplyScalar(7.5);
  }

  burst(pos: THREE.Vector3, color = 0xffe14a) {
    (this.particles.material as THREE.PointsMaterial).color.setHex(color);
    let placed = 0;
    for (let i = 0; i < this.particleLife.length && placed < 18; i++) {
      if (this.particleLife[i]! > 0) continue;
      this.particleLife[i] = 0.45 + Math.random() * 0.3;
      this.particlePos[i * 3] = pos.x;
      this.particlePos[i * 3 + 1] = pos.y;
      this.particlePos[i * 3 + 2] = pos.z;
      this.particleVel[i * 3] = (Math.random() - 0.5) * 8;
      this.particleVel[i * 3 + 1] = 2 + Math.random() * 6;
      this.particleVel[i * 3 + 2] = (Math.random() - 0.5) * 8;
      placed++;
    }
  }

  update(
    dt: number,
    time: number,
    player: THREE.Vector3,
    onEnemyHit: (e: Enemy, lethal: boolean) => void,
    onPlayerBolt: (dmg: number, from: THREE.Vector3) => void,
    onPickup: (kind: Pickup["kind"]) => void,
  ) {
    for (const e of this.enemies) {
      if (!e.alive) {
        e.root.visible = false;
        continue;
      }
      e.ang += e.speed * dt;
      e.bob += dt;
      e.flash = Math.max(0, e.flash - dt * 4);
      const x = e.home.x + Math.cos(e.ang) * e.rad;
      const z = e.home.z + Math.sin(e.ang) * e.rad;
      const y = e.home.topY + e.height + Math.sin(e.bob * 2.2) * 0.35;
      e.root.position.set(x, y, z);
      e.root.rotation.y += dt * 1.4;
      e.root.rotation.x = Math.sin(e.bob) * 0.2;
      const mat = e.core.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.65 + e.flash * 1.8;

      e.fireCd -= dt;
      const dist = e.root.position.distanceTo(player);
      if (e.fireCd <= 0 && dist < 22) {
        e.fireCd = 2.4 + Math.random() * 1.6;
        this.fireBolt(e.root.position, player);
      }
    }

    for (const a of this.shots) {
      if (!a.alive) continue;
      a.life -= dt;
      a.prev.copy(a.mesh.position);
      a.mesh.position.addScaledVector(a.vel, dt);
      _v.copy(a.mesh.position).add(a.vel);
      a.mesh.lookAt(_v);

      let hit = false;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = distPointSeg(e.root.position, a.prev, a.mesh.position);
        if (d < 0.75) {
          e.hp -= a.dmg;
          e.flash = 1;
          const lethal = e.hp <= 0;
          if (lethal) {
            e.alive = false;
            this.burst(e.root.position, 0xe14bff);
            if (Math.random() < 0.55) {
              const drop: Pickup["kind"] = Math.random() < 0.4 ? "health" : Math.random() < 0.5 ? "mag" : "ammo";
              this.spawnPickup(drop, e.root.position.x, e.root.position.z, e.home.topY);
            }
          } else {
            this.burst(e.root.position, 0xffe14a);
          }
          onEnemyHit(e, lethal);
          hit = true;
          break;
        }
      }
      if (!hit) {
        const g = sampleGround(a.mesh.position.x, a.mesh.position.z);
        if (g.island && a.mesh.position.y <= g.y + 0.1 && a.prev.y >= g.y) {
          this.burst(a.mesh.position, 0x9b5cff);
          hit = true;
        }
      }
      if (hit || a.life <= 0 || a.mesh.position.y < -8) {
        a.alive = false;
        a.mesh.visible = false;
      }
    }

    for (const b of this.bolts) {
      if (!b.alive) continue;
      b.life -= dt;
      b.mesh.position.addScaledVector(b.vel, dt);
      b.mesh.rotation.x += dt * 8;
      b.mesh.rotation.y += dt * 6;
      if (b.mesh.position.distanceTo(player) < 0.7) {
        onPlayerBolt(12, b.mesh.position);
        this.burst(b.mesh.position, 0xff4d6d);
        b.alive = false;
        b.mesh.visible = false;
        continue;
      }
      const g = sampleGround(b.mesh.position.x, b.mesh.position.z);
      if ((g.island && b.mesh.position.y < g.y) || b.life <= 0 || b.mesh.position.y < -8) {
        b.alive = false;
        b.mesh.visible = false;
      }
    }

    for (const p of this.pickups) {
      if (!p.alive) continue;
      p.bob += dt;
      p.mesh.position.y = p.y + Math.sin(p.bob * 3) * 0.12;
      p.mesh.rotation.y += dt * 1.8;
      if (Math.hypot(p.x - player.x, p.z - player.z) < 1.15 && Math.abs(p.mesh.position.y - player.y) < 1.7) {
        p.alive = false;
        p.mesh.visible = false;
        const col = p.kind === "health" ? 0x7cff3a : p.kind === "mag" ? 0xe14bff : 0xffe14a;
        this.burst(p.mesh.position, col);
        onPickup(p.kind);
      }
    }

    for (let i = 0; i < this.particleLife.length; i++) {
      if (this.particleLife[i]! <= 0) continue;
      this.particleLife[i]! -= dt;
      this.particleVel[i * 3 + 1]! -= 12 * dt;
      this.particlePos[i * 3]! += this.particleVel[i * 3]! * dt;
      this.particlePos[i * 3 + 1]! += this.particleVel[i * 3 + 1]! * dt;
      this.particlePos[i * 3 + 2]! += this.particleVel[i * 3 + 2]! * dt;
      if (this.particleLife[i]! <= 0) this.particlePos[i * 3 + 1] = -99;
    }
    (this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    void time;
    void _v2;
  }

  aliveCount() {
    return this.enemies.filter((e) => e.alive).length;
  }

  enemyDots() {
    return this.enemies.filter((e) => e.alive).map((e) => ({ x: e.root.position.x, z: e.root.position.z, kind: "enemy" as const }));
  }

  pickupDots() {
    return this.pickups.filter((p) => p.alive).map((p) => ({ x: p.x, z: p.z, kind: "pickup" as const }));
  }
}

function makeHealthPickup() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7cff3a,
    emissive: 0x2a8a10,
    emissiveIntensity: 0.7,
    flatShading: true,
  });
  g.add(new THREE.Mesh(new THREE.TetrahedronGeometry(0.32, 1), mat));
  return g;
}

function distPointSeg(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const apz = p.z - a.z;
  const ab2 = abx * abx + aby * aby + abz * abz;
  const t = ab2 > 1e-6 ? THREE.MathUtils.clamp((apx * abx + apy * aby + apz * abz) / ab2, 0, 1) : 0;
  const dx = apx - abx * t;
  const dy = apy - aby * t;
  const dz = apz - abz * t;
  return Math.hypot(dx, dy, dz);
}
