import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function request(path, init) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the Planet Urf landing page", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Planet Urf<\/title>/i);
  assert.match(html, /I(?:&#x27;|')m genuinely skitzofrenic/i);
  assert.match(html, /href="\/anubis"/i);
  assert.match(html, /Planet Urf/);
  assert.match(html, /that fucking other thing/);
  assert.match(html, /href="\/brain-room"/);
  assert.match(html, /Rat Meat/);
  assert.match(html, /href="https:\/\/www\.cia\.gov\/"/);
  assert.match(html, /patrick_allan_demartino/);
});

test("mobile landing choices are active and open with one tap", async () => {
  const landing = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.doesNotMatch(landing, /isFirstTouch/);
  assert.match(landing, /onClick=\{\(\) => setShowUrf\(true\)\}/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.choice-object \.choice-smoke \{ opacity: \.76;/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.choice-object \.choice-object-label \{ opacity: 1;/);
});

test("renders the Dr. Bongo neural-link scene", async () => {
  const response = await request("/bongo");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Dr\. Bongo Neural Link/);
  assert.match(html, /Talk to the ape/);
  assert.match(html, /orangutan-aliens\.jpg/);
  assert.match(html, /Fuck this Noise/);
});

test("links to the Penguin Town hex district from the landing page", async () => {
  const response = await request("/");
  const html = await response.text();
  assert.match(html, /href="\/penguin-town"/);
});

test("renders the Penguin Town hex board shell", async () => {
  const response = await request("/penguin-town");
  assert.equal(response.status, 200);
  const html = await response.text();
  const gate = await readFile(new URL("../app/penguin-town/TownGate.tsx", import.meta.url), "utf8");
  assert.match(html, /<title>Penguin Town<\/title>/i);
  assert.match(gate, /Who(?:&#x27;|')s building\?/);
  assert.match(gate, /Instagram/);
});

test("hex claims and profiles degrade gracefully without D1", async () => {
  const hexResponse = await request("/api/hex?board=penguin-town");
  const hexPayload = await hexResponse.json();
  assert.ok(hexResponse.status === 200 ? Array.isArray(hexPayload.claims) : /hex_claims table is unavailable/.test(hexPayload.error));

  const profileResponse = await request("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: "test-id", platform: "instagram", handle: "test.user" }),
  });
  const profilePayload = await profileResponse.json();
  assert.ok(profileResponse.status === 201 ? profilePayload.profile.handle === "test.user" : /profiles table is unavailable/.test(profilePayload.error));
});

test("Dr. Bongo has full-screen Feed and Beat interactions", async () => {
  const widget = await readFile(new URL("../app/bongo/OrangutanWidget.tsx", import.meta.url), "utf8");
  const banner = await readFile(new URL("../app/components/SiteBanner.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(widget, /className="orangutan-playfield"/);
  assert.match(widget, /new THREE\.WebGLRenderer/);
  assert.match(widget, /spawnBananaRef\.current = spawnBanana/);
  assert.match(widget, /beatBongoRef\.current = swingBat/);
  assert.match(widget, /chewTimer/);
  assert.match(widget, /targetScale \+ 0\.05/);
  assert.match(widget, /targetScale - 0\.05/);
  assert.match(widget, /PROPERTY OF/);
  assert.match(widget, /THE CIA/);
  assert.match(widget, /triggerBloodSpatter\(\)/);
  assert.match(widget, /textureLoader\.load\("\/media\/bongo-banana-cutout-v1\.png"\)/);
  assert.match(widget, /textureLoader\.load\("\/media\/bongo-bat-cutout-v1\.png"\)/);
  assert.match(banner, /interactWithBongo\("feed"\)/);
  assert.match(banner, /interactWithBongo\("beat"\)/);
  assert.match(banner, /dr-bongo-model-icon-v1\.png/);
  assert.match(banner, /bongo-banana-cutout-v1\.png/);
  assert.match(banner, /bongo-bat-cutout-v1\.png/);
  const actionHandler = banner.match(/const interactWithBongo[\s\S]*?\n {2}};/)?.[0] ?? "";
  assert.doesNotMatch(actionHandler, /setBongoMenuOpen\(false\)/);
  assert.match(styles, /bongo-blood-flash \.5s/);
});

test("chat remains interactive without an API key", async () => {
  const response = await request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Do you like dogs?" }],
    }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.source, "local");
  assert.match(payload.reply, /Dogs/);
});

test("dog-fight round wins award one can of Rat Meat", async () => {
  const bridge = await readFile(new URL("../public/dog-fighting/rat-meat-bridge.js", import.meta.url), "utf8");
  const gameHtml = await readFile(new URL("../public/dog-fighting/index.html", import.meta.url), "utf8");

  assert.match(gameHtml, /rat-meat-bridge\.js/);
  assert.match(bridge, /TAKES THE ROUND/);
  assert.match(bridge, /type: "trip-rat-meat-earned"/);
  assert.match(bridge, /amount: 1/);

  const messages = [];
  const paragraphs = [
    { textContent: "PUG", className: "font-display tracking-wide" },
    { textContent: "PIT BULL", className: "font-display tracking-wide" },
    { textContent: "PUG TAKES THE ROUND", className: "font-display text-3xl" },
  ];
  const sandbox = {
    document: {
      body: {},
      readyState: "complete",
      querySelectorAll: () => paragraphs,
    },
    MutationObserver: class {
      observe() {}
    },
    window: {
      location: { origin: "https://triptotropic.com" },
      top: { postMessage: (...args) => messages.push(args) },
    },
  };

  vm.runInNewContext(bridge, sandbox);
  assert.equal(messages.length, 1);
  assert.equal(messages[0][0].type, "trip-rat-meat-earned");
  assert.equal(messages[0][0].amount, 1);
  assert.equal(messages[0][1], "https://triptotropic.com");
});

test("feeding the sweatshop workers spends one can of Rat Meat", async () => {
  const town = await readFile(new URL("../app/urf/page.tsx", import.meta.url), "utf8");
  const banner = await readFile(new URL("../app/components/SiteBanner.tsx", import.meta.url), "utf8");

  assert.match(town, /const nextBalance = balance - 1/);
  assert.match(town, /onClick:\s*feedWorkers/);
  assert.match(town, /RAT_MEAT_BALANCE_EVENT/);
  assert.match(town, /NOT ENOUGH RAT MEAT/);
  assert.match(banner, /trip-rat-meat-balance-changed/);
});

test("renders the responsive Brain Room experiment selector", async () => {
  const response = await request("/brain-room");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Choose a test subject/i);
  assert.match(html, /brain-room-mobile\.jpg/);
  assert.match(html, /LAB RAT/);
  assert.match(html, /href="\/bongo"/);
});

