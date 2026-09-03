"use client";

import { createPortal } from "react-dom";
import type { PointerEvent as ReactPointerEvent } from "react";
import { JellyButtons, type JellyButtonSpec } from "./JellyButtons";

type Props = {
  character: string;
  role: string;
  name: string;
  buttons: JellyButtonSpec[];
  onClose: () => void;
  rotationDegrees?: number;
  onRotationChange?: (degrees: number) => void;
};

/**
 * The building-interaction popup: a round window onto a slowly-flowing
 * painted sunset (built from layered, independently-animated gradients +
 * the same psychedelic ocean texture the world-select globe uses), with the
 * building's resident standing in front of it and a couple of jelly
 * ENTER/MOVE/etc. buttons drifting and bouncing off the circular wall.
 * A small "×" badge sits half outside the rim, top-right, to close it.
 */
export function BuildingPopup({ character, role, name, buttons, onClose, rotationDegrees = 0, onRotationChange }: Props) {
  const updateRotation = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!onRotationChange) return;
    const ring = event.currentTarget.parentElement;
    if (!ring) return;
    const rect = ring.getBoundingClientRect();
    const angle = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
    onRotationChange(Math.round(((angle * 180 / Math.PI) + 90 + 360) % 360));
  };
  const radians = (rotationDegrees - 90) * Math.PI / 180;
  const popup = (
    <aside className="building-popup" aria-label={`${name} controls`}>
      <button type="button" className="building-popup-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      {onRotationChange && <div className="building-popup-rotation-ring" aria-hidden="false"><button type="button" role="slider" aria-label={`Rotate ${name} on the map`} aria-valuemin={0} aria-valuemax={359} aria-valuenow={rotationDegrees} className="building-popup-rotation-knob" style={{left:`${50+50*Math.cos(radians)}%`,top:`${50+50*Math.sin(radians)}%`}} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);updateRotation(event);}} onPointerMove={(event)=>{if(event.currentTarget.hasPointerCapture(event.pointerId))updateRotation(event);}} onKeyDown={(event)=>{if(event.key==="ArrowLeft"||event.key==="ArrowDown"){event.preventDefault();onRotationChange((rotationDegrees+355)%360);}if(event.key==="ArrowRight"||event.key==="ArrowUp"){event.preventDefault();onRotationChange((rotationDegrees+5)%360);}}}><span aria-hidden="true">↻</span></button></div>}
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
        {character.includes("rat-photo-hires") && <a className="building-popup-credit" href="https://www.viva.fct.unl.pt/mamiferos/rattus-norvegicus" target="_blank" rel="noreferrer">PHOTO · J-J BOUJOT · CC BY-SA</a>}
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
