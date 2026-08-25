"use client";

import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

type PortalId = "earth" | "brain";

const smokePuffs = Array.from({ length: 7 }, (_, index) => index);

export default function LandingPage() {
  const [showUrf, setShowUrf] = useState(false);
  const [activePortal, setActivePortal] = useState<PortalId | null>(null);

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

  const isFirstTouch = (portal: PortalId, event: ReactMouseEvent<HTMLElement>) => {
    const touchLike = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (!touchLike || event.detail === 0 || activePortal === portal) return false;
    event.preventDefault();
    setActivePortal(portal);
    return true;
  };

  return (
    <main className="choice-landing" aria-label="Choose where your journey begins">
      <div className="choice-world-stage" aria-label="Choose between Planet Urf and Dr. Bongo">
        <button
          className={`choice-object choice-object-earth${activePortal === "earth" ? " is-active" : ""}`}
          type="button"
          data-portal="earth"
          aria-label="Planet Urf. On a phone, tap once to reveal it and tap again to enter."
          aria-haspopup="dialog"
          onClick={(event) => {
            if (isFirstTouch("earth", event)) return;
            setShowUrf(true);
          }}
        >
          <span className="choice-object-visual" aria-hidden="true" />
          <span className="choice-smoke" aria-hidden="true">
            {smokePuffs.map((puff) => <i key={puff} />)}
          </span>
          <span className="choice-object-label">
            <strong>Planet Urf</strong>
            <small>reality phisico</small>
          </span>
        </button>

        <a
          className={`choice-object choice-object-brain${activePortal === "brain" ? " is-active" : ""}`}
          href="/bongo"
          data-portal="brain"
          aria-label="That fucking other thing. On a phone, tap once to reveal it and tap again to enter Dr. Bongo."
          onClick={(event) => { isFirstTouch("brain", event); }}
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

      <a
        className="choice-kicker"
        href="/anubis"
        aria-label="Enter the Anubis television room"
      >
        <span>I&apos;m genuinely skitzofrenic</span>
      </a>

      {showUrf && (
        <section className="urf-modal-shell" role="dialog" aria-modal="true" aria-label="Planet Urf territory selector">
          <iframe className="urf-modal-frame" src="/urf" title="Planet Urf territory selector" />
        </section>
      )}
    </main>
  );
}
