"use client";

import { useEffect, useState } from "react";

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
      <div
        className="choice-world-stage"
        role="img"
        aria-label="A glowing Earth and a luminous brain floating in darkness"
      >
        <img className="choice-world-layer choice-world-earth" src="/media/brain-earth.jpg" alt="" />
        <img className="choice-world-layer choice-world-brain" src="/media/brain-earth.jpg" alt="" />
      </div>
      <div className="choice-vignette" aria-hidden="true" />

      <p className="choice-kicker">
        <span>I&apos;m genuinely skitzofrenic</span>
      </p>

      <button
        className="choice-portal choice-portal-earth"
        type="button"
        onClick={() => setShowUrf(true)}
        aria-label="Open the Planet Urf territory selector"
        aria-haspopup="dialog"
      >
        <strong>Planet Urf</strong>
        <small>reality phisico</small>
      </button>

      <a
        className="choice-portal choice-portal-brain"
        href="/bongo"
        aria-label="Enter through that fucking other thing"
      >
        <strong>that fucking other thing</strong>
        <small>Enter the unknown</small>
      </a>

      {showUrf && (
        <section className="urf-modal-shell" role="dialog" aria-modal="true" aria-label="Planet Urf territory selector">
          <iframe className="urf-modal-frame" src="/urf" title="Planet Urf territory selector" />
        </section>
      )}
    </main>
  );
}
