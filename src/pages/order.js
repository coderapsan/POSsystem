// src/pages/order.js
import React, { useEffect, useRef, useState } from "react";
import menuJson from "../data/momos.json"; // <-- ensure file exists at src/data/menu.json

export default function OrderPage() {
  // UI state
  const [menu, setMenu] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // for portion modal
  const [showPortionModal, setShowPortionModal] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState(null);

  // Responsive
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setMenu(menuJson || {});
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // load cart from localStorage (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("momos_cart");
      if (raw) setCart(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load cart from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("momos_cart", JSON.stringify(cart));
    } catch (e) {
      /* ignore */
    }
  }, [cart]);

  // refs for scrolling
  const categoryRefs = useRef({});

  // Helpers - safely read prices and allergens
  const getValidPriceEntries = (item) => {
    const priceObj = item?.price || {};
    // convert values to numbers and filter out invalid / zero
    return Object.entries(priceObj)
      .map(([k, v]) => [k, Number(v)])
      .filter(([, v]) => !isNaN(v) && v > 0);
  };
  const getDefaultPortion = (item) => {
    const entries = getValidPriceEntries(item);
    if (entries.length === 0) return null;
    // prefer 'large' if present
    const hasLarge = entries.find(([k]) => k.toLowerCase() === "large");
    return (hasLarge && hasLarge[0]) || entries[0][0];
  };
  const allergenText = (item) => {
    if (!item) return "No allergens";
    if (Array.isArray(item.allergens) && item.allergens.length)
      return item.allergens.join(", ");
    return "No allergens";
  };

  // Expand/collapse logic (only one open at a time)
  const toggleCategory = (categoryKey) => {
    const next = expandedCategory === categoryKey ? null : categoryKey;
    setExpandedCategory(next);
    // if expanding, scroll into view after a tiny delay so the DOM updates
    if (next) {
      setTimeout(() => {
        const el = categoryRefs.current[categoryKey];
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 120);
    }
  };

  // Add item to cart (merge same id+portion -> increment quantity)
  const addToCart = (item, portion) => {
    if (!item || !portion) return;
    const price = getValidPriceEntries(item).find(([k]) => k === portion)?.[1];
    if (!price) {
      alert("Price not found for selected portion.");
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id && c.portion === portion);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            portion,
            unitPrice: price,
            quantity: 1,
          },
        ];
      }
    });

    // show cart on mobile for immediate feedback
    if (isMobile) setShowCart(true);
  };

  // When a menu card is clicked:
  // - if only one portion exists, add immediately (default portion),
  // - else open portion modal
  const onCardClick = (item) => {
    const valid = getValidPriceEntries(item);
    if (valid.length === 0) {
      alert("This item has no valid price.");
      return;
    }
    if (valid.length === 1) {
      addToCart(item, valid[0][0]);
      return;
    }
    // multiple portions -> open modal
    setSelectedItem(item);
    setShowPortionModal(true);
  };

  // quantity change
  const changeQuantity = (index, delta) => {
    setCart((prev) => {
      const copy = prev.slice();
      copy[index] = { ...copy[index], quantity: (copy[index].quantity || 0) + delta };
      if (copy[index].quantity <= 0) copy.splice(index, 1);
      return copy;
    });
  };
  const removeCartIndex = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // compute totals
  const subtotal = cart.reduce((s, it) => s + (Number(it.unitPrice || 0) * (it.quantity || 0)), 0);

  // Save order using /api/saveOrder (serverless)
  const submitOrder = async () => {
    if (!cart.length) {
      alert("Cart is empty.");
      return;
    }
    const orderPayload = {
      orderId: `TMM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: cart.map((c) => ({
        id: c.id,
        name: c.name,
        portion: c.portion,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        lineTotal: c.unitPrice * c.quantity,
      })),
      total: Number(subtotal.toFixed(2)),
      shopName: "The MoMos",
    };

    setIsSaving(true);
    try {
      // call serverless API (must exist)
      const res = await fetch("/api/saveOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        console.error("saveOrder failed", result);
        alert("Failed to save order — check console.");
      } else {
        // show receipt preview and clear cart
        setSavedOrder(orderPayload);
        setCart([]);
        localStorage.removeItem("momos_cart");
        setShowCart(false);
      }
    } catch (err) {
      console.error(err);
      alert("Network or server error saving order.");
    } finally {
      setIsSaving(false);
    }
  };

  // Print receipt (opens mini window and prints only receipt area)
  const printReceipt = (order) => {
    if (!order) return;
    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${order.orderId}</title>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 8px; }
          .center { text-align:center; }
          .line { border-bottom: 1px dashed #000; margin:6px 0; }
          .item { display:flex; justify-content:space-between; }
        </style>
      </head>
      <body onload="window.print();setTimeout(()=>window.close(),300);">
        <div class="center"><strong>The MoMos</strong></div>
        <div class="center small">${new Date(order.timestamp).toLocaleString()}</div>
        <div class="line"></div>
        <div>Order ID: ${order.orderId}</div>
        ${order.items.map(it => `<div class="item"><div>${it.quantity} x ${it.name} (${it.portion})</div><div>£${(it.lineTotal).toFixed(2)}</div></div>`).join("")}
        <div class="line"></div>
        <div class="item"><strong>Grand Total</strong><strong>£${order.total.toFixed(2)}</strong></div>
        <div style="margin-top:8px" class="center">Thank you!</div>
      </body>
      </html>
    `;
    const w = window.open("", "_blank", "width=320,height=600");
    if (!w) { alert("Pop-up blocked. Allow popups to print."); return; }
    w.document.write(html);
    w.document.close();
  };

  // UI components (simple inline styles to avoid external CSS dependencies)
  const styles = {
    page: { fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial", background: "#f7fafc", minHeight: "100vh" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 40 },
    container: { maxWidth: 1200, margin: "24px auto", padding: "0 18px" },
    catCard: (open) => ({ cursor: "pointer", padding: 16, borderRadius: 12, border: "1px solid #eee", background: open ? "#fff7ed" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: open ? "0 6px 18px rgba(0,0,0,0.06)" : "0 2px 6px rgba(0,0,0,0.03)" }),
    itemCard: { cursor: "pointer", padding: 14, borderRadius: 10, border: "1px solid #eee", background: "#fff" },
    cartDrawer: { position: "fixed", right: 0, bottom: 0, top: 72, width: isMobile ? "100%" : 360, background: "#fff", boxShadow: "-6px 0 18px rgba(0,0,0,0.08)", zIndex: 60, display: "flex", flexDirection: "column" },
    floatCartBtn: { position: "fixed", right: 18, bottom: 18, zIndex: 70, background: "#f97316", color: "#fff", border: "none", padding: 14, borderRadius: 999, boxShadow: "0 8px 24px rgba(249,115,22,0.24)" },
    smallBtn: { padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" },
    primaryBtn: { padding: "10px 12px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer" },
  };

  // Render
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 20 }}>🥟</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>The MoMos</div>
            <div style={{ fontSize: 12, color: "#666" }}>Staff POS</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#444" }}>Cart: <strong>{cart.reduce((s, c) => s + c.quantity, 0)}</strong></div>
          <button onClick={() => { setShowCart((s) => !s); }} style={styles.smallBtn}>
            {showCart ? "Close Cart ✕" : "Open Cart"}
          </button>
        </div>
      </header>

      <main style={styles.container}>
        {/* Categories list */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {Object.keys(menu).map((catKey) => (
            <div key={catKey} ref={(el) => (categoryRefs.current[catKey] = el)}>
              <div
                role="button"
                onClick={() => toggleCategory(catKey)}
                style={styles.catCard(expandedCategory === catKey)}
              >
                <div style={{ fontWeight: 700, color: "#c2410c" }}>{catKey}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{expandedCategory === catKey ? "▲" : "▼"}</div>
              </div>

              {/* expand/collapse area with smooth transition */}
              <div style={{ overflow: "hidden", transition: "max-height 320ms ease, opacity 320ms ease", maxHeight: expandedCategory === catKey ? 1200 : 0, opacity: expandedCategory === catKey ? 1 : 0 }}>
                <div style={{ marginTop: 12 }}>
                  {/* special case: Vegetables has nested Mains/Sides */}
                  {catKey === "Vegetables" ? (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Mains</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                          {(menu.Vegetables?.Mains || []).map((it) => (
                            <div key={it.id} onClick={() => onCardClick(it)} style={styles.itemCard}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ fontWeight: 600 }}>{it.name}</div>
                                <div style={{ fontSize: 12, color: "#666" }}>{it.spicyLevel || ""}</div>
                              </div>
                              <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{it.description}</div>
                              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 12, color: "#777" }}>{allergenText(it)}</div>
                                <div style={{ fontWeight: 700, color: "#c2410c" }}>£{(getValidPriceEntries(it)[0]?.[1] ?? 0).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Sides</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                          {(menu.Vegetables?.Sides || []).map((it) => (
                            <div key={it.id} onClick={() => onCardClick(it)} style={styles.itemCard}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ fontWeight: 600 }}>{it.name}</div>
                                <div style={{ fontSize: 12, color: "#666" }}>{it.spicyLevel || ""}</div>
                              </div>
                              <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{it.description}</div>
                              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 12, color: "#777" }}>{allergenText(it)}</div>
                                <div style={{ fontWeight: 700, color: "#c2410c" }}>£{(getValidPriceEntries(it)[0]?.[1] ?? 0).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                      {(menu[catKey] || []).map((it) => (
                        <div key={it.id} onClick={() => onCardClick(it)} style={styles.itemCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ fontWeight: 600 }}>{it.name}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>{it.spicyLevel || ""}</div>
                          </div>
                          <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{it.description}</div>
                          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 12, color: "#777" }}>{allergenText(it)}</div>
                            <div style={{ fontWeight: 700, color: "#c2410c" }}>£{(getValidPriceEntries(it)[0]?.[1] ?? 0).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating cart button for mobile */}
      {isMobile && (
        <button onClick={() => setShowCart(true)} style={styles.floatCartBtn} aria-label="Open cart">
          🛒 <span style={{ marginLeft: 8, fontWeight: 700 }}>{cart.reduce((s, c) => s + c.quantity, 0)}</span>
        </button>
      )}

      {/* Cart Drawer */}
      <div style={{ ...styles.cartDrawer, transform: showCart ? "translateX(0)" : `translateX(${isMobile ? "0" : "100%"})`, right: 0 }}>
        <div style={{ padding: 14, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>🛒 Cart</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowCart(false); }} style={styles.smallBtn}>✕</button>
          </div>
        </div>

        <div style={{ padding: 12, flex: "1 1 auto", overflowY: "auto", maxHeight: isMobile ? "50vh" : "60vh" }}>
          {cart.length === 0 ? (
            <div style={{ color: "#666" }}>No items in cart.</div>
          ) : (
            cart.map((ci, idx) => (
              <div key={`${ci.id}_${ci.portion}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px dashed #eee", paddingBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{ci.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{ci.portion} • £{ci.unitPrice.toFixed(2)}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => changeQuantity(idx, -1)} style={{ ...styles.smallBtn, width: 34 }}>−</button>
                    <div style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>{ci.quantity}</div>
                    <button onClick={() => changeQuantity(idx, 1)} style={{ ...styles.smallBtn, width: 34 }}>＋</button>
                  </div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 12 }}>
                  <div style={{ fontWeight: 700 }}>£{(ci.unitPrice * ci.quantity).toFixed(2)}</div>
                  <button onClick={() => removeCartIndex(idx)} style={{ marginTop: 8, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid #eee", background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>Grand Total</div>
            <div style={{ fontWeight: 800 }}>£{subtotal.toFixed(2)}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setCart([]); }} style={{ ...styles.smallBtn, flex: 1 }}>Clear</button>
            <button onClick={submitOrder} style={{ ...styles.primaryBtn, flex: 1 }} disabled={isSaving}>
              {isSaving ? "Saving..." : "Complete Order"}
            </button>
          </div>

          {savedOrder && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Last Order: {savedOrder.orderId}</div>
              <div style={{ fontSize: 13, marginTop: 6, display: "flex", gap: 8 }}>
                <button onClick={() => printReceipt(savedOrder)} style={{ ...styles.smallBtn }}>Print</button>
                <button onClick={() => setSavedOrder(null)} style={{ ...styles.smallBtn }}>Dismiss</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portion modal */}
      {showPortionModal && selectedItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 18, width: 360, maxWidth: "95%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800 }}>{selectedItem.name}</div>
              <button onClick={() => { setShowPortionModal(false); setSelectedItem(null); }} style={{ ...styles.smallBtn }}>✕</button>
            </div>
            <div style={{ marginBottom: 10, color: "#444" }}>{selectedItem.description}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {getValidPriceEntries(selectedItem).map(([portion, price]) => (
                <button key={portion} onClick={() => addToCart(selectedItem, portion)} style={{ padding: 10, borderRadius: 8, border: "1px solid #eee", background: "#fff", textAlign: "left", fontWeight: 700 }}>
                  {portion.charAt(0).toUpperCase() + portion.slice(1)} — £{price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
