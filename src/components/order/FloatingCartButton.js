import React from "react";

export default function FloatingCartButton({ isVisible, cartCount, onClick }) {
  if (!isVisible) return null;

  return (
    <button
      className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-transparent bg-[#f26b30] px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-[#f26b30]/40 transition hover:shadow-xl hover:shadow-[#f26b30]/50 active:scale-95 sm:bottom-6 sm:right-6 sm:px-5 lg:hidden"
      onClick={onClick}
      aria-label="Open shopping cart"
    >
      <span className="text-lg">🛒</span>
      <span className="font-bold">{cartCount}</span>
    </button>
  );
}
