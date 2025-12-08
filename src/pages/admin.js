import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/common/Navbar";
import StaffGate from "../components/common/StaffGate";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "menu", label: "Menu Manager" },
  { id: "utilities", label: "Utilities" },
];

const initialNewItem = {
  category: "",
  name: "",
  description: "",
  priceLarge: "",
  priceSmall: "",
  spicyLevel: "",
  allergens: "",
  isAvailable: true,
};

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [menu, setMenu] = useState({});
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState({ menu: false, orders: false });

  const [newItem, setNewItem] = useState(initialNewItem);
  const [editingMenuItem, setEditingMenuItem] = useState(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSourceFilter, setOrderSourceFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 15;

  const [orderRange, setOrderRange] = useState({ start: "", end: "" });
  const [masterPassword, setMasterPassword] = useState("");

  useEffect(() => {
    if (!authenticated) return;
    fetchMenu();
    fetchOrders();
  }, [authenticated]);

  async function fetchMenu() {
    setLoading((prev) => ({ ...prev, menu: true }));
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) {
        setMenu(data.menu || {});
      } else {
        notify(data.error, "error");
      }
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading((prev) => ({ ...prev, menu: false }));
    }
  }

  async function fetchOrders() {
    setLoading((prev) => ({ ...prev, orders: true }));
    try {
      const res = await fetch("/api/saveOrder");
      const data = await res.json();
      if (data.success) {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } else {
        notify(data.error, "error");
      }
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading((prev) => ({ ...prev, orders: false }));
    }
  }

  function notify(text, type = "success") {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        notify("Welcome back!", "success");
      } else {
        notify("Invalid password", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    try {
      const res = await fetch("/api/admin-auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Password updated", "success");
        setResetMode(false);
        setOldPassword("");
        setNewPassword("");
      } else {
        notify(data.error || "Unable to update password", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  const analytics = useMemo(() => {
    if (!orders.length) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageTicket: 0,
        pendingOrders: 0,
        posOrders: 0,
        onlineOrders: 0,
        paymentBreakdown: [],
        topItems: [],
        salesTrend: [],
      };
    }

    let totalRevenue = 0;
    let pendingOrders = 0;
    let posOrders = 0;
    let onlineOrders = 0;
    const paymentMap = new Map();
    const itemMap = new Map();
    const salesTrendMap = new Map();

    orders.forEach((order) => {
      totalRevenue += Number(order.total) || 0;
      if (order.status === "pending") pendingOrders += 1;
      if (order.source === "customer") onlineOrders += 1;
      if (order.source === "pos" || order.source === "order") posOrders += 1;

      const paymentKey = (order.paymentMethod || "Unknown").toLowerCase();
      paymentMap.set(paymentKey, (paymentMap.get(paymentKey) || 0) + (Number(order.total) || 0));

      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const dayKey = orderDate.toISOString().slice(0, 10);
      salesTrendMap.set(dayKey, (salesTrendMap.get(dayKey) || 0) + (Number(order.total) || 0));

      (order.items || []).forEach((item) => {
        const key = item.name || "Unknown Item";
        const existing = itemMap.get(key) || { quantity: 0, revenue: 0 };
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        existing.quantity += qty;
        existing.revenue += qty * price;
        itemMap.set(key, existing);
      });
    });

    const paymentBreakdown = Array.from(paymentMap.entries()).map(([method, value]) => ({
      method,
      value,
    }));

    const topItems = Array.from(itemMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const salesTrend = Array.from(salesTrendMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    const averageTicket = totalRevenue / orders.length;

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageTicket,
      pendingOrders,
      posOrders,
      onlineOrders,
      paymentBreakdown,
      topItems,
      salesTrend,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = orderSearch
        ? [order.orderId, order.customerName, order.customer?.name, order.customer?.phone]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(orderSearch.toLowerCase()))
        : true;

      const matchesStatus =
        orderStatusFilter === "all" ? true : (order.status || "pending") === orderStatusFilter;

      const sourceKey = order.source === "order" ? "pos" : order.source || "pos";
      const matchesSource = orderSourceFilter === "all" ? true : sourceKey === orderSourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [orderSearch, orderSourceFilter, orderStatusFilter, orders]);

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, orderPage, ordersPerPage]);

  function handleStartEditMenuItem(category, item) {
    setEditingMenuItem({
      category,
      itemId: item.id,
      formData: {
        category,
        name: item.name || "",
        description: item.description || "",
        priceLarge:
          typeof item.price?.large === "number" && item.price.large > 0
            ? item.price.large
            : "",
        priceSmall:
          typeof item.price?.small === "number" && item.price.small > 0
            ? item.price.small
            : "",
        spicyLevel: item.spicyLevel || "",
        allergens: Array.isArray(item.allergens) ? item.allergens.join(", ") : "",
        isAvailable: item.isAvailable !== false,
      },
    });
  }

  function handleEditMenuChange(field, value) {
    setEditingMenuItem((prev) =>
      prev
        ? {
            ...prev,
            formData: {
              ...prev.formData,
              [field]: value,
            },
          }
        : prev
    );
  }

  async function handleSaveMenuItem() {
    if (!editingMenuItem) return;
    const { itemId, formData } = editingMenuItem;
    if (!formData.category.trim() || !formData.name.trim()) {
      notify("Category and name are required", "error");
      return;
    }

    const updates = {
      category: formData.category.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      spicyLevel: formData.spicyLevel.trim(),
      allergens: formData.allergens
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isAvailable: Boolean(formData.isAvailable),
      price: {
        large: Number(formData.priceLarge) || 0,
        small: Number(formData.priceSmall) || 0,
      },
    };

    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, updates }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Menu item updated", "success");
        setEditingMenuItem(null);
        fetchMenu();
      } else {
        notify(data.error || "Unable to update item", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleDeleteMenuItem(itemId) {
    if (!itemId) return;
    if (!window.confirm("Delete this menu item?")) return;
    try {
      const res = await fetch("/api/menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Menu item deleted", "success");
        fetchMenu();
      } else {
        notify(data.error || "Unable to delete menu item", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleToggleAvailability(itemId, nextValue) {
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, updates: { isAvailable: nextValue } }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Availability updated", "success");
        fetchMenu();
      } else {
        notify(data.error || "Unable to update availability", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleAddMenuItem() {
    if (!newItem.category.trim() || !newItem.name.trim()) {
      notify("Category and name are required", "error");
      return;
    }

    const itemPayload = {
      name: newItem.name.trim(),
      description: newItem.description.trim(),
      spicyLevel: newItem.spicyLevel.trim(),
      allergens: newItem.allergens
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isAvailable: Boolean(newItem.isAvailable),
      price: {
        large: Number(newItem.priceLarge) || 0,
        small: Number(newItem.priceSmall) || 0,
      },
    };

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newItem.category.trim(), item: itemPayload }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Menu item added", "success");
        setNewItem(initialNewItem);
        fetchMenu();
      } else {
        notify(data.error || "Unable to add menu item", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleUpdateOrderStatus(orderId, status) {
    try {
      const res = await fetch("/api/saveOrder/updateStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Order ${orderId} updated`, "success");
        fetchOrders();
      } else {
        notify(data.error || "Unable to update order", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!window.confirm(`Delete order ${orderId}?`)) return;
    try {
      const res = await fetch(`/api/saveOrder?orderId=${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        notify(`Order ${orderId} deleted`, "success");
        fetchOrders();
      } else {
        notify(data.error || "Unable to delete order", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
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
          <div>Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}</div>
          <div>Type: ${order.orderType || "-"}</div>
          ${order.customerName || order.customer?.name
            ? `<div class="line"></div>
                 <div><strong>Customer Info:</strong></div>
                 <div>Name: ${order.customerName || order.customer?.name || "-"}</div>
                 <div>Phone: ${order.customer?.phone || "-"}</div>
                 <div>Address: ${order.customer?.address || "-"}</div>
                 <div>Postal: ${order.customer?.postalCode || "-"}</div>`
            : ""}
          <div class="line"></div>
          ${(order.items || [])
            .map((item) => {
              const qty = Number(item.quantity) || 0;
              const priceEach = Number(item.price) || 0;
              const portion = item.portion ? ` (${item.portion})` : "";
              return `${qty} × ${item.name}${portion} - £${(qty * priceEach).toFixed(2)}`;
            })
            .join("<br/>")}
          <div class="line"></div>
          <div>Subtotal: £${Number(order.total || 0).toFixed(2)}</div>
          <div class="total">Total: £${Number(order.total || 0).toFixed(2)}</div>
          <div class="line"></div>
          <div>Payment: ${order.paymentMethod || "-"}</div>
          <div>Status: ${order.status || "pending"}</div>
          <div class="line"></div>
          <div class="center">Thank You! Visit Again</div>
        </body>
      </html>`;

    const receiptWindow = window.open("", "_blank");
    receiptWindow.document.write(receiptContent);
    receiptWindow.print();
    receiptWindow.close();
  }

  function renderDashboard() {
    const paymentMax = Math.max(...analytics.paymentBreakdown.map((item) => item.value), 0);
    const salesMax = Math.max(...analytics.salesTrend.map((item) => item.value), 0);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Revenue" value={`£${analytics.totalRevenue.toFixed(2)}`} subtitle={`${analytics.totalOrders} orders recorded`} />
          <StatCard
            title="Average Ticket"
            value={`£${analytics.averageTicket.toFixed(2)}`}
            subtitle={`${analytics.onlineOrders} online / ${analytics.posOrders} in-store`}
          />
          <StatCard title="Pending Orders" value={analytics.pendingOrders} subtitle="Orders awaiting action" accent="bg-red-500" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="bg-white p-5 rounded-lg shadow">
            <h3 className="font-semibold text-orange-700 mb-3">Sales by Payment Method</h3>
            {analytics.paymentBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500">No payment data yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.paymentBreakdown.map((entry) => (
                  <div key={entry.method}>
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span className="capitalize">{entry.method}</span>
                      <span>£{entry.value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-orange-600 rounded"
                        style={{ width: paymentMax ? `${(entry.value / paymentMax) * 100}%` : "5%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white p-5 rounded-lg shadow">
            <h3 className="font-semibold text-orange-700 mb-3">Top-Selling Items</h3>
            {analytics.topItems.length === 0 ? (
              <p className="text-sm text-gray-500">No items sold yet.</p>
            ) : (
              <ul className="space-y-3">
                {analytics.topItems.map((item) => (
                  <li key={item.name} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} sold</p>
                    </div>
                    <span className="font-semibold">£{item.revenue.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-orange-700">Daily Sales Trend</h3>
            <button className="text-sm text-orange-600 hover:underline" onClick={fetchOrders}>
              Refresh data
            </button>
          </div>
          {analytics.salesTrend.length === 0 ? (
            <p className="text-sm text-gray-500">Sales trend will appear once orders are recorded.</p>
          ) : (
            <div className="space-y-2">
              {analytics.salesTrend.map((point) => (
                <div key={point.date}>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{point.date}</span>
                    <span>£{point.value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: salesMax ? `${(point.value / salesMax) * 100}%` : "5%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderOrders() {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setOrderPage(1);
              }}
              placeholder="Search by order ID, customer, or phone"
              className="border p-2 rounded flex-1"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  setOrderPage(1);
                }}
                className="border p-2 rounded"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={orderSourceFilter}
                onChange={(e) => {
                  setOrderSourceFilter(e.target.value);
                  setOrderPage(1);
                }}
                className="border p-2 rounded"
              >
                <option value="all">All sources</option>
                <option value="pos">POS</option>
                <option value="customer">Online</option>
              </select>
              <button className="text-sm text-orange-600 hover:underline" onClick={fetchOrders}>
                Refresh
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">Showing {filteredOrders.length} orders</p>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-orange-600 text-white">
              <tr>
                <th className="px-3 py-2 text-left">Order</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Total</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    No orders match your filter.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.orderId} className="border-b last:border-b-0">
                    <td className="px-3 py-2">
                      <div className="font-semibold">#{order.orderId}</div>
                      <div className="text-xs text-gray-500">
                        {(order.items || []).map((item) => item.name).join(", ")}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{order.customerName || order.customer?.name || "-"}</div>
                      <div className="text-xs text-gray-500">{order.customer?.phone || "-"}</div>
                    </td>
                    <td className="px-3 py-2 font-semibold">£{Number(order.total || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 capitalize">{order.status || "pending"}</td>
                    <td className="px-3 py-2 capitalize">{order.source === "order" ? "pos" : order.source || "pos"}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                          onClick={() => handleUpdateOrderStatus(order.orderId, "completed")}
                        >
                          Mark completed
                        </button>
                        {order.status === "pending" && (
                          <button
                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded"
                            onClick={() => handleUpdateOrderStatus(order.orderId, "accepted")}
                          >
                            Accept
                          </button>
                        )}
                        <button className="text-xs bg-gray-200 px-2 py-1 rounded" onClick={() => handlePrint(order)}>
                          Print
                        </button>
                        <button className="text-xs bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDeleteOrder(order.orderId)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {orderPage} of {Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage))}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-40"
              disabled={orderPage === 1}
              onClick={() => setOrderPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-40"
              disabled={orderPage * ordersPerPage >= filteredOrders.length}
              onClick={() => setOrderPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderMenuManager() {
    const categories = Object.keys(menu).sort();

    return (
      <div className="space-y-6">
        <section className="bg-white p-5 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-orange-700">Create New Menu Item</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Category (e.g. Starters)"
              value={newItem.category}
              onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
              className="border p-2 rounded"
              list="category-options"
            />
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Large price"
              value={newItem.priceLarge}
              onChange={(e) => setNewItem((prev) => ({ ...prev, priceLarge: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Small price"
              value={newItem.priceSmall}
              onChange={(e) => setNewItem((prev) => ({ ...prev, priceSmall: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Spicy level"
              value={newItem.spicyLevel}
              onChange={(e) => setNewItem((prev) => ({ ...prev, spicyLevel: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Allergens (comma separated)"
              value={newItem.allergens}
              onChange={(e) => setNewItem((prev) => ({ ...prev, allergens: e.target.value }))}
              className="border p-2 rounded"
            />
            <textarea
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
              className="border p-2 rounded md:col-span-2"
              rows={2}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={newItem.isAvailable}
                onChange={(e) => setNewItem((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              />
              Available for ordering
            </label>
          </div>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded" onClick={handleAddMenuItem}>
            Add to menu
          </button>
          <datalist id="category-options">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </section>

        <section className="space-y-4">
          {loading.menu ? (
            <p className="text-sm text-gray-500">Loading menu…</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-500">Menu is empty. Add your first item above.</p>
          ) : (
            categories.map((category) => (
              <div key={category} className="bg-white rounded-lg shadow">
                <div className="flex items-center justify-between px-5 py-3 border-b">
                  <h3 className="font-semibold text-orange-700">{category}</h3>
                  <span className="text-xs text-gray-500">
                    {menu[category]?.length || 0} items
                  </span>
                </div>
                <div className="divide-y">
                  {(menu[category] || []).map((item) => {
                    const isEditing = editingMenuItem?.itemId === item.id;
                    return (
                      <div key={item.id} className="px-5 py-4">
                        {isEditing ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              type="text"
                              value={editingMenuItem.formData.category}
                              onChange={(e) => handleEditMenuChange("category", e.target.value)}
                              className="border p-2 rounded"
                              list="category-options"
                            />
                            <input
                              type="text"
                              value={editingMenuItem.formData.name}
                              onChange={(e) => handleEditMenuChange("name", e.target.value)}
                              className="border p-2 rounded"
                            />
                            <input
                              type="number"
                              value={editingMenuItem.formData.priceLarge}
                              onChange={(e) => handleEditMenuChange("priceLarge", e.target.value)}
                              className="border p-2 rounded"
                            />
                            <input
                              type="number"
                              value={editingMenuItem.formData.priceSmall}
                              onChange={(e) => handleEditMenuChange("priceSmall", e.target.value)}
                              className="border p-2 rounded"
                            />
                            <input
                              type="text"
                              value={editingMenuItem.formData.spicyLevel}
                              onChange={(e) => handleEditMenuChange("spicyLevel", e.target.value)}
                              className="border p-2 rounded"
                            />
                            <input
                              type="text"
                              value={editingMenuItem.formData.allergens}
                              onChange={(e) => handleEditMenuChange("allergens", e.target.value)}
                              className="border p-2 rounded"
                            />
                            <textarea
                              value={editingMenuItem.formData.description}
                              onChange={(e) => handleEditMenuChange("description", e.target.value)}
                              className="border p-2 rounded md:col-span-2"
                              rows={2}
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={editingMenuItem.formData.isAvailable}
                                onChange={(e) => handleEditMenuChange("isAvailable", e.target.checked)}
                              />
                              Available
                            </label>
                            <div className="flex gap-2 md:col-span-2">
                              <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleSaveMenuItem}>
                                Save
                              </button>
                              <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => setEditingMenuItem(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{item.name}</h4>
                              <p className="text-xs text-gray-500">
                                {(() => {
                                  const positivePrices = Object.entries(item.price || {})
                                    .map(([portion, value]) => [portion, Number(value)])
                                    .filter(([, value]) => Number.isFinite(value) && value > 0);
                                  if (positivePrices.length === 0) return "No price set";
                                  if (positivePrices.length === 1) {
                                    return `£${positivePrices[0][1].toFixed(2)}`;
                                  }
                                  return positivePrices
                                    .map(([portion, value]) => `${portion.charAt(0).toUpperCase() + portion.slice(1)} £${value.toFixed(2)}`)
                                    .join(" · ");
                                })()}
                              </p>
                              {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                              <div className="flex gap-4 text-xs text-gray-400 mt-1">
                                {item.spicyLevel && <span>🌶️ {item.spicyLevel}</span>}
                                {item.allergens?.length > 0 && <span>⚠️ {item.allergens.join(", ")}</span>}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${item.isAvailable !== false ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}`}
                              >
                                {item.isAvailable !== false ? "Available" : "Hidden"}
                              </span>
                              <button
                                className="text-xs bg-gray-200 px-3 py-1 rounded"
                                onClick={() => handleToggleAvailability(item.id, item.isAvailable === false)}
                              >
                                {item.isAvailable !== false ? "Mark unavailable" : "Mark available"}
                              </button>
                              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleStartEditMenuItem(category, item)}>
                                Edit
                              </button>
                              <button className="text-xs bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleDeleteMenuItem(item.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    );
  }

  async function handleClearMenu() {
    if (masterPassword !== "MasterNepal") {
      notify("Invalid master password", "error");
      return;
    }
    if (!window.confirm("This will delete all menu items. Continue?")) return;
    try {
      const res = await fetch("/api/menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: masterPassword }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Menu cleared", "success");
        fetchMenu();
        setMasterPassword("");
      } else {
        notify(data.error || "Unable to clear menu", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleClearOrders() {
    if (masterPassword !== "MasterNepal") {
      notify("Invalid master password", "error");
      return;
    }
    if (!orderRange.start || !orderRange.end) {
      notify("Select a start and end date", "error");
      return;
    }
    if (!window.confirm(`Delete orders from ${orderRange.start} to ${orderRange.end}?`)) return;

    try {
      const res = await fetch("/api/saveOrder/clear", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: orderRange.start, end: orderRange.end, password: masterPassword }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted ${data.deleted} orders`, "success");
        fetchOrders();
        setMasterPassword("");
      } else {
        notify(data.error || "Unable to clear orders", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  function handleExportMenu() {
    window.open("/api/menu/export", "_blank");
  }

  function handleExportOrders() {
    let url = "/api/saveOrder/export";
    if (orderRange.start && orderRange.end) {
      url += `?start=${orderRange.start}&end=${orderRange.end}`;
    }
    window.open(url, "_blank");
  }

  async function handleImportMenuFromJson() {
    if (masterPassword !== "MasterNepal") {
      notify("Invalid master password", "error");
      return;
    }
    try {
      const res = await fetch("/api/menu/import-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: masterPassword }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Menu imported (${data.created} created, ${data.updated} updated)`, "success");
        fetchMenu();
        setMasterPassword("");
      } else {
        notify(data.error || "Unable to import menu", "error");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }

  function renderUtilities() {
    return (
      <div className="space-y-6">
        <section className="bg-white p-5 rounded-lg shadow space-y-3">
          <h3 className="font-semibold text-orange-700">Exports</h3>
          <div className="flex flex-wrap gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleExportMenu}>
              Download menu CSV
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleExportOrders}>
              Download orders CSV
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Use exports to create backups or analyse data in spreadsheet tools.
          </p>
        </section>

        <section className="bg-white p-5 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-orange-700">Bulk maintenance</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Start date</label>
              <input
                type="date"
                value={orderRange.start}
                onChange={(e) => setOrderRange((prev) => ({ ...prev, start: e.target.value }))}
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">End date</label>
              <input
                type="date"
                value={orderRange.end}
                onChange={(e) => setOrderRange((prev) => ({ ...prev, end: e.target.value }))}
                className="border p-2 rounded w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-gray-500">Master password</label>
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Required for destructive actions"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleClearMenu}>
              Clear entire menu
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleClearOrders}>
              Clear orders in range
            </button>
            <button className="bg-orange-600 text-white px-4 py-2 rounded" onClick={handleImportMenuFromJson}>
              Import menu from JSON
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <StaffGate>
        <div className="min-h-screen bg-[#0b1120] text-slate-100">
          <Navbar />
          <main className="mx-auto mt-16 max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Admin</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Control Centre Sign In</h1>
              <p className="mt-1 text-sm text-slate-300">
                Enter the master password provided by management to continue.
              </p>
            </div>
            <form onSubmit={handleLogin} className="mt-5 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Master password"
                className="w-full rounded-lg border border-white/15 bg-[#0f192d] px-4 py-3 text-sm text-white placeholder:text-slate-500 caret-[#f26b30] focus:border-[#f26b30] focus:outline-none focus:ring-2 focus:ring-[#f26b30]/40"
                required
              />
              <button
                className="w-full rounded-full bg-[#f26b30] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/30 transition hover:bg-[#ff7a3e]"
                type="submit"
              >
                Log in
              </button>
            </form>
            <button
              className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-[#f26b30]"
              onClick={() => setResetMode((prev) => !prev)}
            >
              {resetMode ? "Hide password reset" : "Reset password"}
            </button>
            {resetMode && (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-lg border border-white/15 bg-[#0f192d] px-4 py-3 text-sm text-white placeholder:text-slate-500 caret-[#f26b30] focus:border-[#f26b30] focus:outline-none focus:ring-2 focus:ring-[#f26b30]/40"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-white/15 bg-[#0f192d] px-4 py-3 text-sm text-white placeholder:text-slate-500 caret-[#f26b30] focus:border-[#f26b30] focus:outline-none focus:ring-2 focus:ring-[#f26b30]/40"
                  required
                />
                <div className="flex gap-2">
                  <button className="flex-1 rounded-full bg-[#f26b30] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/30 transition hover:bg-[#ff7a3e]" type="submit">
                    Update password
                  </button>
                  <button
                    className="flex-1 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#f26b30] hover:text-white"
                    type="button"
                    onClick={() => setResetMode(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {message && message.type === "error" && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {message.text}
              </div>
            )}
          </main>
        </div>
      </StaffGate>
    );
  }

  return (
    <StaffGate>
      <div className="min-h-screen bg-[#0b1120] text-slate-100">
        <Navbar />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Control Centre</h1>
            <p className="text-sm text-slate-300">
              Monitor performance, manage menu items, and maintain your order history from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
              onClick={fetchMenu}
              disabled={loading.menu}
            >
              {loading.menu ? "Refreshing menu…" : "Refresh menu"}
            </button>
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
              onClick={fetchOrders}
              disabled={loading.orders}
            >
              {loading.orders ? "Refreshing orders…" : "Refresh orders"}
            </button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-full border transition ${
                activeTab === tab.id
                  ? "border-[#f26b30] bg-[#f26b30]/20 text-white"
                  : "border-white/15 text-slate-300 hover:border-[#f26b30]"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "menu" && renderMenuManager()}
        {activeTab === "utilities" && renderUtilities()}
        </main>
      </div>
    </StaffGate>
  );
}

function StatCard({ title, value, subtitle, accent = "bg-orange-600" }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className={`inline-block w-2 h-2 rounded-full ${accent}`} />
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}
