import React, { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import menuData from "../data/momos.json";
import Navbar from "../components/common/Navbar";

export default function Order() {
  const [menu, setMenu] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isPaid, setIsPaid] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [discountPercent, setDiscountPercent] = useState("");

  const [orderType, setOrderType] = useState("Dine In");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    postalCode: "",
  });

  const [generalItemName, setGeneralItemName] = useState("");
  const [generalItemPrice, setGeneralItemPrice] = useState("");

  // Load menu data
  useEffect(() => {
    setMenu(menuData);
  }, []);

  const handleCategoryClick = (category) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const addToCart = (item, portion = "large") => {
    const existingItem = cart.find(
      (c) => c.id === item.id && c.portion === portion
    );
    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === item.id && c.portion === portion
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...item,
          portion,
          quantity: 1,
          price:
            item.price[portion] && item.price[portion] > 0
              ? item.price[portion]
              : Object.values(item.price || {})
                  .map(Number)
                  .filter((p) => !isNaN(p) && p > 0)[0] || 0,
        },
      ]);
    }
  };

  const updateQuantity = (item, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === item.id && c.portion === item.portion
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const handleSelectPortion = (item) => {
    if (item.price.small && item.price.large && item.price.small > 0) {
      setSelectedItem(item);
    } else {
      addToCart(item, "large");
    }
  };

  const handlePortionChoice = (portion) => {
    addToCart(selectedItem, portion);
    setSelectedItem(null);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountValue =
    discountPercent && !isNaN(discountPercent)
      ? (subtotal * Number(discountPercent)) / 100
      : 0;

  const total = subtotal - discountValue;

  function generateOrderId() {
    // Generates a random 5-digit number as a string, padded if needed
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return alert("No items in the order!");

    const orderId = generateOrderId();
    const orderData = {
      orderId,
      orderNumber: orderId,
      timestamp: new Date().toLocaleString(),
      orderType,
      customer,
      customerName: customer.name,
      paymentMethod,
      isPaid,
      discountPercent,
      items: cart,
      total,
    };

    try {
      const response = await fetch("/api/saveOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();
      if (result.success) {
        setOrderNumber(orderId);
        setShowReceipt(true);
        console.log("🧾 Order saved:", result);
      } else {
        alert("Failed to save order: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      alert("Error saving order: " + error.message);
    }
  };

  const handlePrintReceipt = () => {
    const receiptWindow = window.open("", "_blank");
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${orderNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: monospace;
              padding: 8px;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              margin-bottom: 4px;
              font-size: 18px;
            }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .bold { font-weight: bold; }
            .total { font-size: 14px; font-weight: bold; text-align: right; }
            .order-number {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <h1>The MoMos</h1>
          <div class="center">340 Kingston Road, SW20 8LR</div>
          <div class="center">Tel: 0208 123 4567</div>
          <div class="line"></div>
          <div class="order-number">#${orderNumber}</div>
          <div>Date: ${new Date().toLocaleString()}</div>
          <div>Type: ${orderType}</div>
          ${
            customer.name || customer.phone
              ? `<div class="line"></div>
                 <div><strong>Customer Info:</strong></div>
                 <div>Name: ${customer.name || "-"}</div>
                 <div>Phone: ${customer.phone || "-"}</div>
                 <div>Address: ${customer.address || "-"}</div>
                 <div>Postal: ${customer.postalCode || "-"}</div>`
              : ""
          }
          <div class="line"></div>
          ${cart
            .map(
              (item) =>
                `${item.quantity} × ${item.name} (${item.portion}) - £${(
                  item.price * item.quantity
                ).toFixed(2)}`
            )
            .join("<br/>")}
          <div class="line"></div>
          <div>Subtotal: £${subtotal.toFixed(2)}</div>
          ${
            discountValue > 0
              ? `<div>Discount (${discountPercent}%): -£${discountValue.toFixed(
                  2
                )}</div>`
              : ""
          }
          <div class="total">Total: £${total.toFixed(2)}</div>
          <div class="line"></div>
          <div>Payment: ${paymentMethod}</div>
          <div>Status: ${isPaid ? "Paid" : "Pending Cash"}</div>
          <div class="line"></div>
          <div class="center">Thank You! Visit Again</div>
        </body>
      </html>`;

    receiptWindow.document.write(receiptContent);
    receiptWindow.print();
    receiptWindow.close();

    // Reset for next order
    setCart([]);
    setCustomer({ name: "", phone: "", address: "", postalCode: "" });
    setDiscountPercent("");
    setIsPaid(false);
    setShowReceipt(false);
  };

  const handleAddGeneralItem = () => {
    const name = generalItemName.trim() || "General Item";
    const price = parseFloat(generalItemPrice);
    if (!price || price <= 0) return alert("Enter a valid price for the item.");
    setCart([
      ...cart,
      {
        id: `general-${Date.now()}`,
        name,
        portion: "custom",
        quantity: 1,
        price,
        description: "Custom item added by user",
        spicyLevel: "",
        allergens: [],
        isAvailable: true,
      },
    ]);
    setGeneralItemName("");
    setGeneralItemPrice("");
  };

  const renderItems = (items) =>
    items.map((item) => (
      <div
        key={item.id}
        className="p-3 border rounded-lg shadow-sm bg-white mb-2 transition-all duration-200 hover:shadow-md"
        onClick={() => handleSelectPortion(item)}
      >
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{item.name}</h4>
          <span className="text-orange-600 font-bold">
            £
            {(() => {
              const validPrices = Object.values(item.price || {})
                .map(Number)
                .filter((p) => !isNaN(p) && p > 0);
              const price = validPrices.length > 0 ? validPrices[0] : 0;
              return price.toFixed(2);
            })()}
          </span>
        </div>
        <p className="text-sm text-gray-500">{item.description}</p>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>🌶️ {item.spicyLevel}</span>
          <span>⚠️ {(item.allergens || []).join(", ") || "No allergens"}</span>
        </div>
      </div>
    ));

  const renderCategory = (categoryName, items) => (
    <div key={categoryName} className="mb-4">
      <button
        className={`w-full text-left font-bold p-3 rounded-lg ${
          expandedCategory === categoryName
            ? "bg-orange-600 text-white"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
        onClick={() => handleCategoryClick(categoryName)}
      >
        {categoryName}
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          expandedCategory === categoryName ? "max-h-[1000px]" : "max-h-0"
        }`}
      >
        <div className="p-3">{renderItems(items)}</div>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Add order history button */}
        <div className="mb-4">
          <button
            className="bg-orange-700 text-white px-4 py-2 rounded shadow"
            onClick={() => (window.location.href = "/order-history")}
          >
            View Order History
          </button>
        </div>
        {/* Left: Menu */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-2xl font-bold text-orange-700 mb-3">
            The MoMos POS System
          </h2>

          {/* Customer Info */}
          <div className="p-3 mb-4 bg-gray-50 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2 text-orange-700">
              Order Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="border p-1 rounded"
              >
                <option>Dine In</option>
                <option>Take Away</option>
                <option>Delivery</option>
              </select>
              <input
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                className="border p-1 rounded"
              />
              <input
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                className="border p-1 rounded"
              />
              <input
                placeholder="Address Line 1"
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
                className="border p-1 rounded"
              />
              <input
                placeholder="Postal Code"
                value={customer.postalCode}
                onChange={(e) =>
                  setCustomer({ ...customer, postalCode: e.target.value })
                }
                className="border p-1 rounded"
              />
            </div>
          </div>

          {/* Menu Categories */}
          {Object.entries(menu).map(([catName, catData]) =>
            Array.isArray(catData)
              ? renderCategory(catName, catData)
              : Object.entries(catData).map(([subCat, items]) =>
                  renderCategory(`${catName} - ${subCat}`, items)
                )
          )}
        </div>

        {/* Right: Cart - static on desktop */}
        <div
          className={`md:sticky md:top-20 fixed bottom-0 right-0 w-full md:w-1/3 bg-white border-t md:border rounded-t-2xl md:rounded-lg shadow-xl transition-all duration-300 ${
            showCart ? "translate-y-0" : "translate-y-[85%] md:translate-y-0"
          }`}
          style={{ maxHeight: "90vh", overflowY: "auto" }}
        >
          <div className="flex justify-between items-center p-3 bg-orange-600 text-white rounded-t-2xl md:rounded-t-lg">
            <h3 className="font-bold">Cart</h3>
            <button
              className="md:hidden bg-white text-orange-600 rounded-full px-2"
              onClick={() => setShowCart(!showCart)}
            >
              {showCart ? "✕" : "🛒"}
            </button>
          </div>

          <div className="p-3 max-h-[250px] overflow-y-auto">
            {/* General item input */}
            <div className="mb-3 flex gap-2 items-center">
              <input
                type="text"
                value={generalItemName}
                onChange={(e) => setGeneralItemName(e.target.value)}
                placeholder="General Item Name"
                className="border p-1 rounded w-1/2"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={generalItemPrice}
                onChange={(e) => setGeneralItemPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Price (£)"
                className="border p-1 rounded w-1/4 text-right"
              />
              <button
                className="bg-orange-600 text-white px-2 py-1 rounded"
                onClick={handleAddGeneralItem}
              >
                Add
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm">Cart is empty</p>
            ) : (
              cart.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {item.name} ({item.portion})
                    </p>
                    <p className="text-xs text-gray-500">
                      £{item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-gray-200 px-2 rounded"
                      onClick={() => updateQuantity(item, -1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="bg-orange-600 text-white px-2 rounded"
                      onClick={() => updateQuantity(item, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-3 border-t bg-gray-50 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  placeholder="Enter %"
                  onChange={(e) =>
                    setDiscountPercent(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="border w-20 p-1 rounded text-right"
                />
              </div>

              <p className="font-semibold text-right">
                Total: £{total.toFixed(2)}
              </p>

              <div className="flex justify-between items-center my-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="border p-1 rounded"
                >
                  <option>Cash</option>
                  <option>Card</option>
                </select>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={() => setIsPaid(!isPaid)}
                  />
                  Paid
                </label>
              </div>

              <button
                className="w-full bg-orange-600 text-white py-2 rounded"
                onClick={handleSubmitOrder}
              >
                Submit Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Portion Popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="font-bold mb-2">
              Choose Portion for {selectedItem.name}
            </h3>
            <div className="flex gap-4 justify-center">
              {Object.entries(selectedItem.price).map(
                ([portion, price]) =>
                  price > 0 && (
                    <button
                      key={portion}
                      onClick={() => handlePortionChoice(portion)}
                      className="bg-orange-600 text-white px-4 py-2 rounded"
                    >
                      {portion} (£{price.toFixed(2)})
                    </button>
                  )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Popup */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 text-center">
            <h3 className="font-bold text-xl mb-2">Receipt</h3>
            <p className="text-lg font-bold text-orange-700">#{orderNumber}</p>
            <p>Date: {new Date().toLocaleString()}</p>
            <p>Type: {orderType}</p>
            {customer.name && <p>Name: {customer.name}</p>}
            {customer.phone && <p>Phone: {customer.phone}</p>}
            {customer.address && <p>Address: {customer.address}</p>}
            {customer.postalCode && <p>Postal Code: {customer.postalCode}</p>}
            <div className="border-t my-2"></div>
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.name} ({item.portion})
                </span>
                <span>£{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t my-2"></div>
            <p>Subtotal: £{subtotal.toFixed(2)}</p>
            {discountValue > 0 && (
              <p>Discount: £{discountValue.toFixed(2)}</p>
            )}
            <p className="font-bold">Total: £{total.toFixed(2)}</p>
            <p>Payment: {paymentMethod}</p>
            <p>Status: {isPaid ? "Paid" : "Pending Cash"}</p>
            <div className="mt-3 flex gap-3 justify-center">
              <button
                onClick={handlePrintReceipt}
                className="bg-orange-600 text-white px-4 py-2 rounded"
              >
                Print & Reset
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
