import * as THREE from "three";
import { Input } from "./input";
import { GameAudio } from "./audio";
import { createAlien, updateAlien, getMuzzleWorld, type AlienRig } from "./alien";
import { createWorld, updateWorld, sampleGround, ISLANDS, type WorldHandle } from "./world";
import { Combat } from "./combat";
import { persistHighScore, useGameStore, hydrateHighScore, applyCharacter, type MinimapDot } from "./store";
import { CHARACTERS, WEAPONS, type AlienId, type WeaponId } from "./characters";

const LOOK_SENS = 0.0024;
const PITCH_MIN = -0.95;
const PITCH_MAX = 0.72;
const GRAVITY = -28;
const JUMP_V = 10.5;
const WALK = 6.4;
const SPRINT = 9.2;
const COYOTE = 0.12;

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _muzzle = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _shake = new THREE.Vector3();
const _localAim = new THREE.Vector3();
const _parentQ = new THREE.Quaternion();
const _barrelForward = new THREE.Vector3(0, 0, 1);

type LooseProp = { root: THREE.Group; vel: THREE.Vector3; spin: THREE.Vector3 };

function makeCan(kind: "rat-meat" | "rat-meat-silver" | "rat-meat-gold" | "yoohoo") {
  const group = new THREE.Group();
  const gold = kind === "rat-meat-gold";
  const labelFile = kind === "rat-meat" ? "rat-meat-label.jpg" : kind === "rat-meat-silver" ? "rat-meat-silver-label.jpg" : kind === "rat-meat-gold" ? "rat-meat-gold-label.jpg" : "yoohoo-label.png";
  const texture = new THREE.TextureLoader().load(`./${labelFile}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  const label = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.08 });
  const metal = new THREE.MeshStandardMaterial({ color: gold ? 0xd5a52b : 0xcbd1d2, roughness: gold ? 0.2 : 0.3, metalness: 0.9 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.72, 28, 1, false), [label, metal, metal]);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  const rim = new THREE.TorusGeometry(0.29, 0.025, 8, 28);
  [0.36, -0.36].forEach((y) => {
    const ring = new THREE.Mesh(rim, metal);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  });
  return group;
}

export class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  input: Input;
  audio = new GameAudio();
  world: WorldHandle;
  alien: AlienRig;
  combat = new Combat();
  shadow: THREE.Mesh;

  camYaw = 0.35;
  camPitch = -0.18;
  facingYaw = 0.35;
  pos = new THREE.Vector3(0, 0, 0);
  vel = new THREE.Vector3();
  grounded = true;
  coyote = 0;
  lastIsland = ISLANDS[0]!;
  invuln = 0;
  trauma = 0;
  hintT = 0;
  time = 0;
  acc = 0;
  lastTs = 0;
  running = false;
  reduced = false;
  quality: "high" | "low" = "high";
  stepDist = 0;
  hudClock = 0;
  waveClearing = false;
  playAge = 0;
  fireCd = 0;
  reloadT = 0;
  lights: THREE.Light[] = [];
  muzzleLight: THREE.PointLight;
  private injectedSteer = 0;
  private onResize: () => void;
  private onVis: () => void;
  private loop: (t: number) => void;
  private justShot = false;
  private looseProps: LooseProp[] = [];
  private onSpawnMessage: (event: MessageEvent) => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.quality =
      window.innerWidth < 700 || /Mobi|Android/i.test(navigator.userAgent) ? "low" : "high";
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.quality === "high",
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === "high" ? 2 : 1.25));
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.42;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a0a48);
    this.scene.fog = new THREE.Fog(0x3a1460, 90, 320);

    this.camera = new THREE.PerspectiveCamera(
      62,
      (canvas.clientWidth || window.innerWidth) / Math.max(1, canvas.clientHeight || window.innerHeight),
      0.1,
      700,
    );

    this.input = new Input(canvas);
    this.world = createWorld(this.quality);
    this.scene.add(this.world.group);

    this.alien = createAlien("zix");
    this.scene.add(this.alien.root);
    this.scene.add(this.combat.group);

    const shadowGeo = new THREE.CircleGeometry(0.45, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    this.shadow = new THREE.Mesh(
      shadowGeo,
      new THREE.MeshBasicMaterial({ color: 0x14051f, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    this.scene.add(this.shadow);

    this.muzzleLight = new THREE.PointLight(0xffe14a, 0, 8, 2);
    this.scene.add(this.muzzleLight);

    this.setupLights();

    this.pos.set(0, sampleGround(0, 0).y, 2);
    this.alien.root.position.copy(this.pos);
    this.camYaw = 0;
    this.facingYaw = 0;

    this.onResize = () => this.resize();
    this.onVis = () => {
      if (document.visibilityState === "visible") this.audio.resume();
    };
    this.onSpawnMessage = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== "urf-spawn") return;
      const requested = String(event.data.kind || "");
      if (["zix", "pip", "vex"].includes(requested)) {
        this.setCharacter(requested as AlienId);
      } else if (requested === "rat-meat") {
        const roll = Math.random();
        this.spawnCan(roll < 0.7 ? "rat-meat" : roll < 0.92 ? "rat-meat-silver" : "rat-meat-gold");
      } else if (["rat-meat-silver", "rat-meat-gold", "yoohoo"].includes(requested)) {
        this.spawnCan(requested as "rat-meat-silver" | "rat-meat-gold" | "yoohoo");
      }
    };
    window.addEventListener("resize", this.onResize);
    window.addEventListener("message", this.onSpawnMessage);
    document.addEventListener("visibilitychange", this.onVis);

    this.loop = (t) => this.frame(t);

    hydrateHighScore();
    this.syncHud(true);
    this.installProbe();
    useGameStore.getState().patch({ ready: true });
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x8a70c0, 0.7);
    this.scene.add(ambient);
    this.lights.push(ambient);

    const hemi = new THREE.HemisphereLight(0xffb0f0, 0x2a6a58, 1.15);
    this.scene.add(hemi);
    this.lights.push(hemi);

    const dir = new THREE.DirectionalLight(0xfff4dd, 1.85);
    dir.position.set(18, 34, 22);
    this.scene.add(dir);
    this.lights.push(dir);

    const fill = new THREE.DirectionalLight(0x66f0ff, 0.55);
    fill.position.set(-22, 12, -16);
    this.scene.add(fill);
    this.lights.push(fill);

    const rim = new THREE.PointLight(0xff66ee, 28, 55, 2);
    rim.position.set(0, 10, 0);
    this.scene.add(rim);
    this.lights.push(rim);

    const globeFill = new THREE.PointLight(0x57d9c8, 55, 110, 2);
    globeFill.position.set(32, 10, -40);
    this.scene.add(globeFill);
    this.lights.push(globeFill);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.resize();
    this.lastTs = performance.now();
    this.renderer.setAnimationLoop(this.loop);
    requestAnimationFrame(() => this.resize());
  }

  setCharacter(id: AlienId) {
    if (this.alien.kind === id) {
      applyCharacter(id);
      return;
    }
    this.scene.remove(this.alien.root);
    this.alien = createAlien(id);
    this.scene.add(this.alien.root);
    applyCharacter(id);
    this.placeAlien();
  }

  play(id?: AlienId) {
    this.audio.unlock();
    this.audio.ui();
    if (id) this.setCharacter(id);
    this.resetRun();
    this.input.setEnabled(true);
    this.input.lookAccumX = 0;
    this.input.lookAccumY = 0;
    this.camYaw = 0;
    this.camPitch = -0.14;
    this.facingYaw = 0;
    this.hintT = 5;
    useGameStore.getState().patch({ phase: "playing", hint: "CLICK TO FIRE  ·  1 / 2 SWAP  ·  R RELOAD" });
  }

  private tryPointerLock() {
    const el = this.canvas as HTMLCanvasElement & {
      requestPointerLock: (opts?: { unadjustedMovement?: boolean }) => Promise<void> | void;
    };
    try {
      const r = el.requestPointerLock({ unadjustedMovement: true });
      if (r && typeof (r as Promise<void>).catch === "function") {
        (r as Promise<void>).catch(() => {
          try {
            el.requestPointerLock();
          } catch {
            /* iframe may block */
          }
        });
      }
    } catch {
      try {
        el.requestPointerLock();
      } catch {
        /* ignore */
      }
    }
  }

  pauseToggle() {
    const phase = useGameStore.getState().phase;
    if (phase === "playing") {
      useGameStore.getState().patch({ phase: "paused" });
      this.input.setEnabled(false);
      document.exitPointerLock?.();
    } else if (phase === "paused") {
      useGameStore.getState().patch({ phase: "playing" });
      this.input.setEnabled(true);
      this.tryPointerLock();
    }
  }

  setMuted(m: boolean) {
    this.audio.setMuted(m);
    useGameStore.getState().patch({ muted: m });
  }

  private resetRun() {
    const st = useGameStore.getState();
    const def = CHARACTERS[st.character];
    this.pos.set(0, sampleGround(0, 0).y, 2);
    this.vel.set(0, 0, 0);
    this.camYaw = 0;
    this.camPitch = -0.14;
    this.facingYaw = 0;
    this.invuln = 0;
    this.trauma = 0;
    this.waveClearing = false;
    this.playAge = 0;
    this.fireCd = 0;
    this.reloadT = 0;
    this.combat.spawnWave(1);
    useGameStore.getState().patch({
      health: def.hp,
      maxHealth: def.hp,
      akAmmo: 30,
      akMags: 2,
      revAmmo: 6,
      revSpare: 24,
      reloading: 0,
      weapon: "revolver",
      score: 0,
      wave: 1,
      kills: 0,
    });
  }

  private frame(now: number) {
    const raw = Math.min(0.1, (now - this.lastTs) / 1000);
    this.lastTs = now;
    this.time += raw;
    this.acc += raw;
    const FIXED = 1 / 60;
    while (this.acc >= FIXED) {
      this.fixed(FIXED);
      this.acc -= FIXED;
    }
    this.present(raw);
  }

  private fixed(dt: number) {
    const st = useGameStore.getState();
    const phase = st.phase;
    this.justShot = false;

    if (phase === "attract") {
      if (this.alien.kind !== st.character) this.setCharacter(st.character);
      this.facingYaw = 0.15;
      updateAlien(this.alien, {
        dt,
        speed: 0,
        grounded: true,
        vy: 0,
        justLanded: false,
        justShot: false,
        attract: true,
        time: this.time,
        weapon: st.weapon,
        firing: false,
        reload: 0,
        revLoaded: st.revAmmo,
      });
      this.placeAlien();
      return;
    }

    if (phase !== "playing") return;

    this.playAge += dt;
    const act = this.input.poll();
    if (act.pausePressed) {
      this.pauseToggle();
      return;
    }

    if (this.playAge > 0.5) {
      this.camYaw -= act.lookX * LOOK_SENS;
      this.camPitch -= act.lookY * LOOK_SENS;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch, PITCH_MIN, PITCH_MAX);
    }

    if (this.injectedSteer !== 0) {
      this.camYaw += this.injectedSteer * 1.8 * dt;
    }

    _fwd.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
    _right.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));

    let weapon: WeaponId = st.weapon;
    if (act.weapon1) weapon = "revolver";
    if (act.weapon2) weapon = "ak";
    if (act.weaponCycle) weapon = weapon === "ak" ? "revolver" : "ak";
    if (weapon !== st.weapon && this.reloadT <= 0) {
      useGameStore.getState().patch({ weapon });
      this.audio.ui();
    }
    weapon = useGameStore.getState().weapon;

    if (act.reloadPressed) this.beginReload();

    if (this.reloadT > 0) {
      this.reloadT -= dt;
      const spec = WEAPONS[weapon];
      const t = 1 - this.reloadT / spec.reload;
      useGameStore.getState().patch({ reloading: THREE.MathUtils.clamp(t, 0, 1) });
      if (this.reloadT <= 0) this.finishReload();
    } else {
      useGameStore.getState().patch({ reloading: 0 });
    }

    this.fireCd = Math.max(0, this.fireCd - dt);
    const firing = this.reloadT <= 0 && this.playAge > 0.4 && (WEAPONS[weapon].auto ? act.fireHeld : act.firePressed);
    if (firing) this.tryFire();
    else if (act.firePressed && this.chamber() <= 0) this.audio.empty();

    const def = CHARACTERS[st.character];
    const speedMax = (this.input.sprint ? SPRINT : WALK) * def.speed * (act.fireHeld ? 0.72 : 1);
    const wishX = _fwd.x * act.moveY + _right.x * act.moveX;
    const wishZ = _fwd.z * act.moveY + _right.z * act.moveX;
    const wishLen = Math.hypot(wishX, wishZ);
    const accel = this.grounded ? 28 : 8;
    if (wishLen > 0.05) {
      const nx = wishX / wishLen;
      const nz = wishZ / wishLen;
      this.vel.x += nx * accel * dt;
      this.vel.z += nz * accel * dt;
      const targetYaw = Math.atan2(-nx, -nz);
      this.facingYaw = lerpAngle(this.facingYaw, act.fireHeld ? this.camYaw : targetYaw, 1 - Math.exp(-10 * dt));
    } else if (act.fireHeld) {
      this.facingYaw = lerpAngle(this.facingYaw, this.camYaw, 1 - Math.exp(-8 * dt));
    }
    const damp = this.grounded ? 8 : 1.6;
    this.vel.x -= this.vel.x * damp * dt;
    this.vel.z -= this.vel.z * damp * dt;
    const hsp = Math.hypot(this.vel.x, this.vel.z);
    if (hsp > speedMax) {
      this.vel.x *= speedMax / hsp;
      this.vel.z *= speedMax / hsp;
    }

    const wasGrounded = this.grounded;
    if (this.grounded) this.coyote = COYOTE;
    else this.coyote -= dt;

    if (act.jumpPressed && this.coyote > 0) {
      this.vel.y = JUMP_V * def.jump;
      this.grounded = false;
      this.coyote = 0;
      this.audio.jump();
    }

    this.vel.y += GRAVITY * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;

    const g = sampleGround(this.pos.x, this.pos.z);
    let justLanded = false;
    if (g.island && this.pos.y <= g.y + 0.02 && this.vel.y <= 0) {
      this.pos.y = g.y;
      if (!wasGrounded && this.vel.y < -4) {
        justLanded = true;
        this.audio.land();
        this.trauma = Math.min(1, this.trauma + 0.12);
      }
      this.vel.y = 0;
      this.grounded = true;
      this.lastIsland = g.island;
    } else {
      this.grounded = false;
    }

    if (!this.grounded) {
      const g2 = sampleGround(this.pos.x, this.pos.z);
      if (g2.island && this.pos.y < g2.y - 0.2 && this.pos.y > g2.y - 2.4) {
        this.pos.x -= this.vel.x * dt * 1.2;
        this.pos.z -= this.vel.z * dt * 1.2;
      }
    }

    if (this.pos.y < -6) this.fall();

    this.invuln = Math.max(0, this.invuln - dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    this.hintT = Math.max(0, this.hintT - dt);
    this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 40);

    const xzSpeed = Math.hypot(this.vel.x, this.vel.z);
    this.stepDist += xzSpeed * dt;
    if (this.grounded && this.stepDist > 1.6) {
      this.stepDist = 0;
      this.audio.footstep();
    }

    const live = useGameStore.getState();
    updateAlien(this.alien, {
      dt,
      speed: xzSpeed,
      grounded: this.grounded,
      vy: this.vel.y,
      justLanded,
      justShot: this.justShot,
      attract: false,
      time: this.time,
      weapon: live.weapon,
      firing: act.fireHeld,
      reload: live.reloading,
      revLoaded: live.revAmmo,
    });
    this.placeAlien();
    this.stepLooseProps(dt);

    const playerHead = _look.set(this.pos.x, this.pos.y + 1.2 * def.scale, this.pos.z);
    this.combat.update(
      dt,
      this.time,
      playerHead,
      (_e, lethal) => {
        this.audio.hit();
        this.trauma = Math.min(1, this.trauma + (lethal ? 0.35 : 0.18));
        useGameStore.getState().patch({ hitFlash: 1 });
        const add = lethal ? 150 : 40;
        const score = live.score + add;
        const kills = live.kills + (lethal ? 1 : 0);
        useGameStore.getState().patch({ score, kills });
        persistHighScore(score);
        if (lethal) this.audio.shatter();
      },
      (dmg) => {
        this.hurt(dmg);
      },
      (kind) => {
        this.audio.pickup();
        const s = useGameStore.getState();
        const bonus = CHARACTERS[s.character].pickupBonus;
        if (kind === "mag") {
          useGameStore.getState().patch({ akMags: s.akMags + 1 + bonus });
        } else if (kind === "ammo") {
          useGameStore.getState().patch({ revSpare: s.revSpare + 12 + bonus * 6 });
        } else {
          useGameStore.getState().patch({ health: Math.min(s.maxHealth, s.health + 22) });
        }
      },
    );

    if (!this.waveClearing && this.combat.aliveCount() === 0 && live.phase === "playing") {
      this.waveClearing = true;
      const next = live.wave + 1;
      useGameStore.getState().patch({
        wave: next,
        hint: `WAVE ${next}`,
        akMags: live.akMags + 1,
        revSpare: live.revSpare + 6,
      });
      this.audio.wave();
      this.hintT = 2.4;
      window.setTimeout(() => {
        if (useGameStore.getState().phase !== "playing") return;
        this.combat.spawnWave(next);
        this.waveClearing = false;
      }, 1600);
    }

    const hf = useGameStore.getState().hitFlash;
    if (hf > 0) useGameStore.getState().patch({ hitFlash: Math.max(0, hf - dt * 4) });

    this.hudClock += dt;
    if (this.hudClock > 0.08) {
      this.hudClock = 0;
      this.syncHud(false);
    }
  }

  private chamber() {
    const s = useGameStore.getState();
    return s.weapon === "ak" ? s.akAmmo : s.revAmmo;
  }

  private tryFire() {
    if (this.fireCd > 0 || this.reloadT > 0) return;
    const s = useGameStore.getState();
    const spec = WEAPONS[s.weapon];
    const def = CHARACTERS[s.character];
    const ammo = s.weapon === "ak" ? s.akAmmo : s.revAmmo;
    if (ammo <= 0) {
      this.audio.empty();
      this.fireCd = 0.18;
      if (s.weapon === "ak" ? s.akMags > 0 : s.revSpare > 0) this.beginReload();
      return;
    }

    getMuzzleWorld(this.alien, s.weapon, _muzzle);
    this.camera.getWorldDirection(_aim);
    _dir.copy(_aim);
    const spread = spec.spread * (this.input.sprint ? 1.4 : 1);
    _dir.x += (Math.random() - 0.5) * spread;
    _dir.y += (Math.random() - 0.5) * spread * 0.6;
    _dir.z += (Math.random() - 0.5) * spread;
    _dir.normalize();
    const ok = this.combat.fireShot(_muzzle, _dir, s.weapon, spec.damage, spec.speed);
    if (!ok) return;

    this.justShot = true;
    this.fireCd = spec.cooldown;
    this.camPitch = Math.min(PITCH_MAX, this.camPitch + 0.018 * def.recoil * (s.weapon === "ak" ? 0.7 : 1.4));
    this.camYaw += (Math.random() - 0.5) * 0.012 * def.recoil;
    this.trauma = Math.min(1, this.trauma + (s.weapon === "ak" ? 0.08 : 0.16));
    this.muzzleLight.position.copy(_muzzle);
    this.muzzleLight.intensity = s.weapon === "ak" ? 6 : 10;

    if (s.weapon === "ak") {
      this.audio.akFire();
      useGameStore.getState().patch({ akAmmo: s.akAmmo - 1 });
    } else {
      this.audio.revolverFire();
      useGameStore.getState().patch({ revAmmo: s.revAmmo - 1 });
    }
  }

  private beginReload() {
    if (this.reloadT > 0) return;
    const s = useGameStore.getState();
    const spec = WEAPONS[s.weapon];
    if (s.weapon === "ak") {
      if (s.akMags <= 0 || s.akAmmo >= spec.magSize) return;
    } else if (s.revSpare <= 0 || s.revAmmo >= spec.magSize) return;
    this.reloadT = spec.reload;
    this.audio.reload();
    useGameStore.getState().patch({ reloading: 0.01 });
  }

  private finishReload() {
    const s = useGameStore.getState();
    const spec = WEAPONS[s.weapon];
    if (s.weapon === "ak") {
      if (s.akMags <= 0) return;
      useGameStore.getState().patch({ akAmmo: spec.magSize, akMags: s.akMags - 1, reloading: 0 });
    } else {
      const need = spec.magSize - s.revAmmo;
      const take = Math.min(need, s.revSpare);
      useGameStore.getState().patch({ revAmmo: s.revAmmo + take, revSpare: s.revSpare - take, reloading: 0 });
    }
    this.reloadT = 0;
  }

  private placeAlien() {
    this.alien.root.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.alien.root.rotation.order = "YXZ";
    this.alien.root.rotation.y = this.facingYaw + Math.PI;
    const g = sampleGround(this.pos.x, this.pos.z);
    this.shadow.position.set(this.pos.x, (g.island ? g.y : this.pos.y) + 0.03, this.pos.z);
    const air = this.grounded ? 1 : THREE.MathUtils.clamp(1 - (this.pos.y - (g.y || 0)) * 0.25, 0.1, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.4 * air;
    this.shadow.scale.setScalar(air);
  }

  private aimWeapon() {
    this.camera.getWorldDirection(_localAim);
    const parent = this.alien.gunMount.parent;
    if (!parent) return;
    parent.updateWorldMatrix(true, false);
    parent.getWorldQuaternion(_parentQ).invert();
    _localAim.applyQuaternion(_parentQ).normalize();
    this.alien.gunMount.quaternion.setFromUnitVectors(_barrelForward, _localAim);
  }

  private spawnCan(kind: "rat-meat" | "rat-meat-silver" | "rat-meat-gold" | "yoohoo") {
    const root = makeCan(kind);
    this.camera.getWorldDirection(_aim);
    root.position.set(this.pos.x + _aim.x * 2.2, this.pos.y + 2.6, this.pos.z + _aim.z * 2.2);
    root.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    this.scene.add(root);
    this.looseProps.push({ root, vel: new THREE.Vector3(_aim.x * 3.5, 2.2, _aim.z * 3.5), spin: new THREE.Vector3(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5) });
    if (this.looseProps.length > 30) this.scene.remove(this.looseProps.shift()!.root);
  }

  private stepLooseProps(dt: number) {
    for (const prop of this.looseProps) {
      prop.vel.y += GRAVITY * 0.62 * dt;
      prop.root.position.addScaledVector(prop.vel, dt);
      prop.root.rotation.x += prop.spin.x * dt;
      prop.root.rotation.y += prop.spin.y * dt;
      prop.root.rotation.z += prop.spin.z * dt;
      const ground = sampleGround(prop.root.position.x, prop.root.position.z);
      if (ground.island && prop.root.position.y < ground.y + 0.38) {
        prop.root.position.y = ground.y + 0.38;
        prop.vel.y = Math.abs(prop.vel.y) * 0.42;
        prop.vel.x *= 0.82;
        prop.vel.z *= 0.82;
        prop.spin.multiplyScalar(0.9);
      }
      const dx = prop.root.position.x - this.pos.x;
      const dz = prop.root.position.z - this.pos.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.85 && distance > 0.001) {
        prop.vel.x += (dx / distance) * 5 * dt;
        prop.vel.z += (dz / distance) * 5 * dt;
      }
    }
  }

  private hurt(dmg: number) {
    if (this.invuln > 0) return;
    const st = useGameStore.getState();
    const health = Math.max(0, st.health - dmg);
    this.invuln = 0.85;
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.audio.hurt();
    useGameStore.getState().patch({ health });
    if (health <= 0) this.die();
  }

  private fall() {
    const st = useGameStore.getState();
    const health = Math.max(0, st.health - 28);
    this.audio.hurt();
    this.trauma = 1;
    this.pos.set(this.lastIsland.x, this.lastIsland.topY + 0.1, this.lastIsland.z);
    this.vel.set(0, 0, 0);
    this.grounded = true;
    this.invuln = 1.2;
    useGameStore.getState().patch({ health, hint: "VOID PULL" });
    this.hintT = 1.6;
    if (health <= 0) this.die();
  }

  private die() {
    persistHighScore(useGameStore.getState().score);
    hydrateHighScore();
    this.audio.death();
    this.input.setEnabled(false);
    document.exitPointerLock?.();
    useGameStore.getState().patch({ phase: "dead", hint: "" });
  }

  private present(dt: number) {
    updateWorld(this.world, this.time, this.camera.position, this.reduced);
    const st = useGameStore.getState();
    const def = CHARACTERS[st.character];

    const followH = def.followH;
    const followD = 6.2;
    _fwd.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
    _right.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
    const cp = this.camPitch;
    const cosP = Math.cos(cp);
    const lookY = Math.sin(cp);
    _desired.set(
      this.pos.x - _fwd.x * followD * cosP + _right.x * 0.85,
      this.pos.y + followH - lookY * followD * 0.35,
      this.pos.z - _fwd.z * followD * cosP + _right.z * 0.85,
    );

    if (st.phase === "attract") {
      const t = this.time * 0.18;
      _desired.set(Math.sin(t) * 8.4, 3.1 + Math.sin(t * 0.7) * 0.5, Math.cos(t) * 8.4);
    }

    const k = 1 - Math.exp(-5.5 * dt);
    this.camera.position.lerp(_desired, k);
    _camTarget.set(this.pos.x, this.pos.y + 1.25 * def.scale, this.pos.z);
    this.camera.lookAt(_camTarget);
    this.aimWeapon();

    if (this.trauma > 0 && !this.reduced && st.shake) {
      const s = this.trauma * this.trauma;
      _shake.set((Math.random() - 0.5) * s * 0.28, (Math.random() - 0.5) * s * 0.2, (Math.random() - 0.5) * s * 0.28);
      this.camera.position.add(_shake);
    }

    const flash = this.invuln > 0 && Math.sin(this.time * 28) > 0;
    this.alien.root.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material && "emissive" in o.material) {
        const m = o.material as THREE.MeshStandardMaterial;
        if (m.color && m.color.getHex() === this.alien.skinHex) {
          m.emissive.setHex(flash ? 0xff4d6d : CHARACTERS[this.alien.kind].emissive);
          m.emissiveIntensity = flash ? 0.7 : 0.2;
        }
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  private syncHud(force: boolean) {
    const st = useGameStore.getState();
    const minimap: MinimapDot[] = [
      ...ISLANDS.map((i) => ({ x: i.x, z: i.z, kind: "island" as const, r: i.radius })),
      ...this.combat.enemyDots(),
      ...this.combat.pickupDots(),
    ];
    const high = Math.max(st.highScore, st.score);
    useGameStore.getState().patch({
      playerX: this.pos.x,
      playerZ: this.pos.z,
      playerYaw: this.camYaw,
      grounded: this.grounded,
      minimap,
      highScore: high,
      hint: this.hintT > 0 ? st.hint : force ? st.hint : "",
    });
  }

  private installProbe() {
    window.__controlsTest = {
      getYaw: () => this.camYaw,
      getSpeed: () => Math.hypot(this.vel.x, this.vel.z),
      getPosition: () => ({ x: this.pos.x, y: this.pos.y, z: this.pos.z }),
      setKeys: (codes: string[]) => {
        if (codes.length === 0) this.input.clearInjected();
        else this.input.setKeys(codes);
      },
      setSteer: (v: number) => {
        this.injectedSteer = v;
      },
    };
  }

  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  dispose() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.input.dispose();
    this.audio.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) m.dispose();
      }
    });
    for (const t of this.world.textures) t.dispose();
    this.renderer.dispose();
    delete window.__controlsTest;
  }
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPosition: () => { x: number; y: number; z: number };
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}
