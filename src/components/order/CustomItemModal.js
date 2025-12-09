import React from "react";

export default function CustomItemModal({
  isOpen,
  form,
  inputClass,
  actionButtonClass,
  subtleButtonClass,
  onClose,
  onFieldChange,
  onQuantityChange,
  onSave,
}) {
  if (!isOpen) return null;

  const { name, price, quantity } = form;
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const disableSave = !name.trim() || !price || Number(price) <= 0 || safeQuantity <= 0;

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Custom entry</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Add Custom Item</h3>
          </div>
          <button
            type="button"
            className={`${subtleButtonClass} whitespace-nowrap`}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Item name
            </label>
            <input
              value={name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              className={inputClass}
              placeholder="e.g. Delivery charge"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Price (£)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => onFieldChange("price", event.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Quantity
              </label>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#f9fafb] px-3 py-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-lg font-semibold text-slate-600 transition hover:border-[#f26b30] hover:text-[#f26b30]"
                  onClick={() => onQuantityChange(-1)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center text-base font-semibold text-slate-900">
                  {safeQuantity}
                </span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-[#f26b30] text-lg font-semibold text-white transition hover:bg-[#ff773c]"
                  onClick={() => onQuantityChange(1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={`${subtleButtonClass} justify-center sm:min-w-[140px]`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${actionButtonClass} justify-center sm:min-w-[160px]`}
            onClick={onSave}
            disabled={disableSave}
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
