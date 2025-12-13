import React from "react";

export default function FloatingCartButton({ isVisible, cartCount, onClick }) {
  if (!isVisible) return null;

  return (
    <button
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#f26b30] text-white shadow-2xl shadow-[#f26b30]/50 transition-all hover:scale-110 hover:shadow-[#f26b30]/70 active:scale-95"
      onClick={onClick}
      aria-label={`Open shopping cart with ${cartCount} items`}
    >
      <span className="text-2xl sm:text-3xl">🛒</span>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-red-500 text-xs sm:text-sm font-bold text-white border-2 border-white shadow-lg animate-pulse">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  );
}
