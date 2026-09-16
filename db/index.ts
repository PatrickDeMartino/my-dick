import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

const MISSING_DB_MESSAGE =
  "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database.";

// `cloudflare:workers` only resolves inside the actual Workers runtime — a
// static top-level import of it crashes immediately under plain Node (e.g.
// `node --test`, which the test suite uses). A dynamic import here rejects
// instead, so a missing/unsupported binding surfaces as the same friendly
// error everywhere, rather than as a module-load crash in some contexts.
export async function getDb() {
  let env: { DB?: D1Database } | undefined;
  try {
    ({ env } = await import("cloudflare:workers"));
  } catch {
    const offline=(globalThis as typeof globalThis & {__TRIP_OFFLINE_DB__?:D1Database}).__TRIP_OFFLINE_DB__;
    if(!offline)throw new Error(MISSING_DB_MESSAGE);
    env={DB:offline};
  }

  if (!env?.DB) {
    const offline=(globalThis as typeof globalThis & {__TRIP_OFFLINE_DB__?:D1Database}).__TRIP_OFFLINE_DB__;
    if(!offline)throw new Error(MISSING_DB_MESSAGE);
    env={DB:offline};
  }

  return drizzle(env.DB!, { schema });
}

