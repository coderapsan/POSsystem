import React from "react";
import { getValidPortions, resolvePrice } from "../../utils/orderUtils";

export default function MenuSearch({
  searchTerm,
  onSearchChange,
  hasActiveSearch,
  searchResults,
  onClearSearch,
  onRefreshMenu,
  menuLoading,
  inputClass,
  actionButtonClass,
  subtleButtonClass,
  onSelectResult,
  onViewItemDetails,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search the menu"
            className={`${inputClass} pr-12`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            ⌕
          </span>
        </div>
        {hasActiveSearch && (
          <button className={subtleButtonClass} onClick={onClearSearch}>
            Clear
          </button>
        )}
        <button className={actionButtonClass} onClick={onRefreshMenu} disabled={menuLoading}>
          {menuLoading ? "Refreshing…" : "Refresh Menu"}
        </button>
      </div>

      {hasActiveSearch && (
        <div className="mt-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#f26b30]">
            Search Results
          </h3>
          {searchResults.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-[#f9fafb] px-4 py-3 text-sm text-slate-600">
              No menu items found for "{searchTerm}".
            </p>
          ) : (
            searchResults.map((result) => {
              const portionOptions = getValidPortions(result.item);
              const multiplePortions = portionOptions.length > 1;
              const basePrice = portionOptions.length > 0
                ? Math.min(...portionOptions.map(([, value]) => value))
                : resolvePrice(result.item);
              const priceLabel = multiplePortions
                ? `From £${basePrice.toFixed(2)}`
                : `£${basePrice.toFixed(2)}`;
              return (
                <button
                  key={`${result.item.id}-${result.categoryKey}`}
                  type="button"
                  onClick={() => onSelectResult(result)}
                  className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-[#fffaf4] px-4 py-3 text-left text-sm shadow-sm transition hover:border-[#f26b30] hover:bg-[#fff2e6] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{result.item.name}</p>
                    <p className="text-xs text-slate-500">{result.categoryKey}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {multiplePortions ? "Multiple portions" : "Single portion"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm shadow-white/40">
                      {priceLabel}
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-slate-600 transition hover:text-[#f26b30]"
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewItemDetails(result.item);
                      }}
                    >
                      View ingredients
                    </button>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Tap to add
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
