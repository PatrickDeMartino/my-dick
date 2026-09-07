import { useEffect, useRef, useState, type RefObject } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useGameStore, applyCharacter, type Phase } from "@/game/store";
import { CHARACTERS, CHARACTER_LIST, type AlienId } from "@/game/characters";
import type { Game } from "@/game/engine";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [booting, setBooting] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let game: Game | null = null;
    void import("@/game/engine")
      .then(({ Game }) => {
        if (disposed || !canvasRef.current) return;
        game = new Game(canvasRef.current);
        gameRef.current = game;
        game.start();
        setBooting(false);
      })
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : "Failed to open the rift");
        setBooting(false);
      });
    return () => {
      disposed = true;
      game?.dispose();
      gameRef.current = null;
    };
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-void-deep text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
      />
      {booting && (
        <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-end justify-center pb-36">
          <p className="font-display text-[11px] tracking-[0.3em] text-lime">SPINNING UP URF</p>
        </div>
      )}
      {err && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-void-deep p-6 text-center">
          <p className="max-w-md text-sm text-muted">{err}</p>
        </div>
      )}
      <Overlay gameRef={gameRef} />
    </main>
  );
}

function Overlay({ gameRef }: { gameRef: RefObject<Game | null> }) {
  const phase = useGameStore((s) => s.phase);
  const ready = useGameStore((s) => s.ready);
  const togglePause = () => gameRef.current?.pauseToggle();

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {phase !== "attract" && <Hud />}
      {phase === "playing" && <PlayingChrome onPause={togglePause} />}
      {phase === "attract" && <TitleScreen gameRef={gameRef} ready={ready} />}
      {phase === "paused" && <PauseScreen onResume={togglePause} onRestart={() => gameRef.current?.play()} gameRef={gameRef} />}
      {phase === "dead" && <DeadScreen onRestart={() => gameRef.current?.play()} />}
      {phase === "playing" && <MobileControls gameRef={gameRef} />}
    </div>
  );
}

function TitleScreen({ gameRef, ready }: { gameRef: RefObject<Game | null>; ready: boolean }) {
  const high = useGameStore((s) => s.highScore);
  const selected = useGameStore((s) => s.character);
  const pick = (id: AlienId) => {
    applyCharacter(id);
    gameRef.current?.setCharacter(id);
  };
  const raid = () => gameRef.current?.play(selected);

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-between bg-gradient-to-t from-void-deep/85 via-transparent to-void-deep/45 px-4 py-6 sm:px-6 sm:py-8">
      <div className="w-full max-w-3xl text-center">
        <p className="font-display text-[11px] tracking-[0.38em] text-magenta">VOID RAID</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-wide text-fg text-balance drop-shadow-[0_4px_24px_rgba(8,0,20,0.85)] sm:text-6xl">
          PLANET <span className="text-lime">URF</span>
        </h1>
      </div>

      <div className="w-full max-w-3xl">
        <p className="mb-3 text-center font-display text-[10px] tracking-[0.28em] text-muted">CHOOSE YOUR RAIDER</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {CHARACTER_LIST.map((id) => (
            <CharacterCard key={id} id={id} active={selected === id} onPick={() => pick(id)} />
          ))}
        </div>
        <div className="mx-auto mt-4 w-full max-w-md rounded-xl border border-border bg-surface/80 p-4 shadow-[0_24px_80px_rgba(8,0,16,0.55)] backdrop-blur-md sm:p-5">
          <ul className="space-y-1 font-display text-[10px] tracking-wider text-muted">
            <li>WASD MOVE · MOUSE / ARROWS LOOK</li>
            <li>CLICK FIRE PEPSI · 1 REVOLVER · 2 AK · R RELOAD</li>
            <li>GOOPY BOW · DOOPY REVOLVER · DOORP AK-47</li>
            <li>SPACE JUMP · SHIFT SPRINT · ESC PAUSE</li>
          </ul>
          {high > 0 && (
            <p className="mt-2 font-display text-xs tabular-nums text-gold">BEST {String(high).padStart(7, "0")}</p>
          )}
          <button
            type="button"
            onClick={raid}
            disabled={!ready}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-lime text-void-deep font-display text-sm tracking-[0.22em] transition-transform duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <Play className="size-4" strokeWidth={2.4} />
            RAID THE ISLES
          </button>
        </div>
      </div>
    </div>
  );
}

