import React from "react";

export default function FloatingCartButton({ isVisible, cartCount, onClick }) {
  if (!isVisible) return null;

  return (
    <button
      className="fixed bottom-6 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-transparent bg-[#f26b30] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/40 transition lg:hidden"
      onClick={onClick}
    >
      🛒 Cart ({cartCount})
    </button>
  );
}
