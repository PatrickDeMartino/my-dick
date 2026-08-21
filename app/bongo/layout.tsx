import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dr. Bongo Neural Link",
  description: "Talk to the super-intelligent orangutan aboard an alien ship.",
};

export default function BongoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
