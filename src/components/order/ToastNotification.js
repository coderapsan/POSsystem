import React from "react";

export default function ToastNotification({ isVisible, message }) {
  if (!isVisible || !message) return null;

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-xl shadow-slate-300/40">
      ✅ {message}
    </div>
  );
}
