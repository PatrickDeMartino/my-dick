import type { Metadata } from "next";
import "./map.css";

export const metadata: Metadata = {
  title: "Chart of the Labyrinth | Triptotropic",
  description: "A pirate chart of every playable room in the Triptotropic labyrinth.",
};

export default function MapLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
