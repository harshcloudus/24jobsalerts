"use client";

import { usePathname } from "next/navigation";
import AdSenseDisplay from "./AdSenseDisplay";

const HIDDEN_ON = ["/latest-jobs"];

/** Ad slot above the site header — hidden on certain pages. */
export default function SiteTopAd() {
  const pathname = usePathname();
  const hide = HIDDEN_ON.some((p) => pathname === p || pathname === p + "/");
  if (hide) return null;

  return (
    <AdSenseDisplay
      variant="wide"
      wrapperClassName="bg-canvas border-b border-hairline py-3"
    />
  );
}
