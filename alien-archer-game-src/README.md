# grokMADEthis

**PLANET URF** — the whole game, in this folder.

Raid neon mushroom isles as three unique aliens. AK-47 in one hand, revolver in the other, a giant trippy globe hanging in the void.

Made with Grok.

---

## Play it

1. Put this whole folder on your **Desktop** (keep the name `grokMADEthis`).
2. Install [Node.js](https://nodejs.org) if you do not have it (LTS is fine).
3. Double-click:

   - **Windows** → `START.bat`
   - **Mac** → `START.command`  (first time: right-click → Open)
   - **Linux** → `START.sh`

A browser tab opens. Keep the little terminal window running while you play.

Already built? `START` just serves `dist/` and you are in.

From a terminal in this folder:

```bash
node play.mjs
```

or, to hack on it:

```bash
npm install
npm run dev
```

---

## Who you are

| Raider | Vibe | Deal |
|---|---|---|
| **ZIX** | Classic tall green | Extra hide, slower feet |
| **PIP** | Short green, giraffe antennas | Fast, jumpy, hard to hit |
| **VEX** | Medium purple | Ammo magnet, mean with a cylinder |

## Toys

- **Revolver** — 6 in the cylinder, spare bullets on the belt. Click to fire.
- **AK-47** — 30 in the mag, spare magazines. Hold click for full auto.
- Pick up **bullets** and **mags** on the isles.

## Controls

| Key | Action |
|---|---|
| **W A S D** | Move (A/D strafe) |
| **Mouse** / arrows | Look |
| **Click** | Fire |
| **1** | Revolver |
| **2** | AK-47 |
| **R** | Reload |
| **Space** | Jump |
| **Shift** | Sprint |
| **Esc** | Pause |

On a phone: left stick to move, right side to look, on-screen fire / jump / swap.

---

## What's in here

```
grokMADEthis/
  START.bat / START.command / START.sh   ← play
  play.mjs                               ← tiny local server
  dist/                                  ← prebuilt game
  src/game/                              ← aliens, guns, globe, islands
  src/components/GameApp.tsx             ← HUD + character select
  public/land_mask.jpg                   ← the trippy globe continents
  screenshots/                           ← in-game stills
  references/                            ← original alien art + globe ref
```

The distant globe uses the same trippy 2D ocean-void shader sitting on an otherwise 3D planet — the look from triptotropic.com, ported into the raid.

---

Grok made this. 👽🔫🌍
