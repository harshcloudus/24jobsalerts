import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved jobs",
};

export default function BookmarksLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
