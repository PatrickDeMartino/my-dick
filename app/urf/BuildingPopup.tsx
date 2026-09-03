"use client";

import { createPortal } from "react-dom";
import { JellyButtons, type JellyButtonSpec } from "./JellyButtons";

type Props = {
  character: string;
  role: string;
  name: string;
  buttons: JellyButtonSpec[];
  onClose: () => void;
};

/**
 * The building-interaction popup: a round window onto a slowly-flowing
 * painted sunset (built from layered, independently-animated gradients +
 * the same psychedelic ocean texture the world-select globe uses), with the
 * building's resident standing in front of it and a couple of jelly
 * ENTER/MOVE/etc. buttons drifting and bouncing off the circular wall.
 * A small "×" badge sits half outside the rim, top-right, to close it.
 */
export function BuildingPopup({ character, role, name, buttons, onClose }: Props) {
  const popup = (
    <aside className="building-popup" aria-label={`${name} controls`}>
      <button type="button" className="building-popup-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <div className="building-popup-circle">
        <div className="building-popup-sunset" aria-hidden="true">
          <span className="building-popup-sunset-sun" />
          <span className="building-popup-sunset-swirl" />
          <span className="building-popup-sunset-swirl building-popup-sunset-swirl-2" />
        </div>
        <div className="building-popup-portrait">
          <img src={character} alt="" />
        </div>
        <div className="building-popup-tag">
          <small>{role}</small>
          <b>{name}</b>
        </div>
        <JellyButtons shape="circle" minHeight={220} buttons={buttons} />
      </div>
    </aside>
  );
  // Rendered into <body> rather than in place: it's `position: fixed` against
  // the viewport (bottom-right on mobile, docked in the side panel on
  // desktop), and on desktop that fixed position falls outside `.town-map`'s
  // own (narrower, overflow:hidden) box — staying in-tree there would just
  // get clipped away instead of showing beside the phone-framed island.
  return typeof document !== "undefined" ? createPortal(popup, document.body) : null;
}
