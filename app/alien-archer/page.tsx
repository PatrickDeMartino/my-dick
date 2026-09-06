import type { Metadata } from "next";
import AlienArcherShell from "./AlienArcherShell";

export const metadata: Metadata = {
  title: "Alien Archer | Triptotropic",
  description: "Launch from Planet Urf into the alien archer world.",
};

export default function AlienArcherPage() {
  return <AlienArcherShell />;
}
