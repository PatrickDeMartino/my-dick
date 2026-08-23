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
  assert.match(html, /Planet Urf/);
  assert.match(html, /that fucking other thing/);
  assert.match(html, /href="\/bongo"/);
  assert.match(html, /Rat Meat/);
  assert.match(html, /href="https:\/\/www\.cia\.gov\/"/);
  assert.match(html, /patrick_allan_demartino/);
});

test("renders the Dr. Bongo neural-link scene", async () => {
  const response = await request("/bongo");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Dr\. Bongo Neural Link/);
  assert.match(html, /Talk to the ape/);
  assert.match(html, /orangutan-aliens\.jpg/);
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

test("world globe clips coastlines cleanly and supports full rotation", async () => {
  const town = await readFile(new URL("../app/urf/page.tsx", import.meta.url), "utf8");

  assert.match(town, /geoOrthographic/);
  assert.match(town, /\.clipAngle\(90\)/);
  assert.match(town, /lat: wrapAngle/);
  assert.match(town, /roll: wrapAngle/);
  assert.doesNotMatch(town, /Math\.max\(-55, Math\.min\(55/);
});