test("renders the Anubis pigeon television room", async () => {
  const response = await request("/anubis");
  assert.equal(response.status, 200);

  const html = await response.text();
  const room = await readFile(new URL("../public/anubis-room/index.html", import.meta.url), "utf8");
  const roomScript = await readFile(new URL("../public/anubis-room/script.js", import.meta.url), "utf8");

  assert.match(html, /Anubis TV Room/);
  assert.match(html, /\/anubis-room\/index\.html/);
  assert.match(room, /cybernetic pigeon/i);
  assert.match(room, /youtube\.com\/iframe_api/);
  assert.match(roomScript, /shorts-player/);
});

test("world globe clips coastlines cleanly and supports full rotation", async () => {
  const town = await readFile(new URL("../app/urf/page.tsx", import.meta.url), "utf8");

  assert.match(town, /geoOrthographic/);
  assert.match(town, /\.clipAngle\(90\)/);
  assert.match(town, /lat: wrapAngle/);
  assert.match(town, /roll: wrapAngle/);
  assert.doesNotMatch(town, /Math\.max\(-55, Math\.min\(55/);
});

test("renders the Map Room chart with a link to every room", async () => {
  const response = await request("/map");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Chart of the Labyrinth/);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/urf"/);
  assert.match(html, /href="\/brain-room"/);
  assert.match(html, /href="\/bongo"/);
  assert.match(html, /href="\/anubis"/);
});

test("scene warp overlay is wired into the root layout and the landing page's room links", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const landing = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const warp = await readFile(new URL("../app/components/SceneWarp.tsx", import.meta.url), "utf8");
  const lib = await readFile(new URL("../app/lib/sceneWarp.ts", import.meta.url), "utf8");

  assert.match(layout, /<SceneWarp \/>/);
  assert.match(warp, /SCENE_WARP_EVENT/);
  assert.match(lib, /export function triggerSceneWarp/);
  assert.match(landing, /import \{ triggerSceneWarp \} from "\.\/lib\/sceneWarp"/);
  assert.match(landing, /warpTo\(event, "\/brain-room"\)/);
  assert.match(landing, /warpTo\(event, "\/anubis"\)/);
  assert.match(landing, /warpTo\(event, "\/map"\)/);
});

