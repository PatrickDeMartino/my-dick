type OscType = OscillatorType;

export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  music: GainNode | null = null;
  sfx: GainNode | null = null;
  muted = false;
  private ambient: OscillatorNode[] = [];
  private started = false;

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.music.gain.value = 0.22;
      this.sfx.gain.value = 0.8;
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (!this.started) {
      this.started = true;
      this.startAmbient();
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.04);
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private startAmbient() {
    const ctx = this.ctx;
    const music = this.music;
    if (!ctx || !music) return;
    const freqs = [98, 147, 196];
    for (const f of freqs) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const fnode = ctx.createBiquadFilter();
      o.type = "sine";
      o.frequency.value = f;
      fnode.type = "lowpass";
      fnode.frequency.value = 420;
      g.gain.value = 0.07;
      o.connect(fnode);
      fnode.connect(g);
      g.connect(music);
      o.start();
      this.ambient.push(o);
    }
  }

  tone(freq: number, dur: number, type: OscType, gain = 0.12, slide = 0) {
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(sfx);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  noise(dur: number, gain = 0.16, hp = 400) {
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(sfx);
    src.start();
    src.stop(ctx.currentTime + dur);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }

  akFire() {
    const jitter = (Math.random() - 0.5) * 40;
    this.noise(0.07, 0.22, 700);
    this.tone(180 + jitter, 0.08, "square", 0.09, -80);
    this.tone(90 + jitter * 0.3, 0.06, "sawtooth", 0.07, -40);
  }

  revolverFire() {
    this.noise(0.16, 0.28, 280);
    this.tone(110, 0.18, "sawtooth", 0.14, -70);
    this.tone(240, 0.1, "square", 0.08, -120);
    this.tone(70, 0.22, "sine", 0.1, -20);
  }

  empty() {
    this.tone(180, 0.06, "square", 0.05, -40);
    this.noise(0.05, 0.06, 1200);
  }

  reload() {
    this.tone(220, 0.08, "triangle", 0.06, 80);
    this.noise(0.1, 0.08, 800);
    this.tone(140, 0.12, "square", 0.04, 40);
  }

  hit() {
    this.noise(0.12, 0.2, 300);
    this.tone(520, 0.1, "square", 0.07, -200);
    this.tone(880, 0.08, "triangle", 0.05, 200);
  }

  shatter() {
    this.noise(0.28, 0.28, 600);
    this.tone(740, 0.22, "triangle", 0.1, 400);
    this.tone(220, 0.3, "sine", 0.1, -80);
  }

  pickup() {
    this.tone(660, 0.12, "sine", 0.1, 200);
    this.tone(990, 0.16, "triangle", 0.08, 120);
  }

  hurt() {
    this.tone(140, 0.25, "sawtooth", 0.12, -80);
    this.noise(0.2, 0.18, 200);
  }

  jump() {
    this.tone(240, 0.12, "sine", 0.07, 180);
  }

  land() {
    this.noise(0.08, 0.1, 200);
  }

  ui() {
    this.tone(440, 0.08, "triangle", 0.06);
  }

  death() {
    this.tone(180, 0.6, "sawtooth", 0.14, -140);
    this.tone(90, 0.8, "sine", 0.12, -40);
  }

  wave() {
    this.tone(392, 0.18, "triangle", 0.08);
    this.tone(523, 0.22, "sine", 0.07, 80);
  }

  footstep() {
    this.noise(0.05, 0.05 + Math.random() * 0.03, 150);
  }

  dispose() {
    for (const o of this.ambient) {
      try {
        o.stop();
        o.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.ambient = [];
    void this.ctx?.close();
    this.ctx = null;
  }
}