function CharacterCard({ id, active, onPick }: { id: AlienId; active: boolean; onPick: () => void }) {
  const def = CHARACTERS[id];
  return (
    <button
      type="button"
      onClick={onPick}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors duration-150 sm:flex-col sm:items-stretch sm:p-4 ${
        active ? "border-lime bg-surface" : "border-border bg-surface/70 hover:border-muted"
      }`}
    >
      <Portrait id={id} className="size-12 shrink-0 sm:size-16 sm:mx-auto" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm tracking-wide text-fg">{def.name}</p>
        <p className="font-display text-[10px] tracking-[0.18em] text-magenta">{def.epithet}</p>
        <p className="mt-1 hidden text-xs leading-relaxed text-muted sm:block">{def.blurb}</p>
        <p className="mt-1 font-display text-[10px] tabular-nums tracking-wider text-muted">
          HP {def.hp} · SPD {def.speed.toFixed(2)}
        </p>
      </div>
    </button>
  );
}

function PauseScreen({
  onResume,
  onRestart,
  gameRef,
}: {
  onResume: () => void;
  onRestart: () => void;
  gameRef: RefObject<Game | null>;
}) {
  const muted = useGameStore((s) => s.muted);
  const shake = useGameStore((s) => s.shake);
  return (
    <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-void-deep/70 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl tracking-wide">PAUSED</h2>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="flex h-11 items-center justify-center gap-2 rounded-md bg-lime text-void-deep font-display text-xs tracking-[0.2em]"
          >
            <Play className="size-4" />
            RESUME
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface-2 font-display text-xs tracking-[0.2em] text-fg"
          >
            <RotateCcw className="size-4" />
            RESTART
          </button>
          <button
            type="button"
            onClick={() => gameRef.current?.setMuted(!muted)}
            className="flex h-11 items-center justify-center gap-2 rounded-md border border-border font-display text-xs tracking-[0.2em] text-muted"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            {muted ? "SOUND OFF" : "SOUND ON"}
          </button>
          <button
            type="button"
            onClick={() => useGameStore.getState().patch({ shake: !shake })}
            className="flex h-11 items-center justify-center rounded-md border border-border font-display text-xs tracking-[0.2em] text-muted"
          >
            SHAKE {shake ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeadScreen({ onRestart }: { onRestart: () => void }) {
  const score = useGameStore((s) => s.score);
  const high = useGameStore((s) => s.highScore);
  const kills = useGameStore((s) => s.kills);
  const wave = useGameStore((s) => s.wave);
  return (
    <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-void-deep/75 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
        <p className="font-display text-[11px] tracking-[0.3em] text-danger">SHATTERED</p>
        <h2 className="mt-2 font-display text-3xl tracking-wide">THE VOID WINS</h2>
        <p className="mt-4 font-display text-2xl tabular-nums text-gold">{String(score).padStart(7, "0")}</p>
        <p className="mt-1 text-xs text-muted">
          Wave {wave} · {kills} prismites · Best {String(high).padStart(7, "0")}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-lime text-void-deep font-display text-sm tracking-[0.2em]"
        >
          <RotateCcw className="size-4" />
          RAID AGAIN
        </button>
      </div>
    </div>
  );
}

function PlayingChrome({ onPause }: { onPause: () => void }) {
  const hint = useGameStore((s) => s.hint);
  const hitFlash = useGameStore((s) => s.hitFlash);
  return (
    <>
      <button
        type="button"
        onClick={onPause}
        className="pointer-events-auto absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-md border border-border bg-surface/80 text-fg backdrop-blur-sm sm:right-4 sm:top-4"
        aria-label="Pause"
      >
        <Pause className="size-4" />
      </button>
      <div className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
        <Crosshair hit={hitFlash} />
      </div>
      {hint && (
        <p className="absolute left-1/2 top-20 -translate-x-1/2 font-display text-[11px] tracking-[0.28em] text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {hint}
        </p>
      )}
    </>
  );
}

function Crosshair({ hit }: { hit: number }) {
  const color = hit > 0.2 ? "text-gold" : "text-lime";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className={`opacity-85 ${color}`}>
      <circle cx="24" cy="24" r="2" className="fill-current" />
      <path d="M24 6v8M24 34v8M6 24h8M34 24h8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Hud() {
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const score = useGameStore((s) => s.score);
  const wave = useGameStore((s) => s.wave);
  const character = useGameStore((s) => s.character);
  const hp = Math.max(0, health / maxHealth);

  return (
    <>
      <div className="absolute left-3 top-3 flex items-start gap-2 sm:left-4 sm:top-4">
        <Portrait id={character} className="size-12 shrink-0 rounded-sm border border-lime bg-surface-2 sm:size-14" />
        <div className="min-w-0">
          <div className="h-3 w-36 overflow-hidden rounded-sm border border-border bg-void-deep/80 sm:w-44">
            <div className="flex h-full">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-full flex-1 border-r border-void-deep last:border-0 ${i < Math.round(hp * 10) ? "bg-magenta" : "bg-transparent"}`}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 font-display text-[10px] tabular-nums tracking-wider text-fg">
            {String(Math.max(0, Math.round(health))).padStart(3, "0")}/{maxHealth}
            <span className="ml-2 text-magenta">{CHARACTERS[character].name}</span>
          </p>
        </div>
      </div>

      <div className="absolute right-14 top-3 text-right sm:right-16 sm:top-4">
        <p className="font-display text-[10px] tracking-[0.25em] text-muted">LVL {wave}</p>
        <p className="font-display text-xl tabular-nums tracking-wider text-gold sm:text-2xl">
          {String(score).padStart(7, "0")}
        </p>
      </div>

      <Minimap />
      <AmmoRack />
    </>
  );
}

