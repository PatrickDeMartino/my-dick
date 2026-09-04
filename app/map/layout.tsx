import type { Metadata } from "next";
import "./map.css";

export const metadata: Metadata = {
  title: "Chart of the Labyrinth | Triptotropic",
  description: "A hand-drawn chart of every room in the Triptotropic labyrinth and how they connect.",
};

export default function MapLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
