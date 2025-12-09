import React from "react";
import { formatPortionLabel } from "../../utils/orderUtils";

export default function ReceiptModal({
  isOpen,
  orderNumber,
  timestamp,
  orderType,
  customer,
  cart,
  subtotal,
  discountValue,
  discountType,
  discountInput,
  taxAmount,
  total,
  paymentMethod,
  amountReceived,
  changeDue,
  isPaid,
  actionButtonClass,
  subtleButtonClass,
  onPrint,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-300/40">
        <h3 className="text-xl font-semibold text-slate-900">Receipt #{orderNumber}</h3>
        <p className="mt-1 text-xs text-slate-500">{timestamp}</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <span>Type: {orderType}</span>
          {customer.name && <span>Name: {customer.name}</span>}
          {customer.phone && <span>Phone: {customer.phone}</span>}
          {customer.address && <span>Address: {customer.address}</span>}
          {customer.postalCode && <span>Postal Code: {customer.postalCode}</span>}
        </div>
        <div className="my-4 border-t border-slate-200"></div>
        <div className="max-h-96 overflow-y-auto space-y-3 text-sm text-slate-700">
          {cart.map((item, index) => (
            <div key={index} className="space-y-1 rounded-2xl border border-slate-100 bg-[#f9fafb] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <span>
                  {item.quantity}× {item.name}
                  {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                </span>
                <span className="font-semibold text-slate-900">
                  £{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
              {item.note && (
                <p className="text-xs text-slate-500">Note: {item.note}</p>
              )}
            </div>
          ))}
        </div>
        <div className="my-4 border-t border-slate-200"></div>
        <div className="space-y-1 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex items-center justify-between text-[#d95c1f]">
              <span>
                Discount
                {discountType === "percentage" && discountInput
                  ? ` (${discountInput}% )`
                  : ""}
              </span>
              <span>-£{discountValue.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Payment</span>
            <span>{paymentMethod}</span>
          </div>
          {paymentMethod === "Cash" && (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Amount received</span>
                <span>£{Number(amountReceived || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Change due</span>
                <span>£{changeDue.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Status</span>
            <span>{isPaid ? "Paid" : "Pending"}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={onPrint} className={actionButtonClass}>
            Payment received • Print receipt
          </button>
          <button onClick={onClose} className={subtleButtonClass}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
