import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { hexClaims, profiles } from "../../../db/schema";

// Claimable hexes for a civ-style board. Penguin Town is the first board;
// boardId keeps this table ready for the next one when the site spreads.
const BOARD_RADIUS = 3;
const BUILDING_TYPES = ["igloo", "fish-shack", "ice-rink", "snow-fort", "aurora-tower"];
const COLORWAYS = ["ice", "aurora", "coral", "kelp", "dusk"];

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("no such table") || combined.includes('from "hex_claims"')) {
    return "The hex_claims table is unavailable. Generate the migration locally with `npm run db:generate`, then deploy so the platform can apply the generated SQL to the real D1 database.";
  }

  return message;
}

function inBounds(q: number, r: number) {
  return (
    Number.isInteger(q) &&
    Number.isInteger(r) &&
    Math.abs(q) <= BOARD_RADIUS &&
    Math.abs(r) <= BOARD_RADIUS &&
    Math.abs(q + r) <= BOARD_RADIUS
  );
}

export async function GET(request: Request) {
  const boardId = new URL(request.url).searchParams.get("board") ?? "penguin-town";

  try {
    const db = await getDb();
    const claims = await db.select().from(hexClaims).where(eq(hexClaims.boardId, boardId));
    return Response.json({ boardId, radius: BOARD_RADIUS, claims });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      boardId?: string;
      q?: number;
      r?: number;
      ownerId?: string;
      buildingType?: string;
      colorway?: string;
      label?: string;
    };

    const boardId = payload.boardId?.trim() || "penguin-town";
    const q = Number(payload.q);
    const r = Number(payload.r);
    const ownerId = payload.ownerId?.trim() ?? "";
    const buildingType = BUILDING_TYPES.includes(payload.buildingType ?? "")
      ? (payload.buildingType as string)
      : "igloo";
    const colorway = COLORWAYS.includes(payload.colorway ?? "") ? (payload.colorway as string) : "ice";
    const label = (payload.label ?? "").trim().slice(0, 24);

    if (!ownerId) return Response.json({ error: "ownerId is required" }, { status: 400 });
    if (!inBounds(q, r)) return Response.json({ error: "hex is outside the board" }, { status: 400 });
    if (q === 0 && r === 0) {
      return Response.json({ error: "the town hall hex can't be claimed" }, { status: 400 });
    }

    const db = await getDb();
    const [owner] = await db.select().from(profiles).where(eq(profiles.id, ownerId)).limit(1);
    if (!owner) return Response.json({ error: "sign in before claiming a hex" }, { status: 401 });

    const id = `${boardId}:${q}:${r}`;
    const [existing] = await db.select().from(hexClaims).where(eq(hexClaims.id, id)).limit(1);
    if (existing && existing.ownerId !== ownerId) {
      return Response.json({ error: "someone else already built here" }, { status: 409 });
    }

    await db
      .insert(hexClaims)
      .values({ id, boardId, q, r, ownerId, buildingType, colorway, label })
      .onConflictDoUpdate({
        target: hexClaims.id,
        set: { buildingType, colorway, label, updatedAt: new Date().toISOString() },
      });

    const [claim] = await db.select().from(hexClaims).where(eq(hexClaims.id, id)).limit(1);
    return Response.json({ claim }, { status: 201 });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as { boardId?: string; q?: number; r?: number; ownerId?: string };
    const boardId = payload.boardId?.trim() || "penguin-town";
    const q = Number(payload.q);
    const r = Number(payload.r);
    const ownerId = payload.ownerId?.trim() ?? "";
    const id = `${boardId}:${q}:${r}`;

    const db = await getDb();
    const [existing] = await db.select().from(hexClaims).where(eq(hexClaims.id, id)).limit(1);
    if (!existing) return Response.json({ ok: true });
    if (existing.ownerId !== ownerId) {
      return Response.json({ error: "you can only release your own hex" }, { status: 403 });
    }

    await db.delete(hexClaims).where(and(eq(hexClaims.id, id), eq(hexClaims.ownerId, ownerId)));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
