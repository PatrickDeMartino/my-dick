import type { Metadata } from "next";
import WorldSelect from "../WorldSelect";

export const metadata: Metadata = {
  title: "Urf Archer World Select | Triptotropic",
  description: "Fire an arrow from a psychedelic island. Choose the world where it lands.",
};

export default function UrfWorldEditorPage() {
  return <WorldSelect />;
}
