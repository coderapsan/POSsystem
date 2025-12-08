import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    notes: "",
  });

  const [generalItemName, setGeneralItemName] = useState("");
  const [generalItemPrice, setGeneralItemPrice] = useState("");

  const [incomingOnlineOrders, setIncomingOnlineOrders] = useState([]);
  const [showOnlineOrderModal, setShowOnlineOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);

  const toastTimerRef = useRef(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const cartInitRef = useRef(false);

  const triggerToast = useCallback((message) => {
    if (!message) return;
    setToastMessage(message);
    setIsToastVisible(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setIsToastVisible(false);
    }, 2200);
  }, []);

  const isMobileViewport = viewportWidth < 1024;

  const findFirstAvailableCategory = useCallback((menuMap) => {
    for (const [catName, catData] of Object.entries(menuMap || {})) {
      if (Array.isArray(catData)) {
        const hasItem = (catData || []).some((item) => item.isAvailable !== false);
        if (hasItem) return catName;
      } else if (catData && typeof catData === "object") {
        for (const [subCatName, items] of Object.entries(catData)) {
          if ((items || []).some((item) => item.isAvailable !== false)) {
            return `${catName} - ${subCatName}`;
          }
        }
      }
    }
    return null;
  }, []);

  const categoryHasAvailableItems = useCallback((menuMap, label) => {
    if (!label) return false;
    if (label.includes(" - ")) {
      const [parent, child] = label.split(" - ").map((part) => part.trim());
      const items = menuMap[parent]?.[child];
      return Array.isArray(items) && items.some((item) => item.isAvailable !== false);
    }
    const catData = menuMap[label];
    if (Array.isArray(catData)) {
      return catData.some((item) => item.isAvailable !== false);
    }
    if (catData && typeof catData === "object") {
      return Object.values(catData).some((items) =>
        (items || []).some((item) => item.isAvailable !== false)
      );
    }
    return false;
  }, []);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) {
        const fetchedMenu = data.menu || {};
        setMenu(fetchedMenu);
        const firstAvailable = findFirstAvailableCategory(fetchedMenu);
        setExpandedCategory((prev) =>
          prev && categoryHasAvailableItems(fetchedMenu, prev)
            ? prev
            : firstAvailable
        );
      } else {
        setMenuError(data.error || "Unable to load menu");
      }
    } catch (error) {
      setMenuError(error.message);
    } finally {
      setMenuLoading(false);
    }
  }, [categoryHasAvailableItems, findFirstAvailableCategory]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Poll for new online orders every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/saveOrder?source=customer&status=pending");
      const data = await res.json();
      if (data.orders && data.orders.length > 0) {
        setIncomingOnlineOrders(data.orders);
        setShowOnlineOrderModal(true);
        // Play ringing sound
        const audio = new Audio("/assets/ringtone.mp3");
        audio.play();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!cartInitRef.current) {
      setShowCart(!isMobileViewport);
      cartInitRef.current = true;
      return;
    }
    if (!isMobileViewport) {
      setShowCart(true);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    const matches = [];

    Object.entries(menu).forEach(([catName, catData]) => {
      if (Array.isArray(catData)) {
        catData.forEach((item) => {
          if (item.isAvailable === false) return;
          if (item.name?.toLowerCase().includes(term)) {
            matches.push({ item, categoryKey: catName });
          }
        });
      } else if (catData && typeof catData === "object") {
        Object.entries(catData).forEach(([subCatName, items]) => {
          (items || []).forEach((item) => {
            if (item.isAvailable === false) return;
            if (item.name?.toLowerCase().includes(term)) {
              matches.push({
                item,
                categoryKey: `${catName} - ${subCatName}`,
              });
            }
          });
        });
      }
    });

    return matches;
  }, [menu, searchTerm]);

  const hasActiveSearch = searchTerm.trim().length > 0;

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none focus:ring-0";
  const actionButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[#f26b30] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/20 transition hover:bg-[#ff773c] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  const subtleButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

  useEffect(() => {
    if (searchResults.length > 0) {
      setExpandedCategory(searchResults[0].categoryKey);
    } else if (hasActiveSearch) {
      setExpandedCategory(null);
    }
  }, [hasActiveSearch, searchResults]);

  const handleCategoryClick = (category) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const resolvePrice = (menuItem, portionKey = "") => {
    const entries = Object.entries(menuItem.price || {})
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value > 0);

    if (portionKey) {
      const matched = entries.find(([key]) => key === portionKey);
      if (matched) return matched[1];
    }

    return entries.length > 0 ? entries[0][1] : 0;
  };

  const formatPortionLabel = (portion) =>
    portion ? portion.charAt(0).toUpperCase() + portion.slice(1) : "";

  const addToCart = (item, portion = "") => {
    const normalizedPortion = portion || "";
    const portionLabel = normalizedPortion ? ` (${formatPortionLabel(normalizedPortion)})` : "";
    const message = `${item.name}${portionLabel} added to cart`;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.id === item.id && c.portion === normalizedPortion
      );

      if (existingIndex !== -1) {
        return prev.map((c, idx) =>
          idx === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
        );
      }

      return [
        ...prev,
        {
          ...item,
          portion: normalizedPortion,
          quantity: 1,
          price: resolvePrice(item, normalizedPortion),
        },
      ];
    });

    if (isMobileViewport) {
      setShowCart(true);
    }

    triggerToast(message);
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

  const getValidPortions = (item) =>
    Object.entries(item.price || {})
      .map(([portion, value]) => [portion, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value > 0);

  const handleSelectPortion = (item) => {
    const portions = getValidPortions(item);
    if (portions.length <= 1) {
      addToCart(item, "");
      return;
    }
    setSelectedItem(item);
  };

  const handlePortionChoice = (portion) => {
    if (!selectedItem) return;
    addToCart(selectedItem, portion);
    setSelectedItem(null);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
            .map((item) => {
              const portionLabel = item.portion
                ? ` (${formatPortionLabel(item.portion)})`
                : "";
              return `${item.quantity} × ${item.name}${portionLabel} - £${(
                item.price * item.quantity
              ).toFixed(2)}`;
            })
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
    setCustomer({ name: "", phone: "", address: "", postalCode: "", notes: "" });
    setDiscountPercent("");
    setIsPaid(false);
    setShowReceipt(false);
  };

  const handleAddGeneralItem = () => {
    const name = generalItemName.trim() || "General Item";
    const price = parseFloat(generalItemPrice);
    if (!price || price <= 0) return alert("Enter a valid price for the item.");
    const newItem = {
      id: `general-${Date.now()}`,
      name,
      portion: "",
      quantity: 1,
      price,
      description: "Custom item added by user",
      spicyLevel: "",
      allergens: [],
      isAvailable: true,
    };
    setCart((prev) => [...prev, newItem]);
    setGeneralItemName("");
    setGeneralItemPrice("");
    if (isMobileViewport) {
      setShowCart(true);
    }
    triggerToast(`${name} added to cart`);
  };

  const renderItems = (items) => {
    const visibleItems = (items || []).filter((item) => item.isAvailable !== false);
    if (visibleItems.length === 0) {
      return (
        <p className="rounded-lg border border-dashed border-white/10 bg-black/10 p-3 text-sm text-slate-400">
          No available items in this category.
        </p>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="group flex h-full flex-col justify-between rounded-xl border border-white/5 bg-[#0f1628] p-4 transition-all duration-200 hover:border-[#f26b30] hover:bg-[#f26b30]/10"
            onClick={() => handleSelectPortion(item)}
          >
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold tracking-tight text-white">
                    {item.name}
                  </h4>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                </div>
                <span className="rounded-full bg-[#f26b30]/10 px-3 py-1 text-sm font-semibold text-[#f26b30]">
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
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  🌶️<span className="uppercase tracking-wide">{item.spicyLevel || "mild"}</span>
                </span>
                <span className="flex items-center gap-1">
                  ⚠️<span>{(item.allergens || []).join(", ") || "No allergens"}</span>
                </span>
              </div>
            </div>
            <button
              className={`${actionButtonClass} mt-4 w-full justify-center`}
              onClick={(event) => {
                event.stopPropagation();
                handleSelectPortion(item);
              }}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderCategory = (categoryName, items) => {
    const availableCount = (items || []).filter((item) => item.isAvailable !== false).length;
    const isExpanded = expandedCategory === categoryName;

    return (
      <div
        key={categoryName}
        className={`mb-4 rounded-2xl border backdrop-blur transition-colors ${
          isExpanded ? "border-white/20 bg-[#111b30]" : "border-white/10 bg-[#0f1628]/70"
        }`}
      >
        <button
          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold tracking-wide transition ${
            isExpanded
              ? "bg-[#f26b30] text-white shadow-inner shadow-[#f26b30]/40"
              : "text-slate-200 hover:bg-white/10"
          }`}
          onClick={() => handleCategoryClick(categoryName)}
        >
          <span className="text-base">{categoryName}</span>
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]">
            {availableCount}
          </span>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 pt-3">{renderItems(items)}</div>
        )}
      </div>
    );
  };

  const acceptOnlineOrder = async (orderId) => {
    await fetch(`/api/saveOrder/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    setIncomingOnlineOrders(
      incomingOnlineOrders.filter((o) => o.orderId !== orderId)
    );
    setShowOnlineOrderModal(false);
    // Print logic here
    alert("Order accepted and sent to printer!");
  };

  const clearSearch = () => {
    setSearchTerm("");
    setExpandedCategory(null);
  };

  const handleSearchItemSelect = (result) => {
    setExpandedCategory(result.categoryKey);
    handleSelectPortion(result.item);
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <Navbar />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 pb-56 sm:px-6 lg:px-8 lg:pb-12">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#f26b30]">Live POS</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              The MoMos POS System
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage dine-in, takeaway, and delivery tickets with a branded control hub built for speed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={subtleButtonClass}
              onClick={() => (window.location.href = "/order-history")}
            >
              View Order History
            </button>
            <button
              className={subtleButtonClass}
              onClick={() => (window.location.href = "/admin")}
            >
              Admin Console
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search the menu"
                    className={`${inputClass} pr-12`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    ⌕
                  </span>
                </div>
                {hasActiveSearch && (
                  <button className={subtleButtonClass} onClick={clearSearch}>
                    Clear
                  </button>
                )}
                <button
                  className={actionButtonClass}
                  onClick={loadMenu}
                  disabled={menuLoading}
                >
                  {menuLoading ? "Refreshing…" : "Refresh Menu"}
                </button>
              </div>

              {hasActiveSearch && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#f26b30]">
                    Search Results
                  </h3>
                  {searchResults.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
                      No menu items found for "{searchTerm}".
                    </p>
                  ) : (
                    searchResults.map((result, idx) => (
                      <div
                        key={`${result.item.id}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f1628] px-4 py-3 text-sm shadow-sm shadow-black/10 transition hover:border-[#f26b30]"
                      >
                        <div>
                          <p className="font-medium text-white">{result.item.name}</p>
                          <p className="text-xs text-slate-400">{result.categoryKey}</p>
                        </div>
                        <button
                          className={actionButtonClass}
                          onClick={() => handleSearchItemSelect(result)}
                        >
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-white">Order Information</h3>
                <span className="text-xs uppercase tracking-[0.35em] text-slate-500">{orderType}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  <option>Dine In</option>
                  <option>Take Away</option>
                  <option>Delivery</option>
                </select>
                <input
                  placeholder="Customer Name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Address Line 1"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Postal Code"
                  value={customer.postalCode}
                  onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Order Notes (optional)"
                  value={customer.notes || ""}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  className={`${inputClass} sm:col-span-2 lg:col-span-3`}
                />
              </div>
            </div>

            <div className="space-y-4">
              {menuLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1628]/80 px-4 py-3 text-sm text-slate-300">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-[#f26b30]"></span>
                  Loading menu…
                </div>
              ) : menuError ? (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                  <p className="mb-3 font-semibold">We could not load the menu.</p>
                  <p className="mb-4 text-xs text-red-100/80">{menuError}</p>
                  <button className={actionButtonClass} onClick={loadMenu}>
                    Try again
                  </button>
                </div>
              ) : Object.keys(menu).length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-[#0f1628]/60 px-4 py-4 text-sm italic text-slate-400">
                  No menu items available. Import the latest menu from the admin console to get started.
                </p>
              ) : (
                Object.entries(menu).map(([catName, catData]) =>
                  Array.isArray(catData)
                    ? renderCategory(catName, catData)
                    : Object.entries(catData).map(([subCat, items]) =>
                        renderCategory(`${catName} - ${subCat}`, items)
                      )
                )
              )}
            </div>
          </div>

          <aside className="relative w-full lg:pl-2">
            <div
                className={`fixed bottom-0 right-0 z-40 flex w-full max-h-[80vh] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#101828]/95 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] backdrop-blur transition-transform duration-300 ease-out ${
                  showCart ? "translate-y-0" : "translate-y-[calc(100%-4rem)]"
                } lg:sticky lg:top-28 lg:bottom-auto lg:right-auto lg:max-h-[calc(100vh-6rem)] lg:w-full lg:translate-y-0 lg:rounded-3xl lg:shadow-2xl lg:transition-none`}
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Cart</h3>
                  <p className="text-xs text-slate-400">
                    {cartCount} item{cartCount === 1 ? "" : "s"}
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-400 lg:inline-flex">
                      Ready
                    </span>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-200 transition hover:border-[#f26b30] hover:text-white lg:hidden"
                      onClick={() => setShowCart(false)}
                      aria-label="Hide cart"
                    >
                      ✕
                    </button>
                  </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={generalItemName}
                    onChange={(e) => setGeneralItemName(e.target.value)}
                    placeholder="Custom item name"
                    className={`${inputClass} sm:flex-1`}
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={generalItemPrice}
                    onChange={(e) =>
                      setGeneralItemPrice(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    placeholder="Price (£)"
                    className={`${inputClass} sm:w-32 text-right`}
                  />
                  <button
                    className={`${actionButtonClass} sm:px-6`}
                    onClick={handleAddGeneralItem}
                  >
                    Add
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-slate-500">
                    Cart is empty. Select a menu item to build the order.
                  </div>
                ) : (
                  cart.map((item, i) => (
                    <div
                      key={`${item.id}-${item.portion}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="max-w-[60%]">
                        <p className="text-sm font-semibold text-white">
                          {item.name}
                          {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                        </p>
                        <p className="text-xs text-slate-400">
                          £{item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-lg text-slate-100"
                          onClick={() => updateQuantity(item, -1)}
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f26b30] text-lg text-white"
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
                <div className="space-y-4 border-t border-white/10 bg-black/20 px-5 pb-5 pt-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Discount</span>
                      <span>-£{discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-base font-semibold text-white">
                    <span>Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex flex-col text-xs text-slate-400">
                      Discount (%)
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        placeholder="Enter %"
                        onChange={(e) =>
                          setDiscountPercent(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                        className={`${inputClass} mt-1 w-24 text-right`}
                      />
                    </label>
                    <label className="flex flex-col text-xs text-slate-400">
                      Payment Method
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={`${inputClass} mt-1 appearance-none`}
                      >
                        <option>Cash</option>
                        <option>Card</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-300">
                      <input
                        type="checkbox"
                        checked={isPaid}
                        onChange={() => setIsPaid(!isPaid)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-[#f26b30]"
                      />
                      Paid
                    </label>
                  </div>

                  <button
                    className={`${actionButtonClass} w-full justify-center`}
                    onClick={handleSubmitOrder}
                  >
                    Submit Order
                  </button>
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 px-5 py-6 shadow-lg shadow-black/30 backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Order History</h2>
          <p className="mt-1 text-xs text-slate-400">
            Jump into the dedicated history views whenever you need deeper reporting.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={subtleButtonClass}
              onClick={() => (window.location.href = "/order-history")}
            >
              Store Orders
            </button>
            <button
              className={subtleButtonClass}
              onClick={() => (window.location.href = "/customerOrder")}
            >
              Online Portal
            </button>
          </div>
        </section>
      </main>

      {isMobileViewport && (
        <button
          className={`fixed bottom-6 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#f26b30] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/40 transition ${
            showCart ? "pointer-events-none opacity-0" : "opacity-100"
          } lg:hidden`}
          onClick={() => setShowCart(true)}
        >
          🛒 Cart ({cartCount})
        </button>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101828] p-6 text-center text-slate-100 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-semibold text-white">
              Choose portion for {selectedItem.name}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Select a portion size to add this item to the cart.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {(() => {
                const options = Object.entries(selectedItem.price || {})
                  .map(([portion, value]) => [portion, Number(value)])
                  .filter(([, value]) => Number.isFinite(value) && value > 0);
                if (options.length === 0) {
                  return (
                    <button
                      onClick={() => handlePortionChoice("")}
                      className={`${actionButtonClass} min-w-[140px] justify-center`}
                    >
                      Add Item
                    </button>
                  );
                }
                return options.map(([portion, value]) => (
                  <button
                    key={portion}
                    onClick={() => handlePortionChoice(portion)}
                    className={`${actionButtonClass} min-w-[160px] justify-center`}
                  >
                    {portion.charAt(0).toUpperCase() + portion.slice(1)} (£{value.toFixed(2)})
                  </button>
                ));
              })()}
            </div>
            <button className={`${subtleButtonClass} mt-6`} onClick={() => setSelectedItem(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#101828] p-6 text-slate-100 shadow-2xl shadow-black/40">
            <h3 className="text-xl font-semibold text-white">Receipt #{orderNumber}</h3>
            <p className="mt-1 text-xs text-slate-500">{new Date().toLocaleString()}</p>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <span>Type: {orderType}</span>
              {customer.name && <span>Name: {customer.name}</span>}
              {customer.phone && <span>Phone: {customer.phone}</span>}
              {customer.address && <span>Address: {customer.address}</span>}
              {customer.postalCode && <span>Postal Code: {customer.postalCode}</span>}
            </div>
            <div className="my-4 border-t border-white/10"></div>
            <div className="space-y-2 text-sm text-slate-200">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span>
                    {item.quantity}× {item.name}
                    {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                  </span>
                  <span>£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="my-4 border-t border-white/10"></div>
            <div className="space-y-1 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex items-center justify-between text-[#f26b30]">
                  <span>Discount</span>
                  <span>-£{discountValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Payment</span>
                <span>{paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Status</span>
                <span>{isPaid ? "Paid" : "Pending Cash"}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={handlePrintReceipt} className={actionButtonClass}>
                Print & Reset
              </button>
              <button onClick={() => setShowReceipt(false)} className={subtleButtonClass}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnlineOrderModal && incomingOnlineOrders.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101828] p-6 text-slate-100 shadow-2xl shadow-black/40">
            <h3 className="text-xl font-semibold text-white">New Online Order</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Customer: {incomingOnlineOrders[0].customer?.name || "Walk-in"}</p>
              <p>Order ID: {incomingOnlineOrders[0].orderId}</p>
              <ul className="mt-2 space-y-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs">
                {incomingOnlineOrders[0].items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                className={actionButtonClass}
                onClick={() => acceptOnlineOrder(incomingOnlineOrders[0].orderId)}
              >
                Accept & Print
              </button>
              <button
                className={subtleButtonClass}
                onClick={() => setShowOnlineOrderModal(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {isToastVisible && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#111b30]/95 px-6 py-3 text-sm font-medium text-slate-100 shadow-xl shadow-black/40">
          ✅ {toastMessage}
        </div>
      )}
    </div>
  )};
