import React, { useState, useEffect } from "react";
import menuData from "../data/momos.json";
import { ShoppingCart } from "lucide-react";

export default function OrderPage() {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Load saved orders
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(saved);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const addToCart = (item, portionSize) => {
    if (!portionSize) return;
    const newItem = {
      id: item.id,
      name: item.name,
      portion: portionSize,
      price: item.price[portionSize],
      timestamp: new Date().toISOString(),
    };
    setCart((prev) => [...prev, newItem]);
  };

  const removeItem = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const saveOrder = () => {
    if (cart.length === 0) return alert("No items in cart!");

    const newOrder = {
      orderId: `TMM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: cart,
      total: cart.reduce((sum, i) => sum + i.price, 0),
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));

    setCart([]);
    alert(`Order ${newOrder.orderId} saved successfully!`);
  };

  const renderItems = (items) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl shadow-md p-4 border hover:shadow-lg transition-all"
        >
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <p className="text-sm text-gray-600">{item.description}</p>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>🌶️ {item.spicyLevel}</span>
            <span>⚠️ {item.allergens.join(", ")}</span>
          </div>
          <select
            className="mt-3 border rounded p-2 text-sm w-full"
            defaultValue=""
            onChange={(e) => addToCart(item, e.target.value)}
          >
            <option value="" disabled>
              Select Portion
            </option>
            {Object.entries(item.price)
              .filter(([_, price]) => price > 0)
              .map(([portion, price]) => (
                <option key={portion} value={portion}>
                  {portion} - £{price.toFixed(2)}
                </option>
              ))}
          </select>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 relative pb-24">
      <header className="sticky top-0 bg-white shadow-sm py-4 px-6 flex justify-center">
        <h1 className="text-2xl font-bold text-orange-600">
          🥟 The MoMos - POS
        </h1>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {Object.keys(menuData).map((category) => (
          <div key={category} className="mb-4">
            {/* Category Header */}
            <div
              onClick={() => toggleCategory(category)}
              className={`cursor-pointer p-4 rounded-xl shadow-sm border transition-all flex justify-between items-center ${
                expandedCategory === category
                  ? "bg-orange-100 border-orange-300"
                  : "bg-white hover:bg-orange-50"
              }`}
            >
              <h2 className="text-lg font-semibold text-orange-700">
                {category}
              </h2>
              <span className="text-sm text-gray-500">
                {expandedCategory === category ? "▲" : "▼"}
              </span>
            </div>

            {/* Expanded Category Items */}
            {expandedCategory === category && (
              <div className="mt-2 ml-2">
                {category === "Vegetables" ? (
                  <>
                    <h3 className="font-semibold mt-3">Mains</h3>
                    {renderItems(menuData.Vegetables.Mains)}
                    <h3 className="font-semibold mt-5">Sides</h3>
                    {renderItems(menuData.Vegetables.Sides)}
                  </>
                ) : (
                  renderItems(menuData[category])
                )}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* 🛒 Floating Cart Icon (Mobile/Tablet) */}
      <button
        onClick={() => setShowCart(!showCart)}
        className="fixed bottom-6 right-6 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-all md:hidden"
      >
        <ShoppingCart size={24} />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        )}
      </button>

      {/* 🧾 Cart Drawer */}
      <div
        className={`fixed md:static bottom-0 right-0 w-full md:w-1/3 bg-white shadow-xl border-t md:border-l p-4 transition-transform duration-300 ${
          showCart ? "translate-y-0" : "translate-y-full md:translate-y-0"
        }`}
      >
        <h3 className="text-xl font-semibold text-orange-700 mb-3">
          🛒 Cart
        </h3>
        {cart.length === 0 ? (
          <p className="text-gray-500">No items added yet.</p>
        ) : (
          <>
            <ul className="divide-y">
              {cart.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>{" "}
                    <span className="text-xs text-gray-500">
                      ({item.portion})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>£{item.price.toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between font-semibold">
              <span>Total:</span>
              <span>
                £{cart.reduce((sum, i) => sum + i.price, 0).toFixed(2)}
              </span>
            </div>
            <button
              onClick={saveOrder}
              className="mt-4 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-all"
            >
              Complete Order
            </button>
          </>
        )}
      </div>
    </div>
  );
}
