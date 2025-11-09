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
  const [newItem, setNewItem] = useState({ name: "", price: "", description: "", portion: "standard", spicyLevel: "", allergens: "", isAvailable: true });
  const [editOrderId, setEditOrderId] = useState("");
  const [editOrder, setEditOrder] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState("");

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
    if (!selectedCategory || !newItem.name || !newItem.price) return setMessage("Fill all fields.");
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: selectedCategory, item: newItem })
    });
    const data = await res.json();
    setMessage(data.success ? "Item added!" : data.error);
  }

  // Modify menu item (not implemented: would need item id and edit form)

  // Delete receipt
  async function handleDeleteOrder() {
    if (!deleteOrderId) return setMessage("Enter order ID to delete.");
    const res = await fetch(`/api/saveOrder?orderId=${deleteOrderId}`, { method: "DELETE" });
    const data = await res.json();
    setMessage(data.success ? "Order deleted!" : data.error);
  }

  // Modify receipt (not implemented: would need edit form)

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
          <input type="number" placeholder="Price" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className="border p-1 rounded mb-2" />
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
        {message && <div className="mt-4 text-green-700 font-semibold">{message}</div>}
      </div>
    </div>
  );
}
