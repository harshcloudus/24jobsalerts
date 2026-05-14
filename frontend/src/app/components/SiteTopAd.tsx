"use client";

import AdSenseDisplay from "./AdSenseDisplay";

/** Ad slot above the site header on every page. */
export default function SiteTopAd() {
  return (
    <AdSenseDisplay
      variant="wide"
      wrapperClassName="bg-canvas border-b border-hairline py-3"
    />
  );
}
