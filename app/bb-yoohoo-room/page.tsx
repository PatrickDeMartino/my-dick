"use client";

import Link from "next/link";
import { Can3D } from "../components/Can3D";

const ONE_LINERS = [
  "Coalition talks going great. Everyone agrees Yoo-hoo is chocolatey.",
  "Approval rating: unclear. Yoo-hoo rating: 10/10, shake well.",
  "Another speech, another can. Nobody remembers which came first.",
];

export default function BBYoohooRoomPage() {
  return (
    <main className="bb-room">
      <Link className="return-gate" href="/">
        ← RETURN TO THE SPLIT
      </Link>
      <div className="bb-room__stage">
        <span className="bb-room__can">
          <Can3D kind="yoohoo" size={160} />
        </span>
        <h1>BB&apos;s Yoo-hoo Room</h1>
        <p className="bb-room__sub">The arrow found the one guy who never says a straight answer either.</p>
        <ul className="bb-room__lines">
          {ONE_LINERS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
