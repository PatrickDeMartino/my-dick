export type Actions = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jump: boolean;
  jumpPressed: boolean;
  fireHeld: boolean;
  firePressed: boolean;
  fireReleased: boolean;
  reloadPressed: boolean;
  weapon1: boolean;
  weapon2: boolean;
  weaponCycle: number;
  pausePressed: boolean;
};

const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "KeyR",
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "Escape",
  "KeyP",
  "KeyM",
  "Digit1",
  "Digit2",
  "KeyF",
]);

function radialDeadzone(x: number, y: number, dz = 0.15) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  keys = new Set<string>();
  injected: string[] | null = null;
  lookAccumX = 0;
  lookAccumY = 0;
  pointerDown = false;
  firePointer = false;
  fireReleased = false;
  firePressedEdge = false;
  jumpPressed = false;
  pausePressed = false;
  reloadPressed = false;
  weapon1 = false;
  weapon2 = false;
  weaponCycle = 0;
  prevJump = false;
  prevFire = false;
  touchMoveX = 0;
  touchMoveY = 0;
  touchLookX = 0;
  touchLookY = 0;
  touchFire = false;
  touchJump = false;
  sprint = false;
  enabled = false;
  private canvas: HTMLCanvasElement;
  private unsubs: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bind();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    this.keys.clear();
    this.firePointer = false;
    this.pointerDown = false;
    this.fireReleased = false;
  }

  setKeys(codes: string[]) {
    this.injected = codes;
  }

  clearInjected() {
    this.injected = null;
  }

  setTouchMove(x: number, y: number) {
    this.touchMoveX = x;
    this.touchMoveY = y;
  }

  setTouchLook(dx: number, dy: number) {
    this.touchLookX += dx;
    this.touchLookY += dy;
  }

  setTouchFire(held: boolean) {
    if (held && !this.touchFire) this.firePressedEdge = true;
    if (this.touchFire && !held) this.fireReleased = true;
    this.touchFire = held;
  }

  setTouchJump(held: boolean) {
    if (held && !this.touchJump) this.jumpPressed = true;
    this.touchJump = held;
  }

  setTouchReload() {
    this.reloadPressed = true;
  }

  setTouchSwap() {
    this.weaponCycle += 1;
  }

  private bind() {
    const onKeyDown = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === "Space") this.jumpPressed = true;
      if (e.code === "Escape" || e.code === "KeyP") this.pausePressed = true;
      if (e.code === "KeyR") this.reloadPressed = true;
      if (e.code === "Digit1") this.weapon1 = true;
      if (e.code === "Digit2") this.weapon2 = true;
      if (e.code === "KeyF") this.weaponCycle += 1;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const onBlur = () => {
      this.keys.clear();
      this.firePointer = false;
      this.pointerDown = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!this.enabled) return;
      const locked = document.pointerLockElement === this.canvas;
      if (locked) {
        this.lookAccumX += e.movementX;
        this.lookAccumY += e.movementY;
      } else if (this.pointerDown) {
        this.lookAccumX += e.movementX;
        this.lookAccumY += e.movementY;
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!this.enabled) return;
      if (e.button === 0 || e.pointerType === "touch") {
        this.pointerDown = true;
        if (e.pointerType !== "touch") {
          this.firePointer = true;
          this.firePressedEdge = true;
        }
      }
      if (e.pointerType === "mouse" && this.canvas.requestPointerLock) {
        try {
          const r = this.canvas.requestPointerLock(
            { unadjustedMovement: true } as Parameters<HTMLElement["requestPointerLock"]>[0],
          );
          if (r && typeof (r as Promise<void>).catch === "function") {
            (r as Promise<void>).catch(() => {
              try {
                this.canvas.requestPointerLock();
              } catch {
                /* iframe may block */
              }
            });
          }
        } catch {
          try {
            this.canvas.requestPointerLock();
          } catch {
            /* ignore */
          }
        }
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 0 || e.pointerType !== "mouse") {
        if (this.firePointer) this.fireReleased = true;
        this.firePointer = false;
        this.pointerDown = false;
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!this.enabled) return;
      if (e.deltaY > 4) this.weaponCycle += 1;
      else if (e.deltaY < -4) this.weaponCycle += 1;
    };
    const onContext = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onBlur);
    this.canvas.addEventListener("mousemove", onMouseMove);
    this.canvas.addEventListener("pointerdown", onPointerDown);
    this.canvas.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    this.canvas.addEventListener("contextmenu", onContext);

    this.unsubs.push(
      () => window.removeEventListener("keydown", onKeyDown),
      () => window.removeEventListener("keyup", onKeyUp),
      () => window.removeEventListener("blur", onBlur),
      () => document.removeEventListener("visibilitychange", onBlur),
      () => this.canvas.removeEventListener("mousemove", onMouseMove),
      () => this.canvas.removeEventListener("pointerdown", onPointerDown),
      () => this.canvas.removeEventListener("wheel", onWheel),
      () => window.removeEventListener("pointerup", onPointerUp),
      () => window.removeEventListener("pointercancel", onPointerUp),
      () => this.canvas.removeEventListener("contextmenu", onContext),
    );
  }

  poll(): Actions {
    const held = this.injected ? new Set(this.injected) : this.keys;
    let moveX = 0;
    let moveY = 0;
    if (held.has("KeyA")) moveX -= 1;
    if (held.has("KeyD")) moveX += 1;
    if (held.has("KeyW") || held.has("ArrowUp")) moveY += 1;
    if (held.has("KeyS") || held.has("ArrowDown")) moveY -= 1;
    moveX += this.touchMoveX;
    moveY += this.touchMoveY;

    const pad = this.pollGamepad();
    moveX += pad.moveX;
    moveY += pad.moveY;
    this.lookAccumX += pad.lookX * 14;
    this.lookAccumY += pad.lookY * 10;
    if (pad.jumpPressed) this.jumpPressed = true;
    if (pad.firePressed) this.firePressedEdge = true;
    if (pad.reloadPressed) this.reloadPressed = true;
    if (pad.weaponCycle) this.weaponCycle += 1;

    const len = Math.hypot(moveX, moveY);
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }

    let lookX = this.lookAccumX + this.touchLookX;
    let lookY = this.lookAccumY + this.touchLookY;
    const turn = 1;
    if (held.has("ArrowLeft") || held.has("KeyQ")) lookX -= turn * 22;
    if (held.has("ArrowRight") || held.has("KeyE")) lookX += turn * 22;

    this.lookAccumX = 0;
    this.lookAccumY = 0;
    this.touchLookX = 0;
    this.touchLookY = 0;

    const fireHeld = this.firePointer || this.touchFire || pad.fireHeld;
    const firePressed = this.firePressedEdge || (!this.prevFire && fireHeld);
    const fireReleased = this.fireReleased;
    const jumpPressed = this.jumpPressed || (!this.prevJump && (held.has("Space") || this.touchJump));
    const jump = held.has("Space") || this.touchJump;
    const pausePressed = this.pausePressed;
    const reloadPressed = this.reloadPressed;
    const weapon1 = this.weapon1;
    const weapon2 = this.weapon2;
    const weaponCycle = this.weaponCycle;

    this.fireReleased = false;
    this.firePressedEdge = false;
    this.jumpPressed = false;
    this.pausePressed = false;
    this.reloadPressed = false;
    this.weapon1 = false;
    this.weapon2 = false;
    this.weaponCycle = 0;
    this.prevJump = jump;
    this.prevFire = fireHeld;
    this.sprint = held.has("ShiftLeft") || held.has("ShiftRight") || pad.sprint;

    return {
      moveX,
      moveY,
      lookX,
      lookY,
      jump,
      jumpPressed,
      fireHeld,
      firePressed,
      fireReleased,
      reloadPressed,
      weapon1,
      weapon2,
      weaponCycle,
      pausePressed,
    };
  }

  private pollGamepad() {
    const empty = {
      moveX: 0,
      moveY: 0,
      lookX: 0,
      lookY: 0,
      jumpPressed: false,
      fireHeld: false,
      firePressed: false,
      reloadPressed: false,
      weaponCycle: false,
      sprint: false,
    };
    if (typeof navigator === "undefined" || !navigator.getGamepads) return empty;
    const pads = navigator.getGamepads();
    for (const p of pads) {
      if (!p || p.mapping !== "standard") continue;
      const ls = radialDeadzone(p.axes[0] ?? 0, p.axes[1] ?? 0, 0.22);
      const rs = radialDeadzone(p.axes[2] ?? 0, p.axes[3] ?? 0, 0.25);
      const a = p.buttons[0];
      const x = p.buttons[2];
      const y = p.buttons[3];
      const rt = p.buttons[7];
      const fireHeld = (rt?.value ?? 0) > 0.4;
      return {
        moveX: ls.x,
        moveY: -ls.y,
        lookX: rs.x * 18,
        lookY: rs.y * 14,
        jumpPressed: Boolean(a?.pressed && a.value > 0.5),
        fireHeld,
        firePressed: fireHeld && !this.prevFire,
        reloadPressed: Boolean(x?.pressed && x.value > 0.5),
        weaponCycle: Boolean(y?.pressed && y.value > 0.5),
        sprint: Boolean(p.buttons[10]?.pressed),
      };
    }
    return empty;
  }

  dispose() {
    for (const u of this.unsubs) u();
    this.unsubs.length = 0;
  }
}
