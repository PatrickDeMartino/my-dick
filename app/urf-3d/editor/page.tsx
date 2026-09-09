import type { Metadata } from "next";
import WorldSelect from "../WorldSelect";

export const metadata: Metadata = {
  title: "Urf World Editor | Triptotropic",
  description: "Move the land, ocean, alien, and floating platform through the Urf cube.",
};

export default function UrfWorldEditorPage() {
  return <WorldSelect />;
}
