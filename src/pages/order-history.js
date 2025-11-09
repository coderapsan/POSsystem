import React, { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";

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
    <div>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-orange-700">Order History</h2>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by Order ID, Customer Name, or Phone"
          className="border p-2 rounded mb-4 w-full"
        />
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.orderId} className="border rounded-lg p-4 bg-white shadow">
                <div className="font-bold text-lg">Order #{order.orderId}</div>
                <div>Date: {new Date(order.createdAt).toLocaleString()}</div>
                <div>Customer: {order.customerName || (order.customer && order.customer.name) || "-"}</div>
                <div>Phone: {(order.customer && order.customer.phone) || "-"}</div>
                <div>Payment: {order.paymentMethod || "-"}</div>
                <div>Type: {order.orderType || "-"}</div>
                <div>Total: £{order.total.toFixed(2)}</div>
                <div className="mt-2">
                  <span className="font-semibold">Items:</span>
                  <ul className="list-disc ml-6">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.quantity}× {item.name} ({item.portion}) - £{(item.price * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  className="mt-3 bg-orange-600 text-white px-4 py-2 rounded"
                  onClick={() => handlePrint(order)}
                >
                  Print Receipt
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
