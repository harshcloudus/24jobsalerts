"use client";

import { useEffect, useState } from "react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      className={`fixed bottom-4 right-4 sm:bottom-5 sm:right-5 md:bottom-8 md:right-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_20px_rgba(224,92,58,0.35)] transition-all duration-200 hover:bg-primary-hover hover:-translate-y-0.5 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <span className="material-symbols-rounded" style={{ fontSize: "22px" }}>
        keyboard_arrow_up
      </span>
    </button>
  );
}
