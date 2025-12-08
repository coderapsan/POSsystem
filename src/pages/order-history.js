import React, { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";
import StaffGate from "../components/common/StaffGate";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/saveOrder", { method: "GET" });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.error || "Failed to fetch orders");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  function matchesFilter(order) {
    const f = filter.trim().toLowerCase();
    if (!f) return true;
    return (
      (order.orderId && order.orderId.toLowerCase().includes(f)) ||
      (order.customerName && order.customerName.toLowerCase().includes(f)) ||
      (order.customer && order.customer.phone && order.customer.phone.toLowerCase().includes(f))
    );
  }

  function handlePrint(order) {
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${order.orderId}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: monospace; padding: 8px; font-size: 12px; width: 80mm; margin: 0 auto; }
            h1 { text-align: center; margin-bottom: 4px; font-size: 18px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .bold { font-weight: bold; }
            .total { font-size: 14px; font-weight: bold; text-align: right; }
            .order-number { font-size: 16px; font-weight: bold; text-align: center; margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>The MoMos</h1>
          <div class="center">340 Kingston Road, SW20 8LR</div>
          <div class="center">Tel: 0208 123 4567</div>
          <div class="line"></div>
          <div class="order-number">#${order.orderId}</div>
          <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
          <div>Type: ${order.orderType}</div>
          ${order.customerName || (order.customer && order.customer.name)
            ? `<div class="line"></div>
               <div><strong>Customer Info:</strong></div>
               <div>Name: ${order.customerName || (order.customer && order.customer.name) || "-"}</div>
               <div>Phone: ${(order.customer && order.customer.phone) || "-"}</div>
               <div>Address: ${(order.customer && order.customer.address) || "-"}</div>
               <div>Postal: ${(order.customer && order.customer.postalCode) || "-"}</div>`
            : ""
          }
          <div class="line"></div>
          ${order.items
            .map(
              (item) =>
                `${item.quantity} × ${item.name} (${item.portion}) - £${(
                  item.price * item.quantity
                ).toFixed(2)}`
            )
            .join("<br/>")}
          <div class="line"></div>
          <div>Subtotal: £${order.total.toFixed(2)}</div>
          <div class="total">Total: £${order.total.toFixed(2)}</div>
          <div class="line"></div>
          <div>Payment: ${order.paymentMethod}</div>
          <div>Status: ${order.isPaid ? "Paid" : "Pending Cash"}</div>
          <div class="line"></div>
          <div class="center">Thank You! Visit Again</div>
        </body>
      </html>`;
    const receiptWindow = window.open("", "_blank");
    receiptWindow.document.write(receiptContent);
    receiptWindow.print();
    receiptWindow.close();
  }

  const filteredOrders = orders.filter(matchesFilter);

  return (
    <StaffGate>
      <div className="min-h-screen bg-[#0b1120] text-slate-100">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30 backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold text-white">Order History</h2>
              <span className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Staff view</span>
            </div>
            <input
              type="text"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter by order ID, customer, or phone"
              className="mt-4 w-full rounded-lg border border-white/15 bg-[#0f192d] px-4 py-3 text-sm text-white placeholder:text-slate-500 caret-[#f26b30] focus:border-[#f26b30] focus:outline-none focus:ring-2 focus:ring-[#f26b30]/40"
            />
            <div className="mt-6">
              {loading ? (
                <p className="text-sm text-slate-300">Loading orders…</p>
              ) : error ? (
                <p className="text-sm text-red-300">{error}</p>
              ) : filteredOrders.length === 0 ? (
                <p className="text-sm text-slate-400">No orders match the current filter.</p>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="rounded-2xl border border-white/10 bg-[#0f1628] p-5 text-sm text-slate-200 shadow-lg shadow-black/30"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-lg font-semibold text-white">Order #{order.orderId}</p>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <span>Customer: {order.customerName || order.customer?.name || "Walk-in"}</span>
                        <span>Phone: {order.customer?.phone || "-"}</span>
                        <span>Type: {order.orderType || "-"}</span>
                        <span>Payment: {order.paymentMethod || "-"}</span>
                        <span>Total: £{Number(order.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Items</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between gap-3">
                              <span>
                                {item.quantity}× {item.name}
                                {item.portion ? ` (${item.portion})` : ""}
                              </span>
                              <span>£{(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-[#f26b30] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/30 transition hover:bg-[#ff7a3e]"
                        onClick={() => handlePrint(order)}
                      >
                        Print receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffGate>
  );
}
