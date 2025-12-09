import React from "react";

export default function OrderInfoForm({
  orderType,
  onOrderTypeChange,
  customer,
  onCustomerChange,
  inputClass,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Order Information</h3>
        <span className="text-xs uppercase tracking-[0.35em] text-slate-500">{orderType}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select
          value={orderType}
          onChange={(e) => onOrderTypeChange(e.target.value)}
          className={`${inputClass} appearance-none`}
        >
          <option>Dine In</option>
          <option>Take Away</option>
          <option>Delivery</option>
        </select>
        <input
          placeholder="Customer Name"
          value={customer.name}
          onChange={(e) => onCustomerChange("name", e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Phone"
          value={customer.phone}
          onChange={(e) => onCustomerChange("phone", e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Address Line 1"
          value={customer.address}
          onChange={(e) => onCustomerChange("address", e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Postal Code"
          value={customer.postalCode}
          onChange={(e) => onCustomerChange("postalCode", e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Order Notes (optional)"
          value={customer.notes || ""}
          onChange={(e) => onCustomerChange("notes", e.target.value)}
          className={`${inputClass} sm:col-span-2 lg:col-span-3`}
        />
      </div>
    </div>
  );
}
