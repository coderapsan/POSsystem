import React from "react";

export default function OrderHistoryShortcuts({ subtleButtonClass }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Order History</h2>
      <p className="mt-1 text-xs text-slate-600">
        Jump into the dedicated history views whenever you need deeper reporting.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className={subtleButtonClass}
          onClick={() => (window.location.href = "/order-history")}
        >
          Store Orders
        </button>
        <button
          className={subtleButtonClass}
          onClick={() => (window.location.href = "/customerOrder")}
        >
          Online Portal
        </button>
      </div>
    </section>
  );
}
