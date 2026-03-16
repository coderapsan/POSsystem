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
          if (data.warning) {
            setError("⚠️ Database not configured - order history not available");
          }
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
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;

    const itemsHtml = (order.items || [])
      .map((item) => {
        const qty = Number(item.quantity) || 0;
        const priceEach = Number(item.price) || 0;
        const lineTotal = qty * priceEach;
        const portion = item.portion ? ` (${item.portion})` : "";
        return `<div style="margin: 3px 0;">
          <div style="font-size: 17px;"><span style="font-weight: bold;">${qty}x ${item.name}${portion}</span> £${lineTotal.toFixed(2)}</div>
        </div>`;
      })
      .join("");

    const customerSection = order.customerName || order.customer?.name ? `<div style="margin: 5px 0; padding: 4px 0; border-bottom: 1px solid #000;">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${order.customerName || order.customer?.name}</div>
      ${order.customer?.phone ? `<div style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">${order.customer.phone}</div>` : ""}
      ${order.customer?.address ? `<div style="font-size: 11px; margin-bottom: 2px;">${order.customer.address}</div>` : ""}
      ${order.customer?.postalCode ? `<div style="font-size: 16px; font-weight: bold;">${order.customer.postalCode}</div>` : ""}
    </div><div class="divider"></div>` : "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      width: 44mm; 
      max-width: 44mm;
      padding: 0; 
      margin: 0;
      background: white; 
      font-size: 14px; 
      line-height: 1.5;
      text-align: left;
    }
    .divider { border-bottom: 1px dashed #333; margin: 5px 0; }
  </style>
</head>
<body>
  <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 2px;">The MoMos</div>
  <div style="text-align: center; font-size: 11px; margin-bottom: 5px;">340 Kingston Rd, SW20 8LR<br/>0208 123 4567</div>
  
  <div class="divider"></div>
  
  <div style="text-align: center; font-weight: bold; font-size: 28px; margin: 5px 0;">#${order.orderId}</div>
  <div style="text-align: center; font-size: 12px; margin-bottom: 5px;">${order.orderType || "Order"}<br/>${new Date(order.createdAt || Date.now()).toLocaleString()}</div>
  
  <div class="divider"></div>
   
  ${customerSection}
  
  <div style="margin: 8px 0;">
    ${itemsHtml}
  </div>
  
  <div class="divider"></div>
  
  <div style="font-weight: bold; font-size: 18px; margin: 8px 0; padding: 4px 0;">TOTAL: £${Number(order.total || 0).toFixed(2)}</div>
  
  <div class="divider"></div>
  
  <div style="text-align: center; font-weight: bold; font-size: 18px; margin: 8px 0; text-decoration: underline;">${order.isPaid ? ((order.paymentMethod || 'Cash') + ' Paid') : ((order.paymentMethod || 'Cash') + ' Not Paid')}</div>
  
  <div class="divider"></div>
  
  <div style="text-align: center; font-size: 12px; margin-top: 6px;">Thank You!</div>
</body>
</html>`;

    receiptWindow.document.write(html);
    receiptWindow.document.close();
    
    // Safari and mobile compatibility improvements
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Wait for content to fully render before printing
    const printDelay = isSafari || isMobile ? 1000 : 500;
    
    setTimeout(() => {
      // Ensure the window is ready
      if (receiptWindow.document.readyState === 'complete') {
        receiptWindow.focus();
        
        // For Safari and mobile, try different print methods
        if (isSafari || isMobile) {
          try {
            receiptWindow.print();
          } catch (e) {
            console.warn('Print error on Safari/Mobile:', e);
            // Fallback: inform user to use share/print button
            if (isMobile) {
              alert('Please use the Share button in your browser and select Print');
            }
          }
        } else {
          receiptWindow.print();
        }
        
        receiptWindow.close();
      } else {
        // If not ready, wait a bit more
        setTimeout(() => {
          receiptWindow.focus();
          receiptWindow.print();
          receiptWindow.close();
        }, 500);
      }
    }, printDelay);
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
                      
                      {/* Stripe Payment Status */}
                      {order.paymentMethod === "Card" && order.stripePaymentIntentId && (
                        <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-300">✅ Stripe Payment Verified</p>
                          <div className="grid gap-2 text-xs text-green-200 sm:grid-cols-2">
                            <span>Status: {order.stripePaymentStatus || "succeeded"}</span>
                            <span>Payment ID: {order.stripePaymentIntentId.slice(0, 15)}...</span>
                            <span className="font-semibold">{order.isPaid ? "PAID" : "PENDING"}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Legacy Card Payment Details */}
                      {order.paymentMethod === "Card" && !order.stripePaymentIntentId && order.cardDetails && (
                        <div className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">⚠️ Legacy Card Payment</p>
                          <div className="grid gap-2 text-xs text-yellow-200 sm:grid-cols-2">
                            <span>Card: {order.cardDetails.cardNumber || "N/A"}</span>
                            <span>Name: {order.cardDetails.cardHolder || "N/A"}</span>
                            <span>Expiry: {order.cardDetails.expiry || "N/A"}</span>
                            <span>CVV: {order.cardDetails.cvv || "N/A"}</span>
                          </div>
                        </div>
                      )}
                      
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
