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

The V2 level uses hand-built procedural Three.js models for all seven landmarks: ski-biplane, telescope, circus, igloo, sweatshop, cargo boat, and dog-fight boxing ring. The restrained camera lean keeps the readable isometric composition while still making the island feel physical.

Each model is assembled from reusable low-poly geometry inside `PenguinTownScene3D.tsx`, so the project ships without a separate Blender/export pipeline. The `model` field in `TownBuilding` remains reserved for a future external-asset loader.
