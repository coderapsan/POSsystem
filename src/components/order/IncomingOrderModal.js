import React from "react";

export default function IncomingOrderModal({
  isOpen,
  orders,
  actionButtonClass,
  subtleButtonClass,
  onAccept,
  onDismiss,
}) {
  if (!isOpen || !orders || orders.length === 0) return null;

  const currentOrder = orders[0];
  const items = currentOrder.items || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-300/40">
        <h3 className="text-xl font-semibold text-slate-900">New Online Order</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>Customer: {currentOrder.customer?.name || "Walk-in"}</p>
          <p>Order ID: {currentOrder.orderId}</p>
          <ul className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-[#f9fafb] px-4 py-3 text-xs text-slate-700">
            {items.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{item.name}</span>
                <span>× {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className={actionButtonClass} onClick={() => onAccept(currentOrder.orderId)}>
            Accept & Print
          </button>
          <button className={subtleButtonClass} onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
