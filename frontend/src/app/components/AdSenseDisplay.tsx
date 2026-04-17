"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-1236097872832305";
const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "3547177238";

type Variant = "wide" | "narrow";

type Props = {
  variant?: Variant;
  className?: string;
  minHeightClassName?: string;
};

const outerClass: Record<Variant, string> = {
  wide: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  narrow: "max-w-4xl mx-auto px-4",
};

export default function AdSenseDisplay({
  variant = "wide",
  className = "",
  minHeightClassName = "min-h-[110px] sm:min-h-[120px] lg:min-h-[140px]",
}: Props) {
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);

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

    if (tryPush()) return;

    const interval = window.setInterval(() => {
      if (tryPush()) window.clearInterval(interval);
    }, 150);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 12000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div className={`${outerClass[variant]} ${className}`.trim()}>
      <div
        className={`${minHeightClassName} w-full border-2 border-charcoal/20 rounded-xl bg-sand-light/50 overflow-hidden`}
      >
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
    </div>
  );
}
