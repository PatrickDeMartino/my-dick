"use client";
import { SCREENS } from "../lib/screenIds";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function SiteLoading() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [failure, setFailure] = useState(false);
  useEffect(() => {
    if (window.self !== window.top) { setVisible(false); return; }
    const started = performance.now();
    let assetsReady = false, finishingAt = 0, cancelled = false;
    const home = location.pathname === '/';
    const preload = (src: string) => new Promise<void>((resolve, reject) => {
      const image = new Image(); image.onload = () => image.decode().then(resolve, reject); image.onerror = reject; image.src = src;
    });
    Promise.all([preload('/media/loading-art.webp'), ...(home ? [preload('/media/psychedelic-earth-texture-v1.png')] : [])])
      .then(() => { assetsReady = true; }).catch(() => { assetsReady = true; if (!cancelled) setFailure(true); });
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const sceneReady = !home || (document.documentElement.dataset.homeReady === 'true' && document.documentElement.dataset.monkeyReady === 'true');
      if (elapsed < 2600) setProgress(Math.min(69, Math.floor(elapsed / 2600 * 69)));
      else if (!finishingAt) {
        setProgress(69);
        if (assetsReady && sceneReady && elapsed >= 3000) finishingAt = performance.now();
        if (elapsed > 20000 && !sceneReady) setFailure(true);
      } else {
        const finishing = (performance.now() - finishingAt) / 450;
        setProgress(Math.min(100, 69 + Math.floor(finishing * 31)));
        if (finishing >= 1.4) setVisible(false);
      }
    }, 50);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!visible) return;
    const old = document.body.style.overflow;
    const siblings = [...document.body.children].filter((node): node is HTMLElement => node instanceof HTMLElement && !node.classList.contains('site-loading') && node.tagName !== 'SCRIPT');
    const inertBefore = siblings.map(node => node.inert);
    siblings.forEach(node => { node.inert = true; });
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; siblings.forEach((node,index) => { node.inert = inertBefore[index]; }); };
  }, [visible]);
  if (!visible) return null;
  return <div className="site-loading" role="dialog" aria-modal="true" aria-label="Welcome to Triptotropic">
    <span className="site-loading__reference" aria-label="Loading screen reference">{SCREENS[pathname] ?? "?"}z</span>
    <img className="site-loading__art" src="/media/loading-art.webp" alt="Pongo tossing Yoo-hoo cans beside a psychedelic globe and a brain full of smiling worms" fetchPriority="high" />
    <div className="site-loading__copy">
      <p>sup dood, im pat<br />this is my fucking website<br />peep it&nbsp; shit&apos;s Lit</p>
      <div className="site-loading__track" role="progressbar" aria-label="Preparing the website" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${progress}%`}} /></div>
      <div className="site-loading__status"><span>{failure ? 'Some assets are taking longer.' : progress === 69 ? '69%. nice. waking up the worms…' : progress === 100 ? 'shit’s ready.' : 'entering the weird…'}</span><b>{progress}%</b></div>
      {failure && <button type="button" onClick={() => setVisible(false)}>Enter with available assets</button>}
    </div>
  </div>;
}
