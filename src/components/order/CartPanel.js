import React, { useState } from "react";
import { formatPortionLabel } from "../../utils/orderUtils";

export default function CartPanel({
  cart,
  cartCount,
  subtotal,
  discountInput,
  discountType,
  onDiscountInputChange,
  onDiscountTypeChange,
  discountValue,
  taxAmount,
  total,
  paymentMethod,
  onPaymentMethodChange,
  paymentOptions,
  amountReceived,
  onAmountReceivedChange,
  changeDue,
  isPaid,
  onTogglePaid,
  onUpdateQuantity,
  onRemoveItem,
  onItemNoteChange,
  onClearCart,
  onOpenCustomItemModal,
  onPrintBill,
  onConfirmOrder,
  showCart,
  onHideCart,
  cartItemsListRef,
  actionButtonClass,
  subtleButtonClass,
  inputClass,
}) {
  const hasCartItems = cart.length > 0;
  const isCash = paymentMethod === "Cash";
  const [noteVisibility, setNoteVisibility] = useState({});

  return (
    <aside className="relative w-full lg:pl-4">
      <div
        className={`fixed bottom-0 right-0 z-40 flex w-full max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-lg transition-transform duration-300 ${
          showCart ? "translate-y-0" : "translate-y-[calc(100%-4rem)]"
        } lg:sticky lg:top-24 lg:bottom-auto lg:max-h-[calc(100vh-4rem)] lg:w-full lg:translate-y-0 lg:rounded-3xl lg:shadow-xl`}
      >
        {/* Header - Compact */}
        <div className="border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#f26b30] hover:text-[#f26b30]"
              onClick={() => cartItemsListRef?.current?.scrollIntoView({ behavior: "smooth" })}
              disabled={!hasCartItems}
            >
              cart
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#f26b30] hover:text-[#f26b30]"
              onClick={onClearCart}
              disabled={!hasCartItems}
            >
              clear
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#f26b30] bg-[#fff5f0] px-2 py-1.5 text-xs font-semibold text-[#f26b30] hover:bg-[#f26b30] hover:text-white"
              onClick={onOpenCustomItemModal}
              disabled={isPaid}
            >
              + add
            </button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">
              {cartCount} · <span className="text-[#f26b30]">£{total.toFixed(2)}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onHideCart}
                className="text-xs font-semibold text-slate-500 hover:text-[#f26b30] lg:hidden"
              >
                close
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items - More Space */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {hasCartItems ? (
            <div className="space-y-1.5" ref={cartItemsListRef}>
              {cart.map((item, idx) => {
                const itemKey = `${item.id}-${item.portion || "default"}`;
                const showNote = noteVisibility[itemKey] || Boolean(item.note);
                const lineTotal = (item.price * item.quantity).toFixed(2);

                return (
                  <div key={`${itemKey}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900">
                          {item.name}
                          {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                        </p>
                        <p className="text-xs text-slate-500">£{item.price.toFixed(2)}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-900">£{lineTotal}</span>
                      <button
                        onClick={() => onRemoveItem(item)}
                        className="text-slate-400 hover:text-[#f26b30] text-sm"
                        disabled={isPaid}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item, -1)}
                          className="h-6 w-6 text-center text-xs font-semibold text-slate-600 hover:text-[#f26b30]"
                          disabled={isPaid}
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item, 1)}
                          className="h-6 w-6 text-center text-xs font-semibold text-white bg-[#f26b30] hover:bg-[#ff773c]"
                          disabled={isPaid}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          setNoteVisibility((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }))
                        }
                        className="text-xs font-semibold text-[#f26b30] hover:underline"
                        disabled={isPaid}
                      >
                        {showNote ? "hide" : "note"}
                      </button>
                    </div>

                    {showNote && (
                      <textarea
                        value={item.note || ""}
                        onChange={(e) => onItemNoteChange(item, e.target.value.slice(0, 100))}
                        placeholder="Special request..."
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 focus:border-[#f26b30] focus:outline-none"
                        rows={2}
                        maxLength={100}
                        disabled={isPaid}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
              Cart empty
            </div>
          )}
        </div>

        {/* Checkout - Compact & Dense */}
        <div className="border-t border-slate-200 bg-white px-4 py-2 space-y-2">
          {/* Row 1: Payment Method */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="grid grid-cols-2 gap-1">
                {paymentOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => onPaymentMethodChange(option)}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                      paymentMethod === option
                        ? "border border-[#f26b30] bg-[#fff5f0] text-[#f26b30]"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#f26b30]"
                    }`}
                    disabled={isPaid}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2 text-center">
              <p className="text-[10px] uppercase text-slate-500">subtotal</p>
              <p className="text-lg font-bold text-slate-900">£{subtotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Row 2: Discount & Grand Total */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500">discount</span>
                <div className="inline-flex gap-0.5 rounded-full border border-slate-200">
                  <button
                    onClick={() => onDiscountTypeChange("percentage")}
                    className={`px-1.5 py-0.5 text-[10px] font-bold ${
                      discountType === "percentage"
                        ? "bg-[#f26b30] text-white"
                        : "text-slate-600 hover:text-[#f26b30]"
                    }`}
                    disabled={isPaid}
                  >
                    %
                  </button>
                  <button
                    onClick={() => onDiscountTypeChange("amount")}
                    className={`px-1.5 py-0.5 text-[10px] font-bold ${
                      discountType === "amount"
                        ? "bg-[#f26b30] text-white"
                        : "text-slate-600 hover:text-[#f26b30]"
                    }`}
                    disabled={isPaid}
                  >
                    £
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={discountInput}
                onChange={(e) => onDiscountInputChange(e.target.value)}
                placeholder="0"
                className={`${inputClass} w-full text-xs`}
                disabled={isPaid}
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2 text-center">
              <p className="text-[10px] uppercase text-slate-500">final total</p>
              <p className="text-lg font-bold text-slate-900">£{total.toFixed(2)}</p>
            </div>
          </div>

          {/* Row 3: Amount Paid & Change */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                amount paid
              </label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => onAmountReceivedChange(e.target.value)}
                placeholder="0.00"
                className={`${inputClass} w-full text-xs`}
                disabled={!isCash || isPaid}
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2 text-center">
              <p className="text-[10px] font-semibold uppercase text-slate-500">change</p>
              <p className="text-lg font-bold text-slate-900">£{changeDue.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onPrintBill}
              className={`${subtleButtonClass} py-2 rounded-lg font-semibold text-xs`}
              disabled={!hasCartItems}
            >
              print bill
            </button>
            <button
              onClick={onConfirmOrder}
              className="rounded-lg bg-[#f26b30] text-white py-2 font-semibold text-xs hover:bg-[#ff773c]"
              disabled={!hasCartItems}
            >
              confirm order
            </button>
          </div>

          {/* Paid Checkbox - At Bottom */}
          <div className="pt-1 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs cursor-pointer py-1">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={onTogglePaid}
                className="h-3.5 w-3.5 text-[#f26b30] cursor-pointer"
              />
              <span className="font-semibold text-slate-700">order paid</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
