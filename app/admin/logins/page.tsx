import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { profiles } from "../../../db/schema";

export const metadata: Metadata = {
  title: "Submitted logins",
  robots: { index: false, follow: false },
};

// Not linked from anywhere in the site — reached only by knowing this URL
// plus the shared secret in ?key=. Set ADMIN_KEY on the hosting platform
// (see .env.example); without it, this page refuses to show anything.
export default async function AdminLoginsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return (
      <main className="admin-logins">
        <h1>Submitted logins</h1>
        <p>ADMIN_KEY isn&apos;t set on this deployment, so this page can&apos;t open for anyone yet.</p>
      </main>
    );
  }

  if (key !== adminKey) {
    return (
      <main className="admin-logins">
        <h1>Submitted logins</h1>
        <p>Wrong or missing key. Add <code>?key=&lt;your ADMIN_KEY&gt;</code> to the URL.</p>
      </main>
    );
  }

  let rows: (typeof profiles.$inferSelect)[] = [];
  let error: string | null = null;
  try {
    const db = await getDb();
    rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt)).limit(500);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unexpected error";
  }

  return (
    <main className="admin-logins">
      <h1>Submitted logins ({rows.length})</h1>
      {error && <p className="admin-logins__error">{error}</p>}
      {!error && rows.length === 0 && <p>Nobody has signed in yet.</p>}
      {!error && rows.length > 0 && (
        <table className="admin-logins__table">
          <thead>
            <tr>
              <th>When</th>
              <th>Platform</th>
              <th>Handle</th>
              <th>Display name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.createdAt}</td>
                <td>{row.platform}</td>
                <td>@{row.handle}</td>
                <td>{row.displayName ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
