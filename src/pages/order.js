// src/pages/order.js
import React, { useEffect, useMemo, useState } from "react";
import menuJson from "../data/momos.json"; // make sure your menu is at src/data/menu.json

export default function OrderPage() {
  const [menu, setMenu] = useState({});
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("Take Away");
  const [customerName, setCustomerName] = useState("");
  const [orderSaved, setOrderSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load menu once from imported JSON
  useEffect(() => {
    if (menuJson) setMenu(menuJson);
  }, []);

  // Add item to cart (with portion)
  const addToCart = (item, portion = "large") => {
    const key = `${item.id}__${portion}`;
    const existing = cart.find((c) => c.key === key);
    if (existing) {
      setCart((prev) =>
        prev.map((c) => (c.key === key ? { ...c, quantity: c.quantity + 1 } : c))
      );
    } else {
      // store a lightweight item copy (price object remains)
      setCart((prev) => [
        ...prev,
        {
          key,
          id: item.id,
          name: item.name,
          portion,
          quantity: 1,
          price: item.price, // price object {small, large}
        },
      ]);
    }
  };

  // Decrease or remove
  const decrementItem = (cartItem) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.key === cartItem.key ? { ...c, quantity: c.quantity - 1 } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  // Increase
  const incrementItem = (cartItem) => {
    setCart((prev) =>
      prev.map((c) => (c.key === cartItem.key ? { ...c, quantity: c.quantity + 1 } : c))
    );
  };

  // Remove completely
  const removeItem = (cartItem) => {
    setCart((prev) => prev.filter((c) => c.key !== cartItem.key));
  };

  // total computed from cart
  const total = useMemo(() => {
    return cart.reduce((s, it) => {
      const price = Number(it.price?.[it.portion] ?? 0);
      return s + price * it.quantity;
    }, 0);
  }, [cart]);

  // Submit order to API /api/saveOrder
  const submitOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const orderData = {
      orderId: `ORD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      orderType,
      customer: customerName || "Walk-in Customer",
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        portion: i.portion,
        quantity: i.quantity,
        unitPrice: Number(i.price?.[i.portion] ?? 0),
        lineTotal: Number(i.price?.[i.portion] ?? 0) * i.quantity,
      })),
      total: Number(total.toFixed(2)),
      shopName: "The MoMos",
    };

    setIsSaving(true);
    try {
      const res = await fetch("/api/saveOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setOrderSaved(orderData);
        setCart([]);
        setCustomerName("");
        alert("Order saved!");
      } else {
        console.error("Save order error", result);
        alert("Failed to save order. See console.");
      }
    } catch (err) {
      console.error("Network error", err);
      alert("Network error saving order.");
    } finally {
      setIsSaving(false);
    }
  };

  // print receipt (only receipt content)
  const printReceipt = () => {
    if (!orderSaved) return;
    const content = document.getElementById("receipt-content").innerHTML;
    const w = window.open("", "_blank", "width=320,height=600");
    w.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 8px; }
            .center { text-align:center; }
            .line { border-bottom: 1px dashed #000; margin:6px 0; }
            .item { display:flex; justify-content:space-between; }
            .small { font-size: 11px; color: #555; }
          </style>
        </head>
        <body onload="window.print();setTimeout(()=>window.close(), 300);">
          ${content}
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 22 }}>🥟</div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#c0392b" }}>The MoMos - POS</h1>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={selectStyle}>
            <option>Take Away</option>
            <option>Dine In</option>
            <option>Delivery</option>
          </select>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" style={inputStyle} />
          <button onClick={() => { setCart([]); setCustomerName(""); }} style={smallBtn}>Clear</button>
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Left: Menu */}
        <section style={{ minHeight: 360 }}>
          {Object.keys(menu).length === 0 ? (
            <div style={{ padding: 20, color: "#666" }}>Loading menu…</div>
          ) : (
            Object.entries(menu).map(([categoryKey, categoryVal]) => (
              <div key={categoryKey} style={{ marginBottom: 22 }}>
                <h2 style={{ margin: "8px 0", fontSize: 16, color: "#e67e22" }}>{categoryKey}</h2>

                {/* if array => render directly, else it's subcategories */}
                {Array.isArray(categoryVal) ? (
                  <MenuGrid items={categoryVal} addToCart={addToCart} />
                ) : (
                  Object.entries(categoryVal).map(([subKey, items]) => (
                    <div key={subKey} style={{ marginLeft: 8, marginBottom: 12 }}>
                      <h3 style={{ margin: "6px 0", color: "#2980b9", fontSize: 14 }}>{subKey}</h3>
                      <MenuGrid items={items} addToCart={addToCart} />
                    </div>
                  ))
                )}
              </div>
            ))
          )}
        </section>

        {/* Right: Cart + Checkout */}
        <aside style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>🧾 Cart</h3>

          {cart.length === 0 ? (
            <div style={{ color: "#666" }}>No items added yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cart.map((ci) => (
                <div key={ci.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #eee", paddingBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{ci.name}</div>
                    <div className="small" style={{ fontSize: 12, color: "#555" }}>{ci.portion} • £{(ci.price?.[ci.portion] ?? 0).toFixed(2)}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                      <button onClick={() => decrementItem(ci)} style={qtyBtn}>−</button>
                      <div style={{ minWidth: 18, textAlign: "center" }}>{ci.quantity}</div>
                      <button onClick={() => incrementItem(ci)} style={qtyBtn}>＋</button>
                      <button onClick={() => removeItem(ci)} style={{ marginLeft: 8, color: "#c0392b", border: "none", background: "transparent", cursor: "pointer" }}>Remove</button>
                    </div>
                  </div>
                  <div style={{ marginLeft: 12, minWidth: 70, textAlign: "right", fontWeight: 700 }}>£{(Number(ci.price?.[ci.portion] ?? 0) * ci.quantity).toFixed(2)}</div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>Grand Total</div>
                <div style={{ fontWeight: 800 }}>£{total.toFixed(2)}</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={submitOrder} disabled={isSaving} style={{ ...primaryBtn, flex: 1 }}>
                  {isSaving ? "Saving…" : "Complete & Save Order"}
                </button>
                <button onClick={() => { setCart([]); }} style={{ ...secondaryBtn }}>Clear</button>
              </div>
            </div>
          )}

          {/* After order saved show receipt preview */}
          {orderSaved && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: "8px 0" }}>Last Saved Order</h4>
              <div id="receipt-content">
                <div style={{ textAlign: "center", fontWeight: 700 }}>The MoMos</div>
                <div style={{ fontSize: 12 }} className="small">{new Date(orderSaved.timestamp).toLocaleString()}</div>
                <div style={{ marginTop: 6 }}>Order #{orderSaved.orderId}</div>
                <div>Type: {orderSaved.orderType}</div>
                <div>Customer: {orderSaved.customer}</div>
                <div className="line" style={{ borderBottom: "1px dashed #000", margin: "6px 0" }} />
                {orderSaved.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <div>{it.quantity} × {it.name} ({it.portion})</div>
                    <div>£{(it.unitPrice * it.quantity).toFixed(2)}</div>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #000", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                  <div>Grand Total</div>
                  <div>£{orderSaved.total.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={printReceipt} style={printBtn}>Print Receipt</button>
                <button onClick={() => { setOrderSaved(null); }} style={secondaryBtn}>Dismiss</button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

/* ---------- small components & styles ---------- */

function MenuGrid({ items, addToCart }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {items.map((item) => (
        <MenuCard key={item.id} item={item} addToCart={addToCart} />
      ))}
    </div>
  );
}

function MenuCard({ item, addToCart }) {
  // portion options based on price object keys
  const portions = Object.keys(item.price || {});
  const defaultPortion = portions.includes("large") ? "large" : portions[0] ?? "large";
  const [portion, setPortion] = useState(defaultPortion);

  // if price.small is zero or missing, still show large only
  const hasSmall = portions.includes("small") && Number(item.price.small) > 0;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, background: "#fff", minHeight: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 700 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: "#888" }}>{item.spicyLevel}</div>
      </div>
      <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{item.description}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>Allergens: {Array.isArray(item.allergens) ? item.allergens.join(", ") : "-"}</div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        {hasSmall ? (
          <select value={portion} onChange={(e) => setPortion(e.target.value)} style={{ padding: "6px 8px" }}>
            <option value="small">Small — £{Number(item.price.small).toFixed(2)}</option>
            <option value="large">Large — £{Number(item.price.large).toFixed(2)}</option>
          </select>
        ) : (
          // if only large (or only one price), show a read-only price tag
          <div style={{ padding: "6px 10px", background: "#f4f6f8", borderRadius: 6 }}>
            £{Number(item.price[defaultPortion] ?? 0).toFixed(2)}
          </div>
        )}

        <button onClick={() => addToCart(item, portion)} style={{ marginLeft: "auto", ...primaryBtn }}>
          Add
        </button>
      </div>
    </div>
  );
}

/* ---------- small style objects ---------- */

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  minWidth: 180,
};

const selectStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  minWidth: 140,
};

const smallBtn = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const primaryBtn = {
  background: "#2d8f6f",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};

const secondaryBtn = {
  background: "#fff",
  color: "#333",
  border: "1px solid #ddd",
  padding: "8px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const qtyBtn = {
  padding: "2px 8px",
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const printBtn = {
  background: "#1f6feb",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
