# Planet Urf

V1 of an interactive click-through adventure site.

The landing page presents two animated paths:

- **Planet Urf** — the physical-world branch of the future maze.
- **The unknown** — a working neural-link chat with Dr. Bongo, an orangutan whose brain was upgraded by aliens.

Dr. Bongo uses the OpenAI Responses API when `OPENAI_API_KEY` is available. Without a key, the character remains fully interactive through an included local personality engine.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal. The Dr. Bongo scene is also available directly at `/bongo`.

## Production checks

```bash
npm run build
npm test
```

To enable AI-generated replies, copy `.env.example` to `.env.local` and provide a server-side OpenAI API key. Never commit the key.

## Stack

- React 19
- vinext
- Vite
- Cloudflare Workers

## Penguin Town (`/urf`, Antarctica)

Penguin Town is a real 3D scene (`app/urf/PenguinTownScene3D.tsx`, vanilla Three.js — same pattern as the Dr. Bongo widget) built on top of the existing grid/currency/dialog logic in `app/urf/page.tsx`. The terrain and the building-placement rules both read from `app/urf/townData.ts`, so what you see always matches where buildings are allowed to go.

Buildings currently render as colored placeholder blocks. To swap one for a real model:

1. Model it in Blender at roughly real-world scale, with the object's origin at the base center (so it sits on the ground correctly) and the model facing +Y forward.
2. `File → Export → glTF 2.0`, format **glTF Binary (.glb)**, and check **+Y Up** in the export options.
3. Drop the file in `public/buildings/models/<building-id>.glb` (ids: `plane`, `telescope`, `magic`, `igloo`, `sweatshop`, `docks`, `arena`).
4. In `app/urf/townData.ts`, add `model: "/buildings/models/<building-id>.glb"` to that building's entry in the `buildings` array.

The scene loads it with `GLTFLoader`, auto-scales it to fit the building's footprint, and drops the placeholder block — no other code changes needed.
