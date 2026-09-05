import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profiles } from "../../../db/schema";

// Pseudo sign-in: a visitor types the Instagram or X username they go by,
// we mirror it into D1 keyed by a UUID they keep in localStorage. Nothing
// is verified against the real platform and no password is ever collected.
//
// No periods anywhere in either field (blocks domain-shaped text like
// "evil.com" outright) and no slashes/colons/@ either, so nothing typed
// here can ever read as a clickable link even before React renders it as
// plain text. Letters, numbers, spaces, underscore and a few punctuation
// marks only — no file uploads exist on this form at all.
const HANDLE_PATTERN = /^[a-zA-Z0-9_]{1,30}$/;
const DISPLAY_NAME_PATTERN = /^[a-zA-Z0-9_ '!?-]{0,40}$/;

function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@+/, "");
}

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("no such table") || combined.includes('from "profiles"')) {
    return "The profiles table is unavailable. Generate the migration locally with `npm run db:generate`, then deploy so the platform can apply the generated SQL to the real D1 database.";
  }

  return message;
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  try {
    const db = await getDb();
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return Response.json({ profile: profile ?? null });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      id?: string;
      platform?: string;
      handle?: string;
      displayName?: string;
    };

    const id = payload.id?.trim() ?? "";
    const platform = payload.platform === "x" ? "x" : payload.platform === "instagram" ? "instagram" : "";
    const handle = normalizeHandle(payload.handle ?? "");
    const displayName = payload.displayName?.trim().slice(0, 40) || "";

    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    if (!platform) return Response.json({ error: "platform must be instagram or x" }, { status: 400 });
    if (!HANDLE_PATTERN.test(handle)) {
      return Response.json(
        { error: "handle must be 1-30 letters, numbers or underscores — no periods" },
        { status: 400 },
      );
    }
    if (!DISPLAY_NAME_PATTERN.test(displayName)) {
      return Response.json(
        { error: "display name can only use letters, numbers, spaces and basic punctuation — no periods" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await db
      .insert(profiles)
      .values({ id, platform, handle, displayName: displayName || null })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { platform, handle, displayName: displayName || null },
      });

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return Response.json({ profile }, { status: 201 });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
