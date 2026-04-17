"use client";

import AdSenseDisplay from "./AdSenseDisplay";

/** Ad slot above the site header on every page. */
export default function SiteTopAd() {
  return (
    <AdSenseDisplay
      variant="wide"
      wrapperClassName="bg-white border-b-2 border-charcoal py-3"
    />
  );
}
