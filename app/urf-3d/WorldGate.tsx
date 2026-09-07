"use client";

import { useRouter } from "next/navigation";

export default function WorldGate() {
  const router = useRouter();
  const close = () => {
    if (window.parent !== window) window.parent.postMessage("trip-close-urf", window.location.origin);
    else router.push("/");
  };

  return (
    <main className="urf-gate">
      <div className="urf-gate__dust" aria-hidden="true" />
      <p className="urf-gate__title">CHOOSE A PLANET</p>
      <nav className="urf-gate__orbits" aria-label="Planet Urf worlds">
        <a className="urf-gate__orb urf-gate__orb--one" href="/urf-3d/editor" aria-label="Planet 1: Alien archer globe">
          <b>1</b><span>ARCHER GLOBE</span><small>EXPLORE + BUILD</small>
        </a>
        <a className="urf-gate__orb urf-gate__orb--two" href="/hextrip" aria-label="Planet 2: Hextrip tile world">
          <b>2</b><span>HEXTRIP</span><small>PAINT + SPAWN + PLAY</small>
        </a>
        <a className="urf-gate__orb urf-gate__orb--three" href="/alien-archer" aria-label="Planet 3: Goopy, Doopy and Doorp alien game">
          <b>3</b><span>ALIEN WORLD</span><small>GOOPY · DOOPY · DOORP</small>
        </a>
      </nav>
      <button className="urf-gate__close" type="button" aria-label="Exit Planet Urf" onClick={close}>×</button>
    </main>
  );
}
