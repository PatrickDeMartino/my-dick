import type { Metadata } from "next";
import PenguinTownScreen from "./PenguinTownScreen";

export const metadata: Metadata = {
  title: "Penguin Town",
  description: "The Antarctic coastal district — a real 3D ragdoll island, buildings, and a rat-meat economy.",
};

export default function PenguinTownPage() {
  return <PenguinTownScreen />;
}
