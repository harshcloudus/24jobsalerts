"use client";

import { useEffect, useRef } from "react";

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

    return () => {
      if (pushInterval) window.clearInterval(pushInterval);
      window.clearTimeout(pushTimeout);
    };
  }, []);

  const adBody = (
    <div className={`${outerClass[variant]} ${className}`.trim()}>
      <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.10em] text-text-subtle">
        {labelText}
      </div>
      <div
        className={`${minHeightClassName} w-full border border-hairline rounded-xl bg-surface overflow-hidden`}
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

  if (!wrapperClassName) return adBody;
  return <div className={wrapperClassName}>{adBody}</div>;
}