function AmmoRack() {
  const weapon = useGameStore((s) => s.weapon);
  const akAmmo = useGameStore((s) => s.akAmmo);
  const akMags = useGameStore((s) => s.akMags);
  const revAmmo = useGameStore((s) => s.revAmmo);
  const revSpare = useGameStore((s) => s.revSpare);
  const reloading = useGameStore((s) => s.reloading);

  return (
    <div className="absolute bottom-4 right-3 flex flex-col items-end gap-1.5 sm:bottom-6 sm:right-5">
      {reloading > 0 && (
        <div className="h-1 w-28 overflow-hidden rounded-full border border-border bg-void-deep/80">
          <div className="h-full bg-gold" style={{ width: `${Math.round(reloading * 100)}%` }} />
        </div>
      )}
      <div className="flex gap-1.5">
        <WeaponChip active={weapon === "revolver"} ammo={revAmmo} reserve={revSpare} label="REV" />
        <WeaponChip active={weapon === "ak"} ammo={akAmmo} reserve={akMags} label="AK" />
      </div>
    </div>
  );
}

function WeaponChip({
  active,
  ammo,
  reserve,
  label,
}: {
  active: boolean;
  ammo: number;
  reserve: number;
  label: string;
}) {
  return (
    <div
      className={`min-w-[72px] rounded-md border px-2.5 py-1.5 ${
        active ? "border-lime bg-surface/90" : "border-border bg-void/70 text-muted"
      }`}
    >
      <p className="font-display text-[9px] tracking-[0.2em]">{label}</p>
      <p className="font-display text-lg tabular-nums leading-none text-fg">
        {String(ammo).padStart(2, "0")}
        <span className="ml-1 text-[11px] text-muted">/{reserve}</span>
      </p>
    </div>
  );
}

function Portrait({ id, className }: { id: AlienId; className?: string }) {
  const fill = id === "vex" ? "#b86aff" : id === "pip" ? "#9dff4a" : "#7cff3a";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" className="fill-surface" />
      {id === "pip" && (
        <>
          <rect x="18" y="4" width="4" height="18" rx="2" fill={fill} />
          <rect x="42" y="4" width="4" height="18" rx="2" fill={fill} />
          <circle cx="20" cy="4" r="4" className="fill-magenta" />
          <circle cx="44" cy="4" r="4" className="fill-magenta" />
        </>
      )}
      {id === "vex" && (
        <>
          <polygon points="22,10 26,22 18,22" className="fill-cyan" />
          <polygon points="42,8 46,20 38,20" className="fill-cyan" />
        </>
      )}
      <ellipse cx="32" cy={id === "pip" ? 38 : 34} rx={id === "zix" ? 15 : 16} ry={id === "zix" ? 22 : 18} fill={fill} />
      <ellipse cx="24" cy={id === "pip" ? 36 : 32} rx="6" ry="8" className="fill-void-deep" />
      <ellipse cx="40" cy={id === "pip" ? 36 : 32} rx="6" ry="8" className="fill-void-deep" />
      <circle cx="26" cy={id === "pip" ? 34 : 30} r="1.6" className="fill-fg" />
      <circle cx="42" cy={id === "pip" ? 34 : 30} r="1.6" className="fill-fg" />
    </svg>
  );
}

function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerX = useGameStore((s) => s.playerX);
  const playerZ = useGameStore((s) => s.playerZ);
  const yaw = useGameStore((s) => s.playerYaw);
  const dots = useGameStore((s) => s.minimap);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(12, 4, 22, 0.82)";
    ctx.fillRect(0, 0, w, h);
    const scale = 1.7;
    const sx = (x: number) => w / 2 + (x - playerX) * scale;
    const sy = (z: number) => h / 2 + (z - playerZ) * scale;
    for (const d of dots) {
      if (d.kind === "island") {
        ctx.fillStyle = "rgba(58, 232, 255, 0.22)";
        ctx.beginPath();
        ctx.arc(sx(d.x), sy(d.z), (d.r ?? 6) * scale, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === "enemy") {
        ctx.fillStyle = "#e14bff";
        ctx.fillRect(sx(d.x) - 2, sy(d.z) - 2, 4, 4);
      } else {
        ctx.fillStyle = "#7cff3a";
        ctx.beginPath();
        ctx.arc(sx(d.x), sy(d.z), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-yaw);
    ctx.fillStyle = "#ffe14a";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [dots, playerX, playerZ, yaw]);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      className="absolute bottom-4 left-3 size-24 rounded-md border border-border bg-void/80 sm:bottom-6 sm:left-5 sm:size-28"
    />
  );
}

