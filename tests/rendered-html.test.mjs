import assert from "node:assert/strict";
import test from "node:test";

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
});

test("renders the Dr. Bongo neural-link scene", async () => {
  const response = await request("/bongo");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Dr\. Bongo Neural Link/);
  assert.match(html, /Talk to the ape/);
  assert.match(html, /orangutan-aliens\.jpg/);
});

test("links to the Penguin Town preview from the landing page", async () => {
  const response = await request("/");
  const html = await response.text();
  assert.match(html, /href="\/penguin-town"/);
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
    body: JSON.stringify({ id: "test-id", platform: "instagram", handle: "test.user" }),
  });
  const payload = await response.json();

  if (response.status === 201) {
    assert.equal(payload.profile.handle, "test.user");
  } else {
    assert.equal(response.status, 500);
    assert.match(payload.error, /D1 binding `DB` is unavailable|profiles table is unavailable/);
  }
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
