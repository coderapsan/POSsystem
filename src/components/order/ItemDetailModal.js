import React from "react";

export default function ItemDetailModal({ item, subtleButtonClass, actionButtonClass, onClose, onSelectItem }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {item.description?.trim() || item.ingredients?.join(", ") || "Ask the kitchen for the latest prep."}
        </p>
        <div className="mt-4 grid gap-2 text-xs text-slate-500">
          <span>🌶️ {item.spicyLevel || "Mild"}</span>
          <span>⚠️ {(item.allergens || []).join(", ") || "No listed allergens"}</span>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            className={`${actionButtonClass} w-full justify-center sm:flex-1`}
            onClick={() => onSelectItem(item)}
          >
            Add to cart
          </button>
          <button
            className={`${subtleButtonClass} w-full justify-center sm:flex-1`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
