import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// A pseudo-account: no password, self-reported. Visitors claim a handle on
// Instagram or X to identify themselves before they can build in Penguin
// Town. Nothing here is verified against the real platform.
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(), // client-generated uuid, kept in localStorage
  platform: text("platform").notNull(), // "instagram" | "x"
  handle: text("handle").notNull(), // without the leading @
  displayName: text("display_name"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// One claimed hex on a board (Penguin Town is the first board; the id is
// namespaced so future boards/territories can share this table).
export const hexClaims = sqliteTable("hex_claims", {
  id: text("id").primaryKey(), // `${boardId}:${q}:${r}`
  boardId: text("board_id").notNull(),
  q: integer("q").notNull(),
  r: integer("r").notNull(),
  ownerId: text("owner_id").notNull(),
  buildingType: text("building_type").notNull().default("igloo"),
  colorway: text("colorway").notNull().default("ice"),
  label: text("label").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
