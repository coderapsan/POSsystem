import React, { useCallback, useEffect, useState } from "react";

export default function CustomerOrder() {
  const [menu, setMenu] = useState({});
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", postalCode: "" });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) {
        setMenu(data.menu || {});
      } else {
        setMenuError(data.error || "Unable to load menu");
      }
    } catch (error) {
      setMenuError(error.message);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const getValidPortions = (item) =>
    Object.entries(item.price || {})
      .map(([portion, value]) => [portion, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value > 0);

  const resolvePrice = (item, portionKey = "") => {
    const valid = getValidPortions(item);
    if (portionKey) {
      const match = valid.find(([portion]) => portion === portionKey);
      if (match) return match[1];
    }
    return valid.length > 0 ? valid[0][1] : 0;
  };

  const formatPortionLabel = (portion) => (portion ? portion.charAt(0).toUpperCase() + portion.slice(1) : "");

  const addToCart = (item, portion = "") => {
    const normalizedPortion = portion || "";
    const existingItem = cart.find((c) => c.id === item.id && c.portion === normalizedPortion);
    if (existingItem) {
      setCart(cart.map((c) => (c.id === item.id && c.portion === normalizedPortion ? { ...c, quantity: c.quantity + 1 } : c)));
      return;
    }
    setCart([
      ...cart,
      {
        ...item,
        portion: normalizedPortion,
        quantity: 1,
        price: resolvePrice(item, normalizedPortion),
      },
    ]);
  };

  const renderCategory = (categoryName, items) => {
    const availableItems = (items || []).filter((item) => item.isAvailable !== false);
    if (availableItems.length === 0) return null;

    return (
      <div key={categoryName} className="mb-3">
        <h4 className="font-bold text-lg mb-1">{categoryName}</h4>
        {availableItems.map((item) => {
          const options = getValidPortions(item);
          return (
            <div key={item.id} className="p-2 border rounded mb-1">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="font-semibold block">{item.name}</span>
                  {item.description && <span className="text-xs text-gray-500 block">{item.description}</span>}
                  {item.spicyLevel && <span className="text-xs text-gray-400 mr-2">🌶️ {item.spicyLevel}</span>}
                  {item.allergens?.length > 0 && <span className="text-xs text-gray-400">⚠️ {item.allergens.join(", ")}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.length <= 1 ? (
                    <button className="bg-orange-600 text-white px-2 py-1 rounded" onClick={() => addToCart(item, options[0]?.[0] || "")}>
                      Add £{(options[0]?.[1] ?? resolvePrice(item, "")).toFixed(2)}
                    </button>
                  ) : (
                    options.map(([portion, value]) => (
                      <button
                        key={portion}
                        className="bg-orange-600 text-white px-2 py-1 rounded"
                        onClick={() => addToCart(item, portion)}
                      >
                        {formatPortionLabel(portion)} £{value.toFixed(2)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const updateQuantity = (item, delta) => {
    setCart(cart.map(c => c.id === item.id && c.portion === item.portion ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return alert("No items in the order!");
    const orderData = {
      orderId: Math.floor(10000 + Math.random() * 90000).toString(),
      timestamp: new Date().toLocaleString(),
      customer,
      paymentMethod,
      items: cart,
      total: subtotal,
      source: "customer",
      status: "pending"
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
            {menuLoading ? (
              <p className="text-gray-500">Loading menu…</p>
            ) : menuError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
                <p className="text-sm mb-2">{menuError}</p>
                <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={loadMenu}>
                  Try again
                </button>
              </div>
            ) : Object.keys(menu).length === 0 ? (
              <p className="text-gray-500">Menu is not available right now.</p>
            ) : (
              Object.entries(menu).map(([catName, catData]) =>
                Array.isArray(catData)
                  ? renderCategory(catName, catData)
                  : Object.entries(catData || {}).map(([subCat, items]) =>
                      renderCategory(`${catName} - ${subCat}`, items)
                    )
              )
            )}
          </div>
          <div className="mb-4 p-3 bg-white rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-orange-700">Your Cart</h3>
            {cart.length === 0 ? <p className="text-gray-400">Cart is empty</p> : (
              cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b py-2">
                  <div>
                    <span>
                      {item.name}
                      {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                    </span>
                    <span className="ml-2 text-gray-500">£{Number(item.price || 0).toFixed(2)} × {item.quantity}</span>
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
