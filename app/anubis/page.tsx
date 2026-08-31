import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anubis TV Room | Triptotropic",
  description: "Anubis watches randomized Meat Bones Shorts in the Triptotropic television room.",
};

export default function AnubisRoomPage() {
  return (
    <main className="anubis-room-page">
      <iframe
        className="anubis-room-frame"
        src="/anubis-room/index.html"
        title="Anubis television room"
        allow="autoplay; fullscreen"
      />
    </main>
  );
}
