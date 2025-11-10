import React, { useState, useEffect } from "react";
import menuData from "../data/momos.json";

export default function CustomerOrder() {
  const [menu, setMenu] = useState({});
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", postalCode: "" });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    setMenu(menuData);
  }, []);

  const addToCart = (item, portion = "large") => {
    const existingItem = cart.find(c => c.id === item.id && c.portion === portion);
    if (existingItem) {
      setCart(cart.map(c => c.id === item.id && c.portion === portion ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, portion, quantity: 1, price: item.price[portion] || Object.values(item.price)[0] }]);
    }
  };

  const updateQuantity = (item, delta) => {
    setCart(cart.map(c => c.id === item.id && c.portion === item.portion ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return alert("No items in the order!");
    const orderData = {
      orderId: Math.floor(10000 + Math.random() * 90000).toString(),
      timestamp: new Date().toLocaleString(),
      customer,
      paymentMethod,
      items: cart,
      total: subtotal,
      source: "customer"
    };
    try {
      const response = await fetch("/api/saveOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      const result = await response.json();
      if (result.success) {
        setOrderPlaced(true);
        setOrderId(orderData.orderId);
        setCart([]);
      } else {
        alert("Failed to place order: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      alert("Error placing order: " + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-orange-700 mb-3">Order Online</h2>
      {orderPlaced ? (
        <div className="bg-green-100 p-4 rounded text-center">
          <h3 className="text-lg font-bold">Order Placed!</h3>
          <p>Your order #{orderId} has been received. Thank you!</p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2 text-orange-700">Your Details</h3>
            <input placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="border p-1 rounded w-full mb-2" />
            <input placeholder="Phone" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} className="border p-1 rounded w-full mb-2" />
            <input placeholder="Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="border p-1 rounded w-full mb-2" />
            <input placeholder="Postal Code" value={customer.postalCode} onChange={e => setCustomer({ ...customer, postalCode: e.target.value })} className="border p-1 rounded w-full mb-2" />
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="border p-1 rounded w-full">
              <option>Cash</option>
              <option>Card</option>
              <option>Contactless Card</option>
            </select>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-orange-700">Menu</h3>
            {Object.entries(menu).map(([catName, items]) => (
              <div key={catName} className="mb-2">
                <h4 className="font-bold text-lg mb-1">{catName}</h4>
                {items.map(item => (
                  <div key={item.id} className="p-2 border rounded mb-1 flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{item.name}</span>
                      <span className="ml-2 text-gray-500">£{Object.values(item.price)[0]}</span>
                    </div>
                    <button className="bg-orange-600 text-white px-2 py-1 rounded" onClick={() => addToCart(item)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mb-4 p-3 bg-white rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-orange-700">Your Cart</h3>
            {cart.length === 0 ? <p className="text-gray-400">Cart is empty</p> : (
              cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b py-2">
                  <div>
                    <span>{item.name} ({item.portion})</span>
                    <span className="ml-2 text-gray-500">£{item.price.toFixed(2)} × {item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="bg-gray-200 px-2 rounded" onClick={() => updateQuantity(item, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button className="bg-orange-600 text-white px-2 rounded" onClick={() => updateQuantity(item, 1)}>+</button>
                  </div>
                </div>
              ))
            )}
            <p className="font-bold text-right mt-2">Total: £{subtotal.toFixed(2)}</p>
            <button className="w-full bg-orange-600 text-white py-2 rounded mt-2" onClick={handleSubmitOrder}>Place Order</button>
          </div>
        </>
      )}
    </div>
  );
}
