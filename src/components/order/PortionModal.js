import React from "react";
import { getValidPortions, resolvePrice } from "../../utils/orderUtils";

export default function PortionModal({
  item,
  actionButtonClass,
  subtleButtonClass,
  onSelectPortion,
  onClose,
}) {
  if (!item) return null;

  const options = getValidPortions(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">Choose portion for {item.name}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Select a portion size to add this item to the cart.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {options.length === 0 ? (
            <button
              onClick={() => onSelectPortion("")}
              className={`${actionButtonClass} min-w-[140px] justify-center`}
            >
              Add Item
            </button>
          ) : (
            options.map(([portion]) => (
              <button
                key={portion}
                onClick={() => onSelectPortion(portion)}
                className={`${actionButtonClass} min-w-[160px] justify-center`}
              >
                {portion.charAt(0).toUpperCase() + portion.slice(1)} (£{resolvePrice(item, portion).toFixed(2)})
              </button>
            ))
          )}
        </div>
        <button className={`${subtleButtonClass} mt-6`} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
