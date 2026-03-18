"use client";

export default function BackToTopButton() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 bg-primary text-white border-2 border-charcoal rounded-full w-12 h-12 flex items-center justify-center shadow-[4px_4px_0px_rgba(26,23,22,1)] hover:translate-y-0.5 hover:translate-x-0.5 transition-transform"
      aria-label="Back to top"
    >
      <span className="material-symbols-outlined text-2xl">keyboard_arrow_up</span>
    </button>
  );
}

