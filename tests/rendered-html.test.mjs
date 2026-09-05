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
  assert.match(town, /onClick=\{feedWorkers\}/);
  assert.match(town, /trip-rat-meat-balance-changed/);
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

test("renders the 3D world-select room (Planet Urf archer)", async () => {
  const response = await request("/urf-3d");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Planet Urf \| Triptotropic<\/title>/i);
  assert.match(html, /GO ANYWHERE/i);
  assert.match(html, /ANTARCTICA/);
  // The terrain toolbar and the archer HUD only mount once the WebGL 3D
  // layer boots client-side (world3d state), so they're absent from the
  // server-rendered shell — not something to assert on here.
});

test("landing page's Planet Urf portal opens the 3D world in a modal iframe", async () => {
  const landing = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(landing, /iframe className="urf-modal-frame" src="\/urf-3d"/);
  assert.match(landing, /<HomeGlobe onActivate=/);
});

test("renders the Penguin Town hex board shell", async () => {
  const response = await request("/penguin-town");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Penguin Town<\/title>/i);
  assert.match(html, /RETURN TO THE SPLIT/);
  // ProfileGate is client-only (it reads localStorage in an effect), so its
  // "Who's building?" sign-in copy only exists post-hydration, not in the
  // server-rendered shell — asserting on it here would just test React's
  // loading-state placeholder, not this page.
});

test("hex claims degrade gracefully without a D1 binding", async () => {
  const response = await request("/api/hex?board=penguin-town");
  const payload = await response.json();

  if (response.status === 200) {
    assert.ok(Array.isArray(payload.claims));
  } else {
    assert.equal(response.status, 500);
    assert.match(payload.error, /D1 binding `DB` is unavailable|hex_claims table is unavailable/);
  }
});

test("profile creation degrades gracefully without a D1 binding", async () => {
  const response = await request("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: "test-id", platform: "instagram", handle: "test_user" }),
  });
  const payload = await response.json();

  if (response.status === 201) {
    assert.equal(payload.profile.handle, "test_user");
  } else {
    assert.equal(response.status, 500);
    assert.match(payload.error, /D1 binding `DB` is unavailable|profiles table is unavailable/);
  }
});

test("profile signup rejects periods and link-shaped text in both fields", async () => {
  const response = await request("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: "test-id-2", platform: "instagram", handle: "evil.com" }),
  });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.error, /no periods/);

  const displayNameResponse = await request("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: "test-id-3",
      platform: "instagram",
      handle: "clean_handle",
      displayName: "click http://evil.com now",
    }),
  });
  assert.equal(displayNameResponse.status, 400);
  const displayNamePayload = await displayNameResponse.json();
  assert.match(displayNamePayload.error, /no periods/);
});

test("ship's chart links to every real room", async () => {
  const response = await request("/map");
  assert.equal(response.status, 200);

  const html = await response.text();
  for (const href of ["/urf-3d", "/urf", "/penguin-town", "/bb-yoohoo-room", "/brain-room", "/bongo", "/anubis"]) {
    assert.match(html, new RegExp(`href="${href.replace(/\//g, "\/")}"`));
  }
});

test("landing page links to the ship's chart", async () => {
  const response = await request("/");
  const html = await response.text();
  assert.match(html, /href="\/map"/);
});

test("admin logins page refuses access without the right key", async () => {
  const response = await request("/admin/logins");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Wrong or missing key|ADMIN_KEY isn.t set/);
});
