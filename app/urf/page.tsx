import type { Metadata } from "next";
import WorldSelect from "./WorldSelect";

export const metadata: Metadata = {
  title: "Planet Urf | Triptotropic",
  description: "Go anywhere, as long as it's Antarctica.",
};

export default function UrfPage() {
  return <WorldSelect />;
}
