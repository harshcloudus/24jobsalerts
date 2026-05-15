"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COUNTDOWN_S = 5;
const PUB_ID = "ca-pub-4476723703068552";
const AD_SLOT = "6350182318";

/**
 * AdGateModal — fullscreen interstitial overlay (fallback when adBreak API is unavailable).
 * Mount once in the root layout. Triggered via the "adgate:show-interstitial" custom event.
 */
export default function AdGateModal() {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_S);
  const [canClose, setCanClose] = useState(false);
  const onCloseRef = useRef<(() => void) | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adPushed = useRef(false);

  const close = useCallback(() => {
    if (!canClose) return;
    if (tickRef.current) clearInterval(tickRef.current);
    setOpen(false);
    setSeconds(COUNTDOWN_S);
    setCanClose(false);
    adPushed.current = false;
    onCloseRef.current?.();
    onCloseRef.current = null;
  }, [canClose]);

  // Listen for the event dispatched by adManager
  useEffect(() => {
    const handler = (e: Event) => {
      const { onClose } = (e as CustomEvent<{ onClose: () => void }>).detail;
      onCloseRef.current = onClose;
      adPushed.current = false;
      setSeconds(COUNTDOWN_S);
      setCanClose(false);
      setOpen(true);
    };
    window.addEventListener("adgate:show-interstitial", handler);
    return () => window.removeEventListener("adgate:show-interstitial", handler);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current!);
          setCanClose(true);
          return 0;
        }
        return s - 1;
      });
    }, 1_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [open]);

  // Push AdSense ad once per open
  useEffect(() => {
    if (!open || adPushed.current) return;
    adPushed.current = true;
    try {
      ((window as { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
    } catch {
      // AdSense not ready; slot stays blank but UX is unaffected
    }
  }, [open]);

  // Escape key to close when countdown is done
  useEffect(() => {
    if (!open || !canClose) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, canClose, close]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="adgate-backdrop"
        onClick={canClose ? close : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="adgate-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Advertisement — loading job details"
      >
        <div className="adgate-container">
          {/* Header */}
          <div className="adgate-header">
            <span className="adgate-label">
              <span
                className="material-symbols-rounded adgate-ad-icon"
                aria-hidden="true"
              >
                campaign
              </span>
              Advertisement
            </span>
            <button
              className={`adgate-close-btn${canClose ? " adgate-close-ready" : ""}`}
              onClick={close}
              disabled={!canClose}
              aria-label={canClose ? "Close advertisement" : `Close in ${seconds}s`}
              type="button"
            >
              {canClose ? (
                <span className="material-symbols-rounded">close</span>
              ) : (
                <span className="adgate-countdown" aria-live="polite">
                  {seconds}
                </span>
              )}
            </button>
          </div>

          {/* Ad slot */}
          <div className="adgate-body">
            <ins
              className="adsbygoogle"
              style={{ display: "block", minHeight: "250px", width: "100%" }}
              data-ad-client={PUB_ID}
              data-ad-slot={AD_SLOT}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>

          {/* Note */}
          <p className="adgate-note">
            This free ad supports job listings on 24jobsalerts.
          </p>
        </div>
      </div>
    </>
  );
}
