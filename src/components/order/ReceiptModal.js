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
  isNewCustomer,
  actionButtonClass,
  subtleButtonClass,
  onPrint,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-300/40">
        <div className="text-center mb-3">
          <h2 className="text-4xl font-bold text-[#f26b30]">#{orderNumber}</h2>
          <p className="text-xs text-slate-500 mt-1">{timestamp}</p>
        </div>
        <div className="border-t-2 border-slate-200 pt-2 pb-2 text-xs text-slate-600 space-y-0.5">
          {isNewCustomer !== undefined && (
            <div className={`font-semibold ${isNewCustomer ? 'text-green-600' : 'text-blue-600'}`}>
              {isNewCustomer ? '🆕 New Customer' : '🔄 Returning Customer'}
            </div>
          )}
          {customer.name && <div>{customer.name}</div>}
          {customer.phone && <div>{customer.phone}</div>}
          {customer.postalCode && <div>Postal: {customer.postalCode}</div>}
        </div>
        <div className="border-t border-slate-200 mt-2 mb-2"></div>
        <div className="max-h-96 overflow-y-auto space-y-1.5 text-xs text-slate-700">
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <span className="flex-1">
                {item.quantity}× {item.name}{item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
              </span>
              <span className="font-semibold whitespace-nowrap">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-slate-200 mt-2 mb-2"></div>
        <div className="space-y-0.5 text-xs text-slate-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex justify-between text-[#d95c1f]">
              <span>Discount {discountType === "percentage" && discountInput ? `(${discountInput}%)` : ""}</span>
              <span>-£{discountValue.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1 mt-1">
            <span>TOTAL</span>
            <span>£{total.toFixed(2)}</span>
          </div>
          {paymentMethod === "Cash" && (
            <>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Paid</span>
                <span>£{Number(amountReceived || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Change</span>
                <span>£{changeDue.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => onPrint({
              cart,
              orderNumber,
              timestamp,
              orderType,
              customer,
              paymentMethod,
              isPaid
            })} 
            className={actionButtonClass}
          >
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
