import React from "react";

export default function CustomerSummaryCard({ customer, orderHistory }) {
  // Don't show if no customer data
  if (!customer || (!customer.name && !customer.phone && !customer.address)) {
    return null;
  }

  const hasHistory = orderHistory && orderHistory.length > 0;

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-md">
            {customer.name ? customer.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Customer Details</h3>
            {hasHistory && (
              <p className="text-xs text-blue-600 font-semibold">
                🔄 Returning Customer • {orderHistory.length} order{orderHistory.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {hasHistory && (
          <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            ✓ VERIFIED
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Name */}
        {customer.name && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Name
            </div>
            <div className="text-base font-semibold text-slate-900">{customer.name}</div>
          </div>
        )}

        {/* Phone */}
        {customer.phone && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone
            </div>
            <div className="text-base font-semibold text-slate-900">{customer.phone}</div>
          </div>
        )}

        {/* Address - Full Width */}
        {(customer.address || customer.postalCode) && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:col-span-2">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </div>
            <div className="space-y-1">
              {customer.address && (
                <div className="text-base font-semibold text-slate-900">{customer.address}</div>
              )}
              {customer.postalCode && (
                <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
                  📮 {customer.postalCode.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats for Returning Customers */}
      {hasHistory && (
        <div className="mt-4 flex gap-2 border-t border-blue-200 pt-4">
          <div className="flex-1 rounded-lg bg-blue-100 p-2 text-center">
            <div className="text-xs font-semibold text-blue-600">ORDERS</div>
            <div className="text-lg font-bold text-blue-900">{orderHistory.length}</div>
          </div>
          <div className="flex-1 rounded-lg bg-green-100 p-2 text-center">
            <div className="text-xs font-semibold text-green-600">TOTAL SPENT</div>
            <div className="text-lg font-bold text-green-900">
              £{orderHistory.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-purple-100 p-2 text-center">
            <div className="text-xs font-semibold text-purple-600">AVG ORDER</div>
            <div className="text-lg font-bold text-purple-900">
              £{(orderHistory.reduce((sum, order) => sum + (order.total || 0), 0) / orderHistory.length).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
