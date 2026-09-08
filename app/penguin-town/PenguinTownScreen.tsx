"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PenguinTownScene3D from "./PenguinTownScene3D";
import { JellyButtons } from "./JellyButtons";
import { BuildingPopup } from "./BuildingPopup";
import {
  BUILDING_STORIES,
  CIRCUS_STOCK,
  RAT_MEAT_BALANCE_EVENT,
  RAT_MEAT_STORAGE_KEY,
  TELESCOPE_UPGRADE_STORAGE_KEY,
  buildings,
  createDefaultTownLayout,
  flipperFlappington,
  isValidSavedTownLayout,
  nextRotation,
  placementIssue,
  terrainInventoryInstruction,
  type GridPosition,
  type PlacementPreview,
  type Rotation,
  type TownBuilding,
  type TownDialogSubject,
  type TownLayout,
} from "./townData";

export default function PenguinTownScreen() {
  const router = useRouter();
  const onBack = () => router.push("/");
  const [selectedBuilding, setSelectedBuilding] = useState<TownDialogSubject | null>(null);
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);
  const [placingBuildingId, setPlacingBuildingId] = useState<string | null>(null);
  const [placementPreview, setPlacementPreview] = useState<PlacementPreview | null>(null);
  const [editorMessage, setEditorMessage] = useState<string | null>(null);
  const [townLayout, setTownLayout] = useState<TownLayout>(createDefaultTownLayout);
  const [telescopeUpgraded, setTelescopeUpgraded] = useState(false);
  const [workersFed, setWorkersFed] = useState(false);
  const [rationError, setRationError] = useState(false);
  const [showDogFightGame, setShowDogFightGame] = useState(false);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [farmCooldown, setFarmCooldown] = useState(0);
  const isSweatshop = selectedBuilding?.id === "sweatshop";
  const isDogFighter = selectedBuilding?.id === "arena";
  const isFlipper = selectedBuilding?.id === "flipper";
  const isTelescope = selectedBuilding?.id === "telescope";
  const isCircus = selectedBuilding?.id === "magic";
  const isIgloo = selectedBuilding?.id === "igloo";
  const isDocks = selectedBuilding?.id === "docks";
  const activeBuilding = buildings.find((building) => building.id === activeBuildingId) ?? null;
  const storedBuildings = buildings.filter((building) => townLayout[building.id]?.stored);
  const displayBuildingLabel = (building: TownBuilding) => building.id === "telescope" && telescopeUpgraded ? "METAL TELESCOPE" : building.label;

  // Each resident gets their own painted backdrop behind the dialog portrait —
  // an "oil painting" vibe unique to their story, not just a shared studio flat.
  const DIALOG_THEME: Record<string, string> = {
    plane: "theme-jungle-strip",
    telescope: "theme-cosmic",
    magic: "theme-tropical-tent",
    igloo: "theme-jungle-lab",
    sweatshop: "theme-factory",
    docks: "theme-harbor",
    arena: "theme-back-alley",
    flipper: "theme-beach",
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("trip.penguin-town-layout.v10");
      if (!saved) return;
      const parsed = JSON.parse(saved) as TownLayout;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists client-side, so this can only run post-mount
      if (isValidSavedTownLayout(parsed)) setTownLayout(parsed);
    } catch {
      // Keep the safe default layout if an old local save is malformed.
    }
  }, []);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists client-side
      setTelescopeUpgraded(window.localStorage.getItem(TELESCOPE_UPGRADE_STORAGE_KEY) === "metal");
    } catch {
      // Keep the wooden telescope when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("trip.penguin-town-layout.v10", JSON.stringify(townLayout));
    } catch {
      // The editor still works for this session when storage is unavailable.
    }
  }, [townLayout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists client-side
    try { setPurchases(JSON.parse(window.localStorage.getItem("trip.town-purchases.v1") ?? "[]") as string[]); } catch { /* start empty */ }
  }, []);

  useEffect(() => {
    if (farmCooldown <= 0) return;
    const timer = window.setTimeout(() => setFarmCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [farmCooldown]);

  useEffect(() => {
    const boat = buildings.find((building) => building.id === "docks");
    if (!boat) return;
    const timer = window.setInterval(() => {
      if (placingBuildingId === "docks" || activeBuildingId === "docks" || selectedBuilding?.id === "docks") return;
      setTownLayout((current) => {
        const position = current.docks;
        if (!position || position.stored) return current;
        const directions = [{ column: 1, row: 0 }, { column: 0, row: 1 }, { column: -1, row: 0 }, { column: 0, row: -1 }];
        const start = Math.floor(Date.now() / 10000) % directions.length;
        for (let offset = 0; offset < directions.length; offset += 1) {
          const direction = directions[(start + offset) % directions.length];
          const next = { column: position.column + direction.column, row: position.row + direction.row };
          if (!placementIssue(boat, next, current, position.rotation)) return { ...current, docks: { ...next, stored: false, rotation: position.rotation } };
        }
        return current;
      });
    }, 10000);
    return () => window.clearInterval(timer);
  }, [activeBuildingId, selectedBuilding, placingBuildingId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showDogFightGame) {
        setShowDogFightGame(false);
        return;
      }
      if (selectedBuilding) setSelectedBuilding(null);
      else if (placingBuildingId) {
        setPlacingBuildingId(null);
        setPlacementPreview(null);
        setEditorMessage(null);
      } else setActiveBuildingId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [placingBuildingId, selectedBuilding, showDogFightGame]);

  // Building placement in the 3D scene works in two steps: arm it (from the
  // inventory list, or the "MOVE" button on an already-placed building),
  // then PenguinTownScene3D drives the live preview via these callbacks as
  // the player orbits/taps around the island and reports what happened.
  const startPlacing = (id: string) => {
    const building = buildings.find((candidate) => candidate.id === id);
    const position = townLayout[id] ?? (building ? { ...building.start, stored: false, rotation: 0 as Rotation } : undefined);
    setPlacingBuildingId(id);
    setActiveBuildingId(null);
    if (building && position) {
      const rotation = position.rotation ?? 0;
      setPlacementPreview({ id, column: position.column, row: position.row, rotation, valid: !placementIssue(building, position, townLayout, rotation) });
      setEditorMessage(terrainInventoryInstruction(building.terrain));
    }
  };

  const handleSelectBuilding = (id: string) => {
    if (placingBuildingId) return;
    setActiveBuildingId(id);
  };

  const handlePlacementPreview = (preview: PlacementPreview | null) => {
    setPlacementPreview(preview);
  };

  const handlePlacementMessage = (message: string | null) => {
    setEditorMessage(message);
  };

  const handleRotatePlacement = () => {
    if (!placingBuildingId) return;
    const building = buildings.find((candidate) => candidate.id === placingBuildingId);
    if (!building || !placementPreview) return;
    const rotation = nextRotation(placementPreview.rotation);
    const position = { column: placementPreview.column, row: placementPreview.row };
    setPlacementPreview({ id: placingBuildingId, column: position.column, row: position.row, rotation, valid: !placementIssue(building, position, townLayout, rotation) });
  };

  const handleCommitPlacement = (id: string, position: GridPosition, rotation: Rotation) => {
    setTownLayout((current) => ({ ...current, [id]: { ...position, stored: false, rotation } }));
    setActiveBuildingId(id);
    setPlacingBuildingId(null);
    setPlacementPreview(null);
    setEditorMessage("PLACED ON GRID");
  };

  const visitBuilding = (building: TownBuilding) => {
    setSelectedBuilding(building);
    setActiveBuildingId(null);
    if (building.id === "sweatshop") {
      setWorkersFed(false);
      setRationError(false);
    }
  };

  const feedWorkers = () => {
    try {
      const stored = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10);
      const balance = Number.isFinite(stored) ? Math.max(0, stored) : 0;

      if (balance < 1) {
        setRationError(true);
        return;
      }

      const nextBalance = balance - 1;
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(nextBalance));
      window.top?.postMessage(
        { type: RAT_MEAT_BALANCE_EVENT, balance: nextBalance },
        window.location.origin,
      );
      setWorkersFed(true);
      setRationError(false);
    } catch {
      setRationError(true);
    }
  };

  const upgradeTelescope = () => {
    try {
      const stored = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10);
      const balance = Number.isFinite(stored) ? Math.max(0, stored) : 0;
      if (balance < 69) {
        setEditorMessage(`NEED ${69 - balance} MORE CANS OF RAT MEAT`);
        return;
      }

      const nextBalance = balance - 69;
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(nextBalance));
      window.localStorage.setItem(TELESCOPE_UPGRADE_STORAGE_KEY, "metal");
      window.top?.postMessage(
        { type: RAT_MEAT_BALANCE_EVENT, balance: nextBalance },
        window.location.origin,
      );
      setTelescopeUpgraded(true);
      setEditorMessage("METAL TELESCOPE INSTALLED · 69 CANS SPENT");
    } catch {
      setEditorMessage("UPGRADE STORAGE UNAVAILABLE");
    }
  };

  const spendRatMeat = (item: string, cost: number) => {
    try {
      const balance = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10) || 0;
      if (balance < cost) { setEditorMessage(`NEED ${cost - balance} MORE CANS OF RAT MEAT`); return; }
      const next = balance - cost;
      const nextPurchases = [...new Set([...purchases, item])];
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(next));
      window.localStorage.setItem("trip.town-purchases.v1", JSON.stringify(nextPurchases));
      window.top?.postMessage({ type: RAT_MEAT_BALANCE_EVENT, balance: next }, window.location.origin);
      setPurchases(nextPurchases);
      setEditorMessage(`${item.toUpperCase()} ACQUIRED · ${cost} RAT MEAT SPENT`);
    } catch { setEditorMessage("SHOP STORAGE UNAVAILABLE"); }
  };

  const farmRats = () => {
    if (farmCooldown) return;
    try {
      const balance = Number.parseInt(window.localStorage.getItem(RAT_MEAT_STORAGE_KEY) ?? "0", 10) || 0;
      const next = balance + 3;
      window.localStorage.setItem(RAT_MEAT_STORAGE_KEY, String(next));
      window.top?.postMessage({ type: RAT_MEAT_BALANCE_EVENT, balance: next }, window.location.origin);
      setFarmCooldown(5);
      setEditorMessage("RATS FARMED · +3 RAT MEAT");
    } catch { setEditorMessage("RAT FARM OFFLINE"); }
  };

  const popupOpen = Boolean(activeBuilding && !townLayout[activeBuilding.id]?.stored);

  return (
    <main className="town-screen">
      <div className="town-frame">
        <div className="town-side-art town-side-art-left" aria-hidden="true" />
      <section
        className={`town-map${placingBuildingId ? " is-placing" : ""}`}
        aria-label="Penguin Town base editor"
      >
        <PenguinTownScene3D
          townLayout={townLayout}
          telescopeUpgraded={telescopeUpgraded}
          activeBuildingId={activeBuildingId}
          placingBuildingId={placingBuildingId}
          placementRotation={placementPreview?.rotation ?? 0}
          popupOpen={popupOpen}
          onSelectBuilding={handleSelectBuilding}
          onPlacementPreview={handlePlacementPreview}
          onCommitPlacement={handleCommitPlacement}
          onPlacementMessage={handlePlacementMessage}
        />
        <div className="town-vignette" aria-hidden="true" />
        <header className="town-header" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onBack} aria-label="Return to world map">←</button>
          <div><small>ANTARCTIC COASTAL DISTRICT · DRAG TO LEAN THE CAMERA</small><h1>PENGUIN TOWN <em>V2</em></h1></div>
        </header>

        <aside className="town-district-status" aria-label="Town status" onPointerDown={(event) => event.stopPropagation()}>
          <span><i /> 7 SHADY LANDMARKS</span>
          <span>RAT-MEAT ECONOMY</span>
          <span>NO LAW · NO REFUNDS</span>
        </aside>

        {activeBuilding && !townLayout[activeBuilding.id]?.stored && (
          <div onPointerDown={(event) => event.stopPropagation()}>
            <BuildingPopup
              character={BUILDING_STORIES[activeBuilding.id].character}
              role={BUILDING_STORIES[activeBuilding.id].role}
              name={displayBuildingLabel(activeBuilding)}
              onClose={() => setActiveBuildingId(null)}
              buttons={[
                ...(activeBuilding.id === "telescope" && !telescopeUpgraded
                  ? [{ key: "upgrade", label: "UPGRADE · 69", tone: "gold" as const, onClick: upgradeTelescope }]
                  : []),
                { key: "enter", label: "ENTER", tone: "primary" as const, onClick: () => visitBuilding(activeBuilding) },
                { key: "move", label: "MOVE", onClick: () => startPlacing(activeBuilding.id) },
                {
                  key: "remove",
                  label: "REMOVE",
                  tone: "danger" as const,
                  onClick: () => {
                    setTownLayout((current) => ({ ...current, [activeBuilding.id]: { ...current[activeBuilding.id], stored: true } }));
                    setActiveBuildingId(null);
                    setPlacementPreview(null);
                    setEditorMessage(`${activeBuilding.label} MOVED TO INVENTORY`);
                  },
                },
              ]}
            />
          </div>
        )}

        {(placingBuildingId || editorMessage) && (
          <div className={`placement-hint${activeBuilding ? " with-editor" : ""}${placementPreview && !placementPreview.valid ? " is-error" : ""}`} aria-live="polite">
            {editorMessage ?? "SELECT A BUILDING TO MOVE"}
            {placingBuildingId && (
              <button type="button" className="rotate-placement" onClick={handleRotatePlacement} aria-label="Rotate building 90 degrees" onPointerDown={(event) => event.stopPropagation()}>
                ⟳ ROTATE
              </button>
            )}
          </div>
        )}

        <nav className="town-inventory" aria-label="Building inventory" onPointerDown={(event) => event.stopPropagation()}>
          <div className="inventory-title"><span>BUILD</span><small>{storedBuildings.length ? `${storedBuildings.length} STORED` : "INVENTORY EMPTY"}</small></div>
          <div className="inventory-items">
            <button
              type="button"
              className="inventory-character"
              onClick={() => {
                setSelectedBuilding(flipperFlappington);
                setActiveBuildingId(null);
                setPlacementPreview(null);
              }}
              aria-label="Talk to Flipper Flappington"
            >
              <img src="/evil-penguin.jpg" alt="Flipper Flappington" />
              <span>FLIPPER</span>
            </button>
            {storedBuildings.map((building) => (
              <button
                type="button"
                key={building.id}
                className={placingBuildingId === building.id ? "is-active" : ""}
                onClick={() => startPlacing(building.id)}
                aria-label={`Place ${building.label}`}
              >
                <img className="inventory-thumb" src={telescopeUpgraded && building.upgradeImage ? building.upgradeImage : building.image} alt="" />
                <span>{displayBuildingLabel(building)}</span>
              </button>
            ))}
            {!storedBuildings.length && <p>Select a building, then choose <b>Remove</b> to store it here.</p>}
          </div>
        </nav>
      </section>
        <div className="town-side-art town-side-art-right" aria-hidden="true" />
      </div>

      {selectedBuilding && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedBuilding(null);
        }}>
          <section className={`penguin-dialog${isSweatshop ? " sweatshop-dialog" : ""}${isDogFighter ? " dog-fighter-dialog" : ""}${isFlipper ? " flipper-dialog" : ""}${isTelescope ? " alien-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="dialog-close" type="button" onClick={() => setSelectedBuilding(null)} aria-label="Close dialogue">×</button>
            <div className={`dialog-character ${DIALOG_THEME[selectedBuilding.id] ?? "theme-studio"}`}>
              <span className="bad-tape" aria-hidden="true" />
              <img
                src={selectedBuilding.id === "flipper" ? "/evil-penguin.jpg" : BUILDING_STORIES[selectedBuilding.id]?.character ?? "/evil-penguin.jpg"}
                alt={selectedBuilding.id === "flipper" ? "Flipper Flappington" : BUILDING_STORIES[selectedBuilding.id]?.name ?? "Penguin Town resident"}
              />
              <div className="character-tag">
                <small>{isFlipper ? "TUTORIAL GUIDE" : BUILDING_STORIES[selectedBuilding.id]?.role ?? "LOCAL RESIDENT"}</small>
                <b>{isFlipper ? "FLIPPER FLAPPINGTON" : BUILDING_STORIES[selectedBuilding.id]?.name ?? "PEN-GUIN"}</b>
              </div>
            </div>
            <div className="speech-panel">
              <div className="speech-meta">
                <span>{isSweatshop ? "MANAGEMENT MESSAGE" : isDogFighter ? "FIGHTER MESSAGE" : isFlipper ? "TUTORIAL MESSAGE" : "UNFINISHED LOCATION"}</span>
                <b>{selectedBuilding.label}</b>
              </div>
              {isSweatshop ? (
                <>
                  <h2 id="dialog-title">Shift briefing from hell.</h2>
                  <p>&ldquo;a starving worker is a slow worker. give the bastards one can and get the line moving.&rdquo;</p>
                  <div className="worker-ration">
                    <div className={`rat-meat-can${workersFed ? " rat-meat-can-fed" : ""}`} aria-label="A can of Rat Meat">
                      <small>GENUINE</small>
                      <b>RAT<br />MEAT</b>
                      <span>WORKER RATION</span>
                    </div>
                    <JellyButtons buttons={[{ key: "feed", label: workersFed ? "FED" : "FEED", tone: "primary", disabled: workersFed, onClick: feedWorkers }]} minHeight={100} />
                  </div>
                  <div className="ration-status" role="status" aria-live="polite">
                    {workersFed
                      ? "RATION DISTRIBUTED · PRODUCTIVITY RESTORED"
                      : rationError
                        ? "NOT ENOUGH RAT MEAT · WIN A DOG-FIGHT ROUND"
                        : "1 CAN · SERVES ENTIRE SHIFT"}
                  </div>
                </>
              ) : isDogFighter ? (
                <>
                  <h2 id="dialog-title">Pre-fight wisdom.</h2>
                  <JellyButtons buttons={[{ key: "fight", label: "FIGHT!", tone: "danger", onClick: () => { setSelectedBuilding(null); setShowDogFightGame(true); } }]} minHeight={100} />
                </>
              ) : isFlipper ? (
                <>
                  <h2 id="dialog-title">Flipper Flappington.</h2>
                  <p>&ldquo;Suck my penguin cock&rdquo;</p>
                  <JellyButtons buttons={[{ key: "back", label: "BACK", tone: "primary", onClick: () => setSelectedBuilding(null) }]} minHeight={100} />
                </>
              ) : isTelescope ? (
                <>
                  <h2 id="dialog-title">Deep-space field report.</h2>
                  <p>&ldquo;aliens... for sure. nasty little fuckers, too.&rdquo;</p>
                  {!telescopeUpgraded && <JellyButtons buttons={[{ key: "upgrade", label: "UPGRADE · 69", tone: "gold", onClick: upgradeTelescope }]} minHeight={100} />}
                </>
              ) : isIgloo ? (
                <>
                  <h2 id="dialog-title">Dr. Bongo&apos;s igloo war room.</h2>
                  <p>&ldquo;Three cans and the sky belongs to the apes. Try not to stand under the armed ones.&rdquo;</p>
                  <div className="mini-bongo-ragdoll" aria-hidden="true"><img src="/media/dr-bongo-model-icon-v1.png" alt="" /></div>
                  <JellyButtons buttons={[{ key: "drone", label: purchases.includes("Drone Swarm") ? "OWNED" : "BUY · 3", tone: "gold", disabled: purchases.includes("Drone Swarm"), onClick: () => spendRatMeat("Drone Swarm", 3) }]} minHeight={100} />
                </>
              ) : isCircus ? (
                <>
                  <h2 id="dialog-title">Exotic inventory.</h2>
                  <p className="store-intro">Animals, drones, dangerous bullshit, and one fully autonomous war crime.</p>
                  <div className="circus-store">
                    {CIRCUS_STOCK.map(([item, cost]) => <button type="button" key={item} disabled={purchases.includes(item)} onClick={() => spendRatMeat(item, cost)}><span>{item}</span><b>{purchases.includes(item) ? "OWNED" : `${cost} RM`}</b></button>)}
                  </div>
                </>
              ) : isDocks ? (
                <>
                  <h2 id="dialog-title">Mobile offshore rat farm.</h2>
                  <p>&ldquo;The sea provides. Mostly rats, diesel fumes, and bodies nobody asks about.&rdquo;</p>
                  <div className="rat-farm-card"><img src="/media/lab-rat-v1.png" alt="Laboratory rat" /><span>+3 RAT MEAT</span></div>
                  <JellyButtons buttons={[{ key: "farm", label: farmCooldown ? `${farmCooldown}s` : "FARM +3", tone: "primary", disabled: farmCooldown > 0, onClick: farmRats }]} minHeight={100} />
                </>
              ) : (
                <>
                  <h2 id="dialog-title">Listen, pal.</h2>
                  <p>i haven&apos;t fucking got to this part yet, do you know how hard it is to try and convince ai to make a dog fighting video game</p>
                  <JellyButtons buttons={[{ key: "fair", label: "FAIR ENOUGH", onClick: () => setSelectedBuilding(null) }]} minHeight={100} />
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {showDogFightGame && (
        <section className="dog-game-overlay" role="dialog" aria-modal="true" aria-labelledby="dog-game-title">
          <header className="dog-game-header">
            <div><small>DOG-FIGHT ARENA</small><b id="dog-game-title">K9 KO!</b></div>
            <button type="button" onClick={() => setShowDogFightGame(false)} aria-label="Return to Penguin Town">×</button>
          </header>
          <iframe
            className="dog-game-frame"
            src="/dog-fighting/index.html"
            title="K9 KO dog-fighting mini-game"
            allow="autoplay"
          />
        </section>
      )}
    </main>
  );
}
