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
