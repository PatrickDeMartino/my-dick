"use client";

import { useEffect, useState } from "react";
import HomeGlobe from "./components/HomeGlobe";

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
          href="/bongo"
          data-portal="brain"
          aria-label="Enter through that fucking other thing"
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

      <p className="choice-kicker">
        <span>I&apos;m genuinely skitzofrenic</span>
      </p>

      <a className="choice-preview-link" href="/penguin-town" aria-label="Preview Penguin Town">
        🐧 Penguin Town (preview)
      </a>

      {showUrf && (
        <section className="urf-modal-shell" role="dialog" aria-modal="true" aria-label="Planet Urf territory selector">
          <iframe className="urf-modal-frame" src="/urf" title="Planet Urf territory selector" />
        </section>
      )}
    </main>
  );
}
