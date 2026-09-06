import type { Metadata } from "next";
import WorldGate from "./WorldGate";

export const metadata: Metadata = {
  title: "Planet Urf | Triptotropic",
  description: "Go anywhere, as long as it's Antarctica.",
};

export default function Urf3DPage() {
  return <WorldGate />;
}
