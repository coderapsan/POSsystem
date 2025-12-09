import React from "react";
import MenuItemGrid from "./MenuItemGrid";

export default function CategoryModal({
  isOpen,
  title,
  items,
  highlightedId,
  subtleButtonClass,
  onClose,
  onSelectItem,
  onViewItemDetails,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-5xl rounded-[32px] border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Focused view</p>
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
          </div>
          <button className={`${subtleButtonClass} mt-4 sm:mt-0`} onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-6 max-h-[65vh] overflow-y-auto pr-1">
          <MenuItemGrid
            items={items}
            highlightedId={highlightedId}
            onSelectItem={onSelectItem}
            onViewItemDetails={onViewItemDetails}
          />
        </div>
      </div>
    </div>
  );
}
