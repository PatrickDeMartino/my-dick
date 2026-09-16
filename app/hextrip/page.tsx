import FrameWorld from '../world/FrameWorld';
export default function HextripPage() {
  return (
    <main className="hextrip-shell">
      <header className="hextrip-shell__bar">
        <a href="/urf-3d" aria-label="Return to the three planets">← THREE PLANETS</a>
        <strong className="hextrip-shell__orbit-note">ORBIT CAMERA · PRESS C AFTER SPAWNING · DRAG / RIGHT-DRAG / SCROLL</strong>
        <a href="/hextrip-game/" target="_blank" rel="noreferrer">OPEN FULLSCREEN ↗</a>
      </header>
      <FrameWorld
        src="/hextrip-game/"
        title="Hextrip — a Planet Urf hex tabletop game"
      />
      <noscript><a href="https://reef-flora-storm-berry.grok.me">Open Hextrip</a></noscript>
    </main>
  );
}
