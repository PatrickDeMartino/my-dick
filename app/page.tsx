"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HomeGlobe from "./components/HomeGlobe";
import HomeRoom3D, { spawnHomeCan } from "./components/HomeRoom3D";

const smokePuffs = Array.from({ length: 7 }, (_, index) => index);

export default function LandingPage() {
  const [showUrf, setShowUrf] = useState(false);

  useEffect(() => {
    const closeUrf = () => setShowUrf(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeUrf();
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data === "trip-close-urf") closeUrf();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("message", handleMessage);
    if (showUrf) document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("message", handleMessage);
      document.body.style.overflow = "";
    };
  }, [showUrf]);

  return (
    <main className="choice-landing" aria-label="Choose where your journey begins">
      <HomeRoom3D />
      <div className="choice-world-stage" aria-label="Choose between Planet Urf and Dr. Bongo">
        <button
          className="choice-object choice-object-earth"
          type="button"
          data-portal="earth"
          aria-label="Open the Planet Urf world selector"
          aria-haspopup="dialog"
          onClick={() => setShowUrf(true)}
        >
          <span className="choice-object-visual choice-object-visual--globe" aria-hidden="true">
            <HomeGlobe onActivate={() => setShowUrf(true)} />
          </span>
          <span className="choice-smoke" aria-hidden="true">
            {smokePuffs.map((puff) => <i key={puff} />)}
          </span>
          <span className="choice-object-label">
            <strong>Planet Urf</strong>
            <small>reality phisico</small>
          </span>
        </button>

        <a
          className="choice-object choice-object-brain"
          href="/brain-room"
          data-portal="brain"
          aria-label="Open Dr. Bongo"
        >
          <span className="choice-object-visual" aria-hidden="true" />
          <span className="choice-smoke" aria-hidden="true">
            {smokePuffs.map((puff) => <i key={puff} />)}
          </span>
          <span className="choice-object-label">
            <strong>that fucking other thing</strong>
            <small>Enter the unknown</small>
          </span>
        </a>
      </div>
      <div className="choice-vignette" aria-hidden="true" />

      <div className="home-room-tools" aria-label="Spawn an interactive can">
        <span>DROP A CAN</span>
        <button type="button" onClick={() => spawnHomeCan("YOOHOO")}>YOOHOO</button>
        <button type="button" onClick={() => spawnHomeCan("PEPSI")}>PEPSI</button>
        <button type="button" onClick={() => spawnHomeCan("MONSTER")}>MONSTER</button>
      </div>
      <p className="home-camera-hint">DRAG THE ROOM · MOVE CAMERA</p>

      <a
        className="choice-kicker"
        href="/anubis"
        aria-label="Enter the Anubis television room"
      >
        <span>I&apos;m genuinely skitzofrenic</span>
      </a>

      <Link
        className="guide-orb"
        href="/map"
        aria-label="Open the ship's chart of the whole labyrinth, guided by a friendly alien"
      >
        <span className="guide-orb__face" aria-hidden="true">👽</span>
        <span className="guide-orb__label">ship&apos;s chart</span>
      </Link>

      {showUrf && <section className="home-urf-gate" role="dialog" aria-modal="true" aria-label="Choose a Planet Urf room">
        <button className="home-urf-gate__close" type="button" onClick={() => setShowUrf(false)} aria-label="Close Planet Urf selector">×</button>
        <header><small>PLANET URF TRANSMISSION</small><h2>CHOOSE A ROOM</h2></header>
        <div className="home-urf-gate__doors">
          <a href="/urf-3d"><b>1</b><span><strong>GO ANYWHERE</strong><small>3D GLOBE · ALIEN ARCHER · TERRAIN LAB</small></span></a>
          <a href="/alien-game/index.html"><b>2</b><span><strong>VOID RAID</strong><small>DOOP · ZORF · PLOOZORB</small></span></a>
        </div>
      </section>}
    </main>
  );
}
