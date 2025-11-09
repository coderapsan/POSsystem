import React, { useState, useEffect } from "react";
import Navbar from "../components/common/Navbar";

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [menu, setMenu] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newItem, setNewItem] = useState({ name: "", priceLarge: "", priceSmall: "", description: "", portion: "standard", spicyLevel: "", allergens: "", isAvailable: true });
  const [editOrderId, setEditOrderId] = useState("");
  const [editOrder, setEditOrder] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState("");
  const [clearPassword, setClearPassword] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [orderClearPassword, setOrderClearPassword] = useState("");
  const [showOrderClearModal, setShowOrderClearModal] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 20;
  const paginatedOrders = orders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage);

  useEffect(() => {
    if (!authenticated) return;
    async function fetchMenu() {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenu(data.menu || {});
    }
    async function fetchOrders() {
      const res = await fetch("/api/saveOrder", { method: "GET" });
      const data = await res.json();
      setOrders(data.orders || []);
    }
    fetchMenu();
    fetchOrders();
  }, [authenticated]);

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      setAuthenticated(true);
      setMessage("");
    } else {
      setMessage("Invalid password");
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const res = await fetch("/api/admin-auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    setMessage(data.success ? "Password updated!" : data.error);
    if (data.success) setResetMode(false);
  }

  if (!authenticated) {
    return (
      <div>
        <Navbar />
        <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded shadow">
          <h2 className="text-xl font-bold mb-4 text-orange-700">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Enter admin password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 rounded w-full" />
            <button className="bg-orange-600 text-white px-4 py-2 rounded w-full" type="submit">Login</button>
          </form>
          <button className="mt-4 text-blue-600 underline" onClick={() => setResetMode(true)}>Reset Password</button>
          {resetMode && (
            <form onSubmit={handleResetPassword} className="space-y-2 mt-4">
              <input type="password" placeholder="Old password " value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="border p-2 rounded w-full" />
              <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border p-2 rounded w-full" />
              <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" type="submit">Update Password</button>
              <button className="mt-2 text-gray-600 underline" type="button" onClick={() => setResetMode(false)}>Cancel</button>
            </form>
          )}
          {message && <div className="mt-4 text-red-700 font-semibold">{message}</div>}
        </div>
      </div>
    );
  }

  // Add menu item
  async function handleAddMenuItem() {
    if (!selectedCategory || !newItem.name || (!newItem.priceLarge && !newItem.priceSmall)) return setMessage("Fill all fields.");
    const itemToSend = {
      name: newItem.name,
      description: newItem.description,
      portion: newItem.portion,
      spicyLevel: newItem.spicyLevel,
      allergens: newItem.allergens,
      isAvailable: newItem.isAvailable,
      price: {
        large: Number(newItem.priceLarge) || 0,
        small: Number(newItem.priceSmall) || 0
      }
    };
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: selectedCategory, item: itemToSend })
    });
    const data = await res.json();
    setMessage(data.success ? "Item added!" : data.error);
    if (data.success) {
      setNewItem({ name: "", priceLarge: "", priceSmall: "", description: "", portion: "standard", spicyLevel: "", allergens: "", isAvailable: true });
      // Refresh menu
      const resMenu = await fetch("/api/menu");
      const dataMenu = await resMenu.json();
      setMenu(dataMenu.menu || {});
    }
  }

  // Modify menu item
  async function handleEditMenuItem(category, itemId, field, value) {
    const res = await fetch(`/api/menu`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, itemId, field, value })
    });
    const data = await res.json();
    setMessage(data.success ? "Item updated!" : data.error);
    if (data.success) {
      // Refresh menu
      const resMenu = await fetch("/api/menu");
      const dataMenu = await resMenu.json();
      setMenu(dataMenu.menu || {});
    }
  }

  // Delete receipt
  async function handleDeleteOrder() {
    if (!deleteOrderId) return setMessage("Enter order ID to delete.");
    const res = await fetch(`/api/saveOrder?orderId=${deleteOrderId}`, { method: "DELETE" });
    const data = await res.json();
    setMessage(data.success ? "Order deleted!" : data.error);
  }

  // Modify receipt (not implemented: would need edit form)

  async function handleClearMenu() {
    if (clearPassword !== "MasterNepal") return setMessage("Invalid password for clearing menu.");
    const res = await fetch("/api/menu", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: clearPassword })
    });
    const data = await res.json();
    setMessage(data.success ? "Menu cleared!" : data.error);
    setShowClearModal(false);
    setClearPassword("");
    if (data.success) {
      // Refresh menu
      const resMenu = await fetch("/api/menu");
      const dataMenu = await resMenu.json();
      setMenu(dataMenu.menu || {});
    }
  }

  function handleExportMenu() {
    window.open("/api/menu/export", "_blank");
  }

  function handleExportOrders() {
    let url = "/api/saveOrder/export";
    if (orderStartDate && orderEndDate) {
      url += `?start=${orderStartDate}&end=${orderEndDate}`;
    }
    window.open(url, "_blank");
  }

  async function handleClearOrders() {
    if (orderClearPassword !== "MasterNepal") return setMessage("Invalid password for clearing orders.");
    if (!orderStartDate || !orderEndDate) return setMessage("Select start and end date.");
    const res = await fetch("/api/saveOrder/clear", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: orderStartDate, end: orderEndDate, password: orderClearPassword })
    });
    const data = await res.json();
    setMessage(data.success ? `Orders cleared! Deleted: ${data.deleted}` : data.error);
    setShowOrderClearModal(false);
    setOrderClearPassword("");
    if (data.success) {
      // Refresh orders
      const resOrders = await fetch("/api/saveOrder", { method: "GET" });
      const dataOrders = await resOrders.json();
      setOrders(dataOrders.orders || []);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-orange-700">Admin Panel</h2>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Add Menu Item</h3>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border p-1 rounded mb-2">
            <option value="">Select Category</option>
            {Object.keys(menu).map(cat => <option key={cat}>{cat}</option>)}
          </select>
          <input type="text" placeholder="Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="border p-1 rounded mb-2" />
          <input type="number" placeholder="Large Price" value={newItem.priceLarge} onChange={e => setNewItem({ ...newItem, priceLarge: e.target.value })} className="border p-1 rounded mb-2" />
          <input type="number" placeholder="Small Price" value={newItem.priceSmall} onChange={e => setNewItem({ ...newItem, priceSmall: e.target.value })} className="border p-1 rounded mb-2" />
          <input type="text" placeholder="Description" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="border p-1 rounded mb-2" />
          <button className="bg-orange-600 text-white px-4 py-2 rounded" onClick={handleAddMenuItem}>Add Item</button>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Delete Receipt</h3>
          <input type="text" placeholder="Order ID" value={deleteOrderId} onChange={e => setDeleteOrderId(e.target.value)} className="border p-1 rounded mb-2" />
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleDeleteOrder}>Delete</button>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Modify Receipt (Coming Soon)</h3>
          <input type="text" placeholder="Order ID" value={editOrderId} onChange={e => setEditOrderId(e.target.value)} className="border p-1 rounded mb-2" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled>Modify</button>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Edit Menu Item</h3>
          {Object.entries(menu).map(([cat, items]) => (
            <div key={cat} className="mb-4 border rounded p-2">
              <h4 className="font-bold text-orange-700 mb-2">{cat}</h4>
              {items.map(item => (
                <EditMenuItemForm key={item.id} category={cat} item={item} onSave={handleEditMenuItem} />
              ))}
            </div>
          ))}
        </div>
        <div className="mb-6 flex gap-4 items-center">
          <button className="bg-red-700 text-white px-4 py-2 rounded" onClick={() => setShowClearModal(true)}>Clear Menu Table</button>
          <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={handleExportMenu}>Export Menu to CSV</button>
        </div>
        <div className="mb-6 flex gap-4 items-center">
          <h3 className="font-semibold mb-2">Order History Backup & Cleaning</h3>
          <input type="date" value={orderStartDate} onChange={e => setOrderStartDate(e.target.value)} className="border p-1 rounded" />
          <span>to</span>
          <input type="date" value={orderEndDate} onChange={e => setOrderEndDate(e.target.value)} className="border p-1 rounded" />
          <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={handleExportOrders}>Export Orders to CSV</button>
          <button className="bg-red-700 text-white px-4 py-2 rounded" onClick={() => setShowOrderClearModal(true)}>Clear Orders in Range</button>
        </div>
        <div className="mb-8">
          <h3 className="font-semibold mb-2">Order History (View Transactions)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Order ID</th>
                  <th className="border px-2 py-1">Customer Name</th>
                  <th className="border px-2 py-1">Phone</th>
                  <th className="border px-2 py-1">Address</th>
                  <th className="border px-2 py-1">Items</th>
                  <th className="border px-2 py-1">Total</th>
                  <th className="border px-2 py-1">Created At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(order => (
                  <tr key={order.orderId} className="border-b">
                    <td className="border px-2 py-1">{order.orderId}</td>
                    <td className="border px-2 py-1">{order.customerName}</td>
                    <td className="border px-2 py-1">{order.phone}</td>
                    <td className="border px-2 py-1">{order.address}</td>
                    <td className="border px-2 py-1">{Array.isArray(order.items) ? order.items.map(i => i.name).join(", ") : ""}</td>
                    <td className="border px-2 py-1">£{order.total}</td>
                    <td className="border px-2 py-1">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-2">
            <button className="px-3 py-1 bg-gray-200 rounded" disabled={orderPage === 1} onClick={() => setOrderPage(orderPage - 1)}>Prev</button>
            <span>Page {orderPage} of {Math.ceil(orders.length / ordersPerPage)}</span>
            <button className="px-3 py-1 bg-gray-200 rounded" disabled={orderPage * ordersPerPage >= orders.length} onClick={() => setOrderPage(orderPage + 1)}>Next</button>
          </div>
        </div>
        {showClearModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow max-w-sm w-full">
              <h3 className="font-bold mb-2 text-red-700">Confirm Clear Menu Table</h3>
              <p className="mb-2">This will delete all menu items. Enter master password to confirm:</p>
              <input type="password" placeholder="Master Password" value={clearPassword} onChange={e => setClearPassword(e.target.value)} className="border p-2 rounded w-full mb-2" />
              <div className="flex gap-2">
                <button className="bg-red-700 text-white px-4 py-2 rounded" onClick={handleClearMenu}>Confirm</button>
                <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setShowClearModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {showOrderClearModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow max-w-sm w-full">
              <h3 className="font-bold mb-2 text-red-700">Confirm Clear Orders</h3>
              <p className="mb-2">This will delete all orders in the selected date range. Enter master password to confirm:</p>
              <input type="password" placeholder="Master Password" value={orderClearPassword} onChange={e => setOrderClearPassword(e.target.value)} className="border p-2 rounded w-full mb-2" />
              <div className="flex gap-2">
                <button className="bg-red-700 text-white px-4 py-2 rounded" onClick={handleClearOrders}>Confirm</button>
                <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setShowOrderClearModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {message && <div className="mt-4 text-green-700 font-semibold">{message}</div>}
      </div>
    </div>
  );
}

// Helper component for editing menu item
function EditMenuItemForm({ category, item, onSave }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [priceLarge, setPriceLarge] = useState(item.price.large);
  const [priceSmall, setPriceSmall] = useState(item.price.small);

  function handleSave() {
    onSave(category, item.id, "name", name);
    onSave(category, item.id, "price.large", priceLarge);
    onSave(category, item.id, "price.small", priceSmall);
    setEditing(false);
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
      {editing ? (
        <>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="border p-1 rounded w-32" />
          <input type="number" value={priceLarge} onChange={e => setPriceLarge(e.target.value)} className="border p-1 rounded w-20" />
          <input type="number" value={priceSmall} onChange={e => setPriceSmall(e.target.value)} className="border p-1 rounded w-20" />
          <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={handleSave}>Save</button>
          <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <span className="font-semibold">{item.name}</span>
          <span>Large: £{item.price.large}</span>
          <span>Small: £{item.price.small}</span>
          <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
}
