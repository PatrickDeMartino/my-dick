"use client";
import { SCREENS } from "../lib/screenIds";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type LoaderTheme = { art: string; title: string; accent: string; position?: string };
const THEMES: Record<string, LoaderTheme> = {
  "/": { art: "/media/loading-art.webp", title: "WAKING THE BRAIN WORMS", accent: "#70ffe7", position: "center 38%" },
  "/urf-3d": { art: "/media/psychedelic-earth-texture-v1.png", title: "INFLATING PLANET URF", accent: "#8dff45" },
  "/brain-room": { art: "/brain-room/brain-room-wide.jpg", title: "OPENING THE SKULL DOOR", accent: "#ff7bc8" },
  "/anubis": { art: "/anubis-room/assets/tv-room.jpg", title: "TUNING THE ANUBIS SIGNAL", accent: "#ffd655" },
  "/bongo": { art: "/media/orangutan-aliens.jpg", title: "CALLING DR. BONGO", accent: "#ff8b39" },
  "/penguin-town": { art: "/penguin-town-clean.webp", title: "THAWING PENGUIN TOWN", accent: "#71efff" },
  "/penguin-town-hex": { art: "/penguin-town-ground-v4.png", title: "FOLDING THE HEX GRID", accent: "#75fff0" },
  "/urf": { art: "/media/earth.jpg", title: "SPINNING UP URF", accent: "#8cff62" },
  "/map": { art: "/media/alien-astronomer-v1.png", title: "ASKING THE ALIEN FOR DIRECTIONS", accent: "#c0ff58" },
  "/bb-yoohoo-room": { art: "/media/yoohoo-label.png", title: "SHAKING THE YOO-HOO", accent: "#ffdf81" },
  "/assets-room": { art: "/media/brain-earth.jpg", title: "UNLOCKING THE ASSET VAULT", accent: "#ff79ea" },
  "/alien-archer": { art: "/alien-archer-game/og.jpg", title: "STRINGING THE SPACE BOW", accent: "#f7ff57" },
  "/hextrip": { art: "/hextrip-game/media/psychedelic-earth-texture-v1.jpg", title: "COMPUTING THE HEX TRIP", accent: "#ad66ff" },
  "/urf-3d/editor": { art: "/media/planet-urf-crop.png", title: "CALIBRATING WORLD CONTROLS", accent: "#66ffee" },
  "/admin/logins": { art: "/media/brain-crop.png", title: "CHECKING THE SECRET HANDSHAKE", accent: "#ff75b5" },
};
const MESSAGES = ["the government is always watching", "downloading spyware", "getting my dick sucked by a whore, brb"];

export default function SiteLoading() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const theme = THEMES[pathname] ?? { art: "/media/loading-art.webp", title: "ENTERING THE WEIRD", accent: "#ef77ff" };
  const message = useMemo(() => pathname === "/" ? "sup dood, im pat\nthis is my fucking website\npeep it   shit's Lit" : MESSAGES[Math.floor(Math.random() * MESSAGES.length)], [pathname]);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [failure, setFailure] = useState(false);
  useEffect(() => {
    if (window.self !== window.top) { setVisible(false); return; }
    setVisible(true); setProgress(0); setFailure(false);
    const started = performance.now();
    let assetsReady = false, finishingAt = 0, cancelled = false;
    const image = new Image();
    image.onload = () => image.decode().catch(() => {}).finally(() => { assetsReady = true; });
    image.onerror = () => { assetsReady = true; if (!cancelled) setFailure(true); };
    image.src = theme.art;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const sceneReady = pathname !== "/" || (document.documentElement.dataset.homeReady === "true" && document.documentElement.dataset.monkeyReady === "true");
      if (elapsed < 2700) setProgress(Math.min(69, Math.floor(elapsed / 2700 * 69)));
      else if (!finishingAt) {
        setProgress(69);
        if (assetsReady && sceneReady && elapsed >= 3000) finishingAt = performance.now();
        if (elapsed > 20000 && !sceneReady) setFailure(true);
      } else {
        const finish = (performance.now() - finishingAt) / 520;
        setProgress(Math.min(100, 69 + Math.floor(finish * 31)));
        if (finish >= 1.25) setVisible(false);
      }
    }, 50);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [pathname, theme.art]);
  useEffect(() => {
    if (!visible) return;
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = old; };
  }, [visible]);
  if (!visible) return null;
  return <div className="site-loading" role="dialog" aria-modal="true" aria-label={`Loading ${theme.title}`} style={{"--loader-accent":theme.accent,"--loader-position":theme.position ?? "center"} as CSSProperties}>
    <img className="site-loading__art" src={theme.art} alt="" fetchPriority="high" />
    <div className="site-loading__kaleidoscope" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
    <div className="site-loading__melt" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i}/>)}</div>
    <span className="site-loading__reference" aria-label="Loading screen reference">{SCREENS[pathname] ?? "?"}z</span>
    <div className="site-loading__copy"><small>{theme.title}</small><p>{message}</p>
      <div className="site-loading__track" role="progressbar" aria-label="Preparing the website" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${progress}%`}} /></div>
      <div className="site-loading__status"><span>{failure ? "Some assets are taking longer." : progress === 69 ? "69%. nice. reality is still melting…" : progress === 100 ? "shit’s ready." : "entering the weird…"}</span><b>{progress}%</b></div>
      {failure && <button type="button" onClick={() => setVisible(false)}>Enter with available assets</button>}
    </div>
  </div>;
}
