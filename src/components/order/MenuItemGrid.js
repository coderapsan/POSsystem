import React from "react";
import { getValidPortions, resolvePrice } from "../../utils/orderUtils";

export default function MenuItemGrid({ items = [], highlightedId, onSelectItem, onViewItemDetails }) {
  const visibleItems = items.filter((item) => item.isAvailable !== false);

  if (visibleItems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-[#f9fafb] p-3 text-sm text-slate-600">
        No available items in this category.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {visibleItems.map((item) => {
        const isHighlighted = highlightedId === item.id;
        const portionOptions = getValidPortions(item);
        const multiplePortions = portionOptions.length > 1;
        const basePrice = portionOptions.length > 0
          ? Math.min(...portionOptions.map(([, value]) => value))
          : resolvePrice(item);
        const priceLabel = multiplePortions
          ? `From £${basePrice.toFixed(2)}`
          : `£${basePrice.toFixed(2)}`;

        return (
          <div
            key={item.id}
            data-pos-item-id={item.id}
            className={`group flex h-full cursor-pointer flex-col gap-2 rounded-xl border p-3 transition ${
              isHighlighted
                ? "border-[#f26b30] bg-[#fff2e6] shadow-sm shadow-[#f26b30]/20"
                : "border-slate-200 bg-[#fffaf4] hover:border-[#f26b30] hover:bg-[#fff2e6] hover:shadow-sm"
            }`}
            onClick={() => onSelectItem(item)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {multiplePortions ? "Multiple portions" : "Single portion"}
                </p>
              </div>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm shadow-white/40">
                {priceLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Spice: {item.spicyLevel || "Mild"}</span>
              <span>
                {(item.allergens || []).length > 0
                  ? `Allergens: ${(item.allergens || []).join(", ")}`
                  : "Allergens: none"}
              </span>
            </div>
            <button
              type="button"
              className="self-start text-xs font-medium text-slate-600 transition hover:text-[#f26b30]"
              onClick={(event) => {
                event.stopPropagation();
                onViewItemDetails(item);
              }}
            >
              View ingredients
            </button>
          </div>
        );
      })}
    </div>
  );
}
