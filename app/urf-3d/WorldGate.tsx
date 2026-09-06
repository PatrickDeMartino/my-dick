"use client";

import Link from "next/link";
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
      <p className="urf-gate__title">CHOOSE A VOID</p>
      <nav className="urf-gate__orbits" aria-label="Planet Urf worlds">
        <Link className="urf-gate__orb urf-gate__orb--one" href="/urf-3d/editor" aria-label="Option 1: Planet Urf world editor">
          <b>1</b><span>URF EDITOR</span>
        </Link>
        <Link className="urf-gate__orb urf-gate__orb--two" href="/alien-archer" aria-label="Option 2: Alien sandbox">
          <b>2</b><span>ALIEN SANDBOX</span>
        </Link>
      </nav>
      <button className="urf-gate__close" type="button" aria-label="Exit Planet Urf" onClick={close}>×</button>
    </main>
  );
}
