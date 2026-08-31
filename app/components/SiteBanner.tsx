"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "trip.rat-meat.v1";
const BANANA_STORAGE_KEY = "trip.bananas.v1";
const WALLET_SEED_KEY = "trip.wallet.seed.v2";
const REWARD_EVENT = "trip-rat-meat-earned";
const BALANCE_EVENT = "trip-rat-meat-balance-changed";
const BONGO_ACTION_EVENT = "trip-bongo-action";

function readRatMeat() {
  try {
    const value = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  } catch {
    return 0;
  }
}

export default function SiteBanner() {
  const pathname = usePathname();
  const isBongo = pathname.startsWith("/bongo");
  const [amount, setAmount] = useState(69);
  const [bananas, setBananas] = useState(69);
  const [visible, setVisible] = useState(true);
  const [earned, setEarned] = useState(false);
  const [bongoMenuOpen, setBongoMenuOpen] = useState(false);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bongoMenuRef = useRef<HTMLDivElement>(null);

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

    try {
      if (!window.localStorage.getItem(WALLET_SEED_KEY)) {
        window.localStorage.setItem(STORAGE_KEY, "69");
        window.localStorage.setItem(BANANA_STORAGE_KEY, "69");
        window.localStorage.setItem(WALLET_SEED_KEY, "seeded");
      }
    } catch {
      /* The visible session defaults still work when storage is unavailable. */
    }
    const syncFrame = window.requestAnimationFrame(() => {
      setAmount(readRatMeat());
      const storedBananas = Number.parseInt(window.localStorage.getItem(BANANA_STORAGE_KEY) ?? "69", 10);
      setBananas(Number.isFinite(storedBananas) ? Math.max(0, storedBananas) : 69);
    });

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

  useEffect(() => {
    if (!isBongo) {
      const closeFrame = window.requestAnimationFrame(() => setBongoMenuOpen(false));
      return () => window.cancelAnimationFrame(closeFrame);
    }

    const closeMenu = (event: PointerEvent) => {
      if (!bongoMenuRef.current?.contains(event.target as Node)) setBongoMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBongoMenuOpen(false);
    };
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeWithEscape);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [isBongo]);

  const interactWithBongo = (action: "feed" | "beat") => {
    window.dispatchEvent(new CustomEvent(BONGO_ACTION_EVENT, { detail: { action } }));
  };

  if (!visible) return null;

  return (
    <header className={`trip-banner${earned ? " trip-banner--earned" : ""}${isBongo ? " trip-banner--bongo" : ""}`}>
      <div className="trip-banner__inner">
        <div className="trip-banner__wallet">
        <div className="trip-banner__currency" aria-label={`${amount} cans of Rat Meat`}>
          <span className="trip-banner__can" aria-hidden="true">
            <img src="/media/rat-meat-can-v2.png" alt="" />
          </span>
          <strong>Rat Meat</strong>
          <span className="trip-banner__amount" aria-live="polite" aria-atomic="true">
            {amount}
          </span>
        </div>
        <div className="trip-banner__stat trip-banner__bananas" aria-label={`${bananas} bananas`}>
          <span aria-hidden="true">🍌</span><strong>Bananas</strong><b>{bananas}</b>
        </div>
        <div className="trip-banner__stat trip-banner__oil" aria-label="An unquenchable thirst for oil">
          <span aria-hidden="true">🛢️</span><strong>Oil thirst</strong><b>∞</b>
        </div>
        </div>

        {isBongo && (
          <div className="trip-bongo-menu" ref={bongoMenuRef}>
            <button
              className="trip-bongo-menu__trigger"
              type="button"
              aria-label="Open Dr. Bongo interaction menu"
              aria-expanded={bongoMenuOpen}
              aria-haspopup="menu"
              onClick={() => setBongoMenuOpen((open) => !open)}
            >
              <span className="trip-bongo-menu__portrait" aria-hidden="true">
                <img className="trip-bongo-avatar" src="/media/dr-bongo-model-icon-v1.png" alt="" />
              </span>
              <span>Dr. Bongo</span>
              <i aria-hidden="true">⌄</i>
            </button>
            {bongoMenuOpen && (
              <div className="trip-bongo-menu__dropdown" role="menu" aria-label="Interact with Dr. Bongo">
                <button type="button" role="menuitem" onClick={() => interactWithBongo("feed")}>
                  <span className="trip-bongo-action__image trip-bongo-action__banana" aria-hidden="true">
                    <img src="/media/bongo-banana-cutout-v1.png" alt="" />
                  </span>
                  <span><strong>Feed</strong><small>Banana makes him grow</small></span>
                </button>
                <button type="button" role="menuitem" onClick={() => interactWithBongo("beat")}>
                  <span className="trip-bongo-action__image trip-bongo-action__bat" aria-hidden="true">
                    <img src="/media/bongo-bat-cutout-v1.png" alt="" />
                  </span>
                  <span><strong>Beat</strong><small>Baseball bat makes him shrink</small></span>
                </button>
              </div>
            )}
          </div>
        )}

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
