# Triptotropic NEWo69

Open **docs/START HERE.html** for the plain-language map, controls, offline app instructions, book editions, and known limits.

## The important places

- `app/world/`: shared model factories, physics, catalog UI, reader and frame adapters.
- `app/lib/assetRegistry.ts`: stable asset IDs. Scene saves depend on these IDs.
- `app/brain-room/`: Brain World, Bongo's lab, animals, organs and crystal graveyard.
- `app/urf-3d/`: the alien archer globe and terrain editor.
- `app/components/HomeRoom3D.tsx`: the home world.
- `app/penguin-town/`: Penguin Town.
- `public/`: models, textures, complete local books and playable archived games.
- `alien-archer-game-src/`: editable alien game with shared-world adapter.
- `games/alien-archer/`: preserved earlier alien-game source; not the live build.
- `desktop/`: standalone Windows app and local database server.
- `docs/catalog/`: searchable asset catalog, file hashes, duplicate report and model-builder index.
- `docs/archive/`: preserved earlier implementations and one-time migration scripts; do not run these on the current build.
- `tests/`: model, physics, terrain and rendered-page checks.

## Build and test

Use Node 24 or later. Install from the existing lockfile, then `npm run dev` or `npm run build`. The offline delivery includes Node and dependency files; use its Tools folder instead of installing anything.

Shared-world checks: `node tests/compile-world.mjs`, then `node --test tests/unified-world.test.mjs`. Model inventory: `node tests/check-catalog.mjs`. Refresh the file catalog after compiling with `node scripts/catalog-files.mjs`.

Cloud publishing uses the existing Sites project in `.openai/hosting.json`. Never publish the enclosing Pongo desktop project as this site. The offline app uses `desktop/server.mjs` and its own SQLite database instead of Cloudflare D1.

## Physics contract for the future hex editor

Scene JSON uses format `triptotropic-world`, version 1. Each object stores `assetId`, `role`, `scale`, `position: [x,y,z]` and `rotation: [x,y,z]` in radians. The scene also stores gravity, friction and bounce. Models are constructed by `buildAsset`; simulation uses a fixed 1/60-second step. Positive Y is up. Default gravity is 9.81. Keep IDs stable when adding variants.

The main scenes share WorldSimulation. Existing environment actors keep their specialized rigs and interactions. The archived HexTrip game retains Rapier for its native actors, receives the same gravity setting, and exposes its original model builders through the shared asset catalog. It is not yet the future merged hex world editor.