function MobileControls({ gameRef }: { gameRef: RefObject<Game | null> }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  const lookPid = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const lastLook = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const stick = stickRef.current;
    const look = lookRef.current;
    const knob = knobRef.current;
    if (!stick || !look || !knob) return;

    const max = 42;
    const onStickDown = (e: PointerEvent) => {
      pid.current = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      const r = stick.getBoundingClientRect();
      origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const onStickMove = (e: PointerEvent) => {
      if (pid.current !== e.pointerId) return;
      let dx = e.clientX - origin.current.x;
      let dy = e.clientY - origin.current.y;
      const m = Math.hypot(dx, dy);
      if (m > max) {
        dx = (dx / m) * max;
        dy = (dy / m) * max;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      gameRef.current?.input.setTouchMove(dx / max, -dy / max);
    };
    const onStickUp = (e: PointerEvent) => {
      if (pid.current !== e.pointerId) return;
      pid.current = null;
      knob.style.transform = "translate(0px, 0px)";
      gameRef.current?.input.setTouchMove(0, 0);
    };

    const onLookDown = (e: PointerEvent) => {
      lookPid.current = e.pointerId;
      look.setPointerCapture(e.pointerId);
      lastLook.current = { x: e.clientX, y: e.clientY };
    };
    const onLookMove = (e: PointerEvent) => {
      if (lookPid.current !== e.pointerId) return;
      const dx = e.clientX - lastLook.current.x;
      const dy = e.clientY - lastLook.current.y;
      lastLook.current = { x: e.clientX, y: e.clientY };
      gameRef.current?.input.setTouchLook(dx * 1.4, dy * 1.4);
    };
    const onLookUp = (e: PointerEvent) => {
      if (lookPid.current !== e.pointerId) return;
      lookPid.current = null;
    };

    stick.addEventListener("pointerdown", onStickDown);
    stick.addEventListener("pointermove", onStickMove);
    stick.addEventListener("pointerup", onStickUp);
    stick.addEventListener("pointercancel", onStickUp);
    look.addEventListener("pointerdown", onLookDown);
    look.addEventListener("pointermove", onLookMove);
    look.addEventListener("pointerup", onLookUp);
    look.addEventListener("pointercancel", onLookUp);
    return () => {
      stick.removeEventListener("pointerdown", onStickDown);
      stick.removeEventListener("pointermove", onStickMove);
      stick.removeEventListener("pointerup", onStickUp);
      stick.removeEventListener("pointercancel", onStickUp);
      look.removeEventListener("pointerdown", onLookDown);
      look.removeEventListener("pointermove", onLookMove);
      look.removeEventListener("pointerup", onLookUp);
      look.removeEventListener("pointercancel", onLookUp);
    };
  }, [gameRef]);

  return (
    <div className="pointer-events-none absolute inset-0 sm:hidden">
      <div ref={lookRef} className="pointer-events-auto absolute inset-y-0 right-0 w-1/2" aria-hidden />
      <div
        ref={stickRef}
        className="pointer-events-auto absolute bottom-28 left-5 size-[112px] rounded-full border border-border bg-surface/40"
      >
        <div
          ref={knobRef}
          className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/80"
        />
      </div>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-28 right-5 grid size-[72px] place-items-center rounded-full border border-magenta bg-magenta/30 font-display text-[10px] tracking-wider text-fg"
        onPointerDown={() => gameRef.current?.input.setTouchFire(true)}
        onPointerUp={() => gameRef.current?.input.setTouchFire(false)}
        onPointerCancel={() => gameRef.current?.input.setTouchFire(false)}
      >
        FIRE
      </button>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-48 right-8 grid size-14 place-items-center rounded-full border border-border bg-surface/60 font-display text-[10px] tracking-wider"
        onPointerDown={() => gameRef.current?.input.setTouchJump(true)}
        onPointerUp={() => gameRef.current?.input.setTouchJump(false)}
        onPointerCancel={() => gameRef.current?.input.setTouchJump(false)}
      >
        JUMP
      </button>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-48 right-[88px] grid size-12 place-items-center rounded-full border border-border bg-surface/60 font-display text-[9px] tracking-wider"
        onPointerDown={() => gameRef.current?.input.setTouchReload()}
      >
        RLD
      </button>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-[13.5rem] right-8 grid size-12 place-items-center rounded-full border border-lime/50 bg-surface/60 font-display text-[9px] tracking-wider"
        onPointerDown={() => gameRef.current?.input.setTouchSwap()}
      >
        SWAP
      </button>
    </div>
  );
}

export type { Phase };
