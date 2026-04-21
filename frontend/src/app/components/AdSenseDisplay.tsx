"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-1236097872832305";
const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "3547177238";

type Variant = "wide" | "narrow" | "inline";

type Props = {
  variant?: Variant;
  className?: string;
  wrapperClassName?: string;
  minHeightClassName?: string;
  /** Optional: hide if still empty after this many ms (keeps visible while loading). */
  hideIfEmptyAfterMs?: number;
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
  hideIfEmptyAfterMs = 8000,
  labelText = "Advertisements",
}: Props) {
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const [hidden, setHidden] = useState(false);

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

    const statusInterval = window.setInterval(() => {
      const el = insRef.current;
      if (!el) return;
      const status = el.getAttribute("data-ad-status");
      if (status === "filled") {
        window.clearInterval(statusInterval);
        return;
      }
      if (status === "unfilled") {
        setHidden(true);
        window.clearInterval(statusInterval);
      }
    }, 500);

    const hasIframe = () => {
      const el = insRef.current as unknown as HTMLElement | null;
      if (!el) return false;
      return Boolean(el.querySelector("iframe"));
    };

    const emptyTimeout =
      hideIfEmptyAfterMs && hideIfEmptyAfterMs > 0
        ? window.setTimeout(() => {
            const el = insRef.current;
            const status = el?.getAttribute("data-ad-status");
            if (status === "filled") return;
            if (status === "unfilled") {
              setHidden(true);
              return;
            }
            // If AdSense never sets status but also never renders an iframe, hide the empty box.
            if (!hasIframe()) setHidden(true);
          }, hideIfEmptyAfterMs)
        : undefined;

    return () => {
      if (pushInterval) window.clearInterval(pushInterval);
      window.clearTimeout(pushTimeout);
      window.clearInterval(statusInterval);
      if (emptyTimeout) window.clearTimeout(emptyTimeout);
    };
  }, []);

  if (hidden) return null;

  const adBody = (
    <div className={`${outerClass[variant]} ${className}`.trim()}>
      <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-text-muted/80">
        {labelText}
      </div>
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

  if (!wrapperClassName) return adBody;
  return <div className={wrapperClassName}>{adBody}</div>;
}
