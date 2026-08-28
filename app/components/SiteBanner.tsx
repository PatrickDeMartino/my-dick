"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "trip.rat-meat.v1";
const REWARD_EVENT = "trip-rat-meat-earned";
const BALANCE_EVENT = "trip-rat-meat-balance-changed";

function readRatMeat() {
  try {
    const value = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  } catch {
    return 0;
  }
}

export default function SiteBanner() {
  const [amount, setAmount] = useState(0);
  const [visible, setVisible] = useState(true);
  const [earned, setEarned] = useState(false);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const embedded = window.self !== window.top;

    if (embedded) {
      document.documentElement.classList.add("trip-embedded");
      const hideFrame = window.requestAnimationFrame(() => setVisible(false));
      return () => {
        window.cancelAnimationFrame(hideFrame);
        document.documentElement.classList.remove("trip-embedded");
      };
    }

    const syncFrame = window.requestAnimationFrame(() => setAmount(readRatMeat()));

    const onReward = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data) return;

      if (event.data.type === BALANCE_EVENT) {
        setAmount(readRatMeat());
        return;
      }

      if (event.data.type !== REWARD_EVENT) return;

      const reward = Number(event.data.amount);
      if (!Number.isFinite(reward) || reward <= 0) return;

      const next = readRatMeat() + Math.floor(reward);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* Keep the current-page wallet working when storage is unavailable. */
      }
      setAmount(next);
      setEarned(true);
      if (burstTimer.current) clearTimeout(burstTimer.current);
      burstTimer.current = setTimeout(() => setEarned(false), 850);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setAmount(readRatMeat());
    };

    window.addEventListener("message", onReward);
    window.addEventListener("storage", onStorage);

    return () => {
      window.cancelAnimationFrame(syncFrame);
      window.removeEventListener("message", onReward);
      window.removeEventListener("storage", onStorage);
      if (burstTimer.current) clearTimeout(burstTimer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <header className={`trip-banner${earned ? " trip-banner--earned" : ""}`}>
      <div className="trip-banner__inner">
        <div className="trip-banner__currency" aria-label={`${amount} cans of Rat Meat`}>
          <span className="trip-banner__can" aria-hidden="true">
            <img src="/media/rat-meat-can-v2.png" alt="" />
          </span>
          <strong>Rat Meat</strong>
          <span className="trip-banner__amount" aria-live="polite" aria-atomic="true">
            {amount}
          </span>
        </div>

        <nav className="trip-banner__links" aria-label="External links">
          <a href="https://www.cia.gov/" target="_blank" rel="noreferrer" aria-label="CIA website">
            <img className="trip-banner__cia" src="/media/cia-seal.svg" alt="" />
          </a>
          <a
            href="https://www.instagram.com/patrick_allan_demartino/"
            target="_blank"
            rel="noreferrer"
            aria-label="Patrick Allan DeMartino on Instagram"
          >
            <span className="trip-banner__instagram" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
