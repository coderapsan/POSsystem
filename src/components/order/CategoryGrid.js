import React from "react";

export default function CategoryGrid({
  categories,
  availableCategoryCount,
  menuLoading,
  menuError,
  onReload,
  actionButtonClass,
  expandedCategory,
  onOpenCategory,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
          <p className="text-xs text-slate-600">
            Tap a category to focus; items open in a popup for speed.
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
          {availableCategoryCount} groups
        </span>
      </div>

      {menuLoading ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f4f5f7] px-4 py-3 text-sm text-slate-600">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-[#f26b30]"></span>
          Loading menu…
        </div>
      ) : menuError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          <p className="mb-3 font-semibold">We could not load the menu.</p>
          <p className="text-xs text-red-600/80">{menuError}</p>
          <button className={`${actionButtonClass} mt-4`} onClick={onReload}>
            Try again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-[#f9fafb] px-4 py-4 text-sm italic text-slate-600">
          No menu items available. Import the latest menu from the admin console to get started.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {categories.map(({ label, items }) => {
            const availableCount = (items || []).filter(
              (item) => item.isAvailable !== false
            ).length;
            if (availableCount === 0) return null;
            const isActive = expandedCategory === label;
            return (
              <button
                key={label}
                className={`flex h-full flex-col justify-between gap-2 rounded-xl border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-[#f26b30] bg-[#fff1e3] text-slate-900 shadow-sm shadow-[#f26b30]/25"
                    : "border-slate-200 bg-[#eef3ff] text-slate-700 hover:border-[#f26b30] hover:bg-[#ffeede] hover:text-[#f26b30] hover:shadow-sm"
                }`}
                onClick={() => onOpenCategory(label)}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {availableCount} dishes
                </span>
                <span className="text-base font-semibold leading-tight text-slate-900">
                  {label}
                </span>
                <span className="text-xs font-medium text-slate-500">Tap to browse</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
