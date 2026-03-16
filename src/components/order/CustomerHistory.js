import React from "react";
import { formatPortionLabel } from "../../utils/orderUtils";

export default function CustomerHistory({ orders, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-slate-600">Loading customer history...</span>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🆕</span>
          <div>
            <div className="font-semibold text-green-700">New Customer</div>
            <div className="text-xs text-slate-600">No previous orders found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          <div>
            <div className="font-semibold text-blue-700">Returning Customer</div>
            <div className="text-xs text-slate-600">{orders.length} previous order{orders.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
      
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {orders.map((order, index) => (
          <div
            key={order.orderId || index}
            className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">
                  #{order.orderId}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {order.orderType}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#f26b30]">£{order.total.toFixed(2)}</div>
                <div className="flex items-center gap-1 text-xs">
                  {order.isPaid ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                      Paid
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {order.items && order.items.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                {order.items.slice(0, 3).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between text-xs text-slate-600">
                    <span>
                      {item.quantity}× {item.name}
                      {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                    </span>
                    <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="text-xs italic text-slate-400">
                    + {order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 rounded-lg bg-blue-100 p-2 text-center">
        <div className="text-xs font-semibold text-blue-900">
          Total Lifetime Value: £
          {orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
