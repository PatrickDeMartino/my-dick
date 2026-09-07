"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HomeGlobe from "./components/HomeGlobe";
import HomeRoom3D, { setHomeSpatial, spawnHomeCan } from "./components/HomeRoom3D";

const smokePuffs = Array.from({ length: 7 }, (_, index) => index);
type HomeObject = "globe" | "brain";
type Spatial = { x:number; y:number; z:number; scale:number };
const HOME_DEFAULTS: Record<HomeObject,Spatial> = { globe:{x:0,y:0,z:0,scale:1}, brain:{x:0,y:0,z:0,scale:1} };

export default function LandingPage() {
  const [showUrf, setShowUrf] = useState(false);
  const [homeEditTarget,setHomeEditTarget] = useState<HomeObject>("brain");
  const [homeSpatial,setHomeSpatialState] = useState(HOME_DEFAULTS);

  useEffect(()=>{ setHomeSpatial("brain",homeSpatial.brain); },[homeSpatial.brain]);
  const updateSpatial=(key:keyof Spatial,value:number)=>setHomeSpatialState(current=>({...current,[homeEditTarget]:{...current[homeEditTarget],[key]:value}}));
  const globeTransform=homeSpatial.globe;

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
          style={{ transform:`translate3d(calc(-6.505% + ${globeTransform.x*62+2.9}px),${-globeTransform.y*56}px,0) scale(${globeTransform.scale*(1+globeTransform.z*.12)})` }}
        >
          <span className="choice-object-visual choice-object-visual--globe" aria-hidden="true">
            <HomeGlobe onActivate={() => setShowUrf(true)} />
          </span>
          <span className="choice-smoke" aria-hidden="true">
            {smokePuffs.map((puff) => <i key={puff} />)}
          </span>
          <span className="choice-object-label">
            <strong>Planet Urf</strong>
          </span>
        </button>

        <div
          className="choice-object choice-object-brain"
          data-portal="brain"
          aria-hidden="true"
        >
          <span className="choice-smoke" aria-hidden="true">
            {smokePuffs.map((puff) => <i key={puff} />)}
          </span>
          <span className="choice-object-label">
            <strong>that fucking other thing</strong>
            <small>Enter the unknown</small>
          </span>
        </div>
      </div>
      <div className="choice-vignette" aria-hidden="true" />

      <div className="home-room-tools" aria-label="Spawn an interactive can">
        <button type="button" onClick={() => spawnHomeCan("YOOHOO")}>YOOHOO</button>
        <button type="button" onClick={() => spawnHomeCan("PEPSI")}>PEPSI</button>
        <button type="button" onClick={() => spawnHomeCan("MONSTER")}>MONSTER</button>
        <button type="button" onClick={() => spawnHomeCan("RAT MEAT")}>RAT MEAT</button>
        <button type="button" className="is-pongo" aria-label="Toggle Pongo mode" onClick={() => spawnHomeCan("PONGO")}>PONGO MODE</button>
      </div>
      <aside className="home-cube-menu" aria-label="Home room spatial controls">
        <header><b>⬛ CUBE</b><small>XYZ SPACE</small></header>
        <div className="home-cube-menu__targets">
          {(["brain","globe"] as HomeObject[]).map(target=><button type="button" key={target} className={homeEditTarget===target?"is-active":""} onClick={()=>setHomeEditTarget(target)}>{target.toUpperCase()}</button>)}
        </div>
        {(["x","y","z","scale"] as (keyof Spatial)[]).map(axis=><label key={axis}><span>{axis==="scale"?"SIZE":axis.toUpperCase()}</span><input type="range" min={axis==="scale"?.55:-2.5} max={axis==="scale"?1.8:2.5} step={axis==="scale"?.05:.05} value={homeSpatial[homeEditTarget][axis]} onChange={event=>updateSpatial(axis,Number(event.target.value))}/><b>{homeSpatial[homeEditTarget][axis].toFixed(2)}</b></label>)}
        <button type="button" className="home-cube-menu__reset" onClick={()=>setHomeSpatialState(current=>({...current,[homeEditTarget]:{...HOME_DEFAULTS[homeEditTarget]}}))}>RESET {homeEditTarget.toUpperCase()}</button>
      </aside>
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
          <a href="/alien-game/index.html"><b>2</b><span><strong>VOID RAID</strong><small>DOOP · ZORP · PLOOZORB</small></span></a>
        </div>
      </section>}
    </main>
  );
}
