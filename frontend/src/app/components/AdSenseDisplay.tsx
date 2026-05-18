"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-4476723703068552";
const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "6350182318";

type Variant = "wide" | "narrow" | "inline";

type Props = {
  variant?: Variant;
  className?: string;
  wrapperClassName?: string;
  minHeightClassName?: string;
  labelText?: string;
};

const outerClass: Record<Variant, string> = {
  wide: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  narrow: "max-w-4xl mx-auto px-4",
  inline: "",
};

export default function AdSenseDisplay({
  variant = "wide",
  className = "",
  wrapperClassName = "",
  minHeightClassName = "min-h-[110px] sm:min-h-[120px] lg:min-h-[140px]",
  labelText = "Advertisements",
}: Props) {
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const [adHidden, setAdHidden] = useState(false);

  useEffect(() => {
    if (pushed.current || !insRef.current) return;

    const tryPush = () => {
      if (pushed.current || !insRef.current) return true;
      if (!window.adsbygoogle) return false;
      try {
        window.adsbygoogle.push({});
        pushed.current = true;
        return true;
      } catch {
        return false;
      }
    };

    tryPush();
    const pushInterval = !pushed.current
      ? window.setInterval(() => {
          if (tryPush()) window.clearInterval(pushInterval);
        }, 150)
      : undefined;
    const pushTimeout = window.setTimeout(() => {
      if (pushInterval) window.clearInterval(pushInterval);
    }, 12000);

    // Watch data-ad-status: AdSense sets "unfilled" when no ad is available
    const ins = insRef.current;
    const observer = new MutationObserver(() => {
      const status = ins.getAttribute("data-ad-status");
      if (status === "unfilled") setAdHidden(true);
    });
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });

    // Fallback: if height is still 0 after 6 s, assume no ad loaded
    const fallbackTimer = window.setTimeout(() => {
      if (ins.offsetHeight === 0) setAdHidden(true);
    }, 6000);

    return () => {
      if (pushInterval) window.clearInterval(pushInterval);
      window.clearTimeout(pushTimeout);
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  if (adHidden) return null;

  const adBody = (
    <div className={`${outerClass[variant]} ${className}`.trim()}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );

  if (!wrapperClassName) return adBody;
  return <div className={wrapperClassName}>{adBody}</div>;
}