test("the world globe keeps its flat psychedelic ocean and gains a 3D land layer", async () => {
  const globe = await readFile(new URL("../app/urf/page.tsx", import.meta.url), "utf8");
  const world = await readFile(new URL("../app/urf/globe3d.ts", import.meta.url), "utf8");

  // The 2D ocean painting is untouched and still drives the drifting texture.
  assert.match(globe, /psychedelic-earth-texture-v1\.png/);
  assert.match(globe, /createPattern\(texture, "repeat"\)/);
  // The flat land fill is only skipped while the 3D layer is actually live, so
  // a browser without WebGL still renders exactly the globe it always did.
  assert.match(globe, /if \(!world3d\) \{\s*\n\s*drawLand\(false\);\s*\n\s*drawLand\(true\);/);
  assert.match(globe, /className="globe-webgl"/);

  // The 3D layer draws land, never ocean.
  assert.match(world, /buildLandGeometry/);
  assert.match(world, /colorWrite: false/);
  assert.doesNotMatch(world, /oceanMesh|drawOcean/);
  // And it shares the 2D projection so markers stay lined up.
  assert.match(world, /0\.5 \/ \(0\.43 \* zoom\)/);
});

test("the alien archer replaces the dart throw as the territory selector", async () => {
  const globe = await readFile(new URL("../app/urf/page.tsx", import.meta.url), "utf8");
  const world = await readFile(new URL("../app/urf/globe3d.ts", import.meta.url), "utf8");

  // A real character with movement, a bow and arrow physics.
  assert.match(world, /function buildAlien/);
  assert.match(world, /KeyW|ArrowUp/);
  assert.match(world, /setMove:/);
  assert.match(world, /GRAVITY \* step/);
  assert.match(world, /AIR_DRAG \* step/);
  assert.match(world, /PHYSICS_STEP/);

  // Hits are read back as a territory, and Antarctica still opens Penguin Town.
  assert.match(world, /territoryAt/);
  assert.match(globe, /setSelector\(\{/);
  assert.match(globe, /className="territory-selector"/);
  assert.match(globe, /className="territory-selector__close"/);
  assert.match(globe, /onEnterRef\.current\(\)/);
  assert.match(globe, /className="archer-fire"/);
  assert.match(globe, /className="archer-stick"/);
});

test("the lab rat is a real 3D ragdoll, not a flat sprite", async () => {
  const room = await readFile(new URL("../app/brain-room/page.tsx", import.meta.url), "utf8");
  const rat = await readFile(new URL("../app/brain-room/LabRatWidget.tsx", import.meta.url), "utf8");

  // The brain room mounts the 3D widget where the CSS-dragged image used to be.
  assert.match(room, /import LabRatWidget from "\.\/LabRatWidget"/);
  assert.match(room, /className="brain-room__rat3d"/);
  assert.doesNotMatch(room, /className=\{`brain-room__rat\$\{/);

  // Built like Bongo: real geometry, real physics, grab and throw.
  assert.match(rat, /from "three"/);
  assert.match(rat, /flatShading: true/);
  assert.match(rat, /GRAVITY \* delta/);
  assert.match(rat, /MAX_THROW_SPEED/);
  assert.match(rat, /raycaster\.intersectObjects\(grabbable/);
  // Articulated: a springy tail chain plus legs and ears that lag the body.
  assert.match(rat, /TAIL_LINKS/);
  assert.match(rat, /function settle\(joint/);
});

test("the banner cans and collectible icons are backed by real 3D props", async () => {
  const props = await readFile(new URL("../app/lib/props3d.ts", import.meta.url), "utf8");
  const view = await readFile(new URL("../app/components/Prop3D.tsx", import.meta.url), "utf8");
  const banner = await readFile(new URL("../app/components/SiteBanner.tsx", import.meta.url), "utf8");

  // Every collectible on the banner has a model, plus the gold tin and Yoo-hoo.
  ["rat-meat", "rat-meat-gold", "yoohoo", "banana", "oil-drum", "penguin"].forEach((name) => {
    assert.match(props, new RegExp(`"${name}"`));
  });
  assert.match(props, /flatShading: true/);

  // The upgrade is progressive: the old icon is the fallback child, and it is
  // only replaced once a model is actually rendering.
  assert.match(view, /\{!live && children\}/);
  assert.match(view, /prefers-reduced-motion/);

  // The banner keeps both product marks wrapped by actual rotating can geometry.
  assert.match(banner, /<Can3D size=\{44\}/);
  assert.match(banner, /variant="yoohoo"/);
  assert.match(banner, /trip-banner__yoohoo/);
});
