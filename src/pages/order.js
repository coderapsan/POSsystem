import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/common/Navbar";
import StaffGate from "../components/common/StaffGate";

const MENU_CACHE_KEY = "momos-menu-cache";
const MENU_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export default function Order() {
  const [menu, setMenu] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [modalFocusItemId, setModalFocusItemId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
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

  const categories = useMemo(() => {
    const list = [];
    Object.entries(menu || {}).forEach(([parent, value]) => {
      if (Array.isArray(value)) {
        list.push({ label: parent, items: value });
      } else if (value && typeof value === "object") {
        Object.entries(value).forEach(([child, items]) => {
          list.push({
            label: `${parent} - ${child}`,
            items: Array.isArray(items) ? items : [],
          });
        });
      }
    });
    return list;
  }, [menu]);

  const availableCategoryCount = useMemo(
    () =>
      categories.filter(({ items }) =>
        (items || []).some((item) => item.isAvailable !== false)
      ).length,
    [categories]
  );

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

  const applyMenuPayload = useCallback(
    (nextMenu) => {
      setMenu(nextMenu);
      setExpandedCategory((prev) =>
        prev && categoryHasAvailableItems(nextMenu, prev)
          ? prev
          : findFirstAvailableCategory(nextMenu)
      );
    },
    [categoryHasAvailableItems, findFirstAvailableCategory]
  );

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) {
        const fetchedMenu = data.menu || {};
        applyMenuPayload(fetchedMenu);
        if (typeof window !== "undefined") {
          const payload = {
            data: fetchedMenu,
            expiresAt: Date.now() + MENU_CACHE_TTL,
          };
          window.localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(payload));
        }
      } else {
        setMenuError(data.error || "Unable to load menu");
      }
    } catch (error) {
      setMenuError(error.message);
    } finally {
      setMenuLoading(false);
    }
  }, [applyMenuPayload]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const raw = window.localStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.data && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
        applyMenuPayload(parsed.data);
      }
    } catch (error) {
      console.warn("Failed to parse cached menu", error);
    }
  }, [applyMenuPayload]);

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
    "w-full rounded-lg border border-white/15 bg-[#0f192d] px-3 py-2 text-sm text-white placeholder:text-slate-500 caret-[#f26b30] focus:border-[#f26b30] focus:outline-none focus:ring-2 focus:ring-[#f26b30]/40";
  const actionButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[#f26b30] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/20 transition hover:bg-[#ff773c] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  const subtleButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  const buildTogglePillClass = (isActive) =>
    `rounded-full border px-3 py-1 text-xs font-semibold transition ${
      isActive
        ? "border-[#f26b30] bg-[#f26b30]/15 text-[#fcd7ba]"
        : "border-white/10 text-slate-300 hover:border-[#f26b30] hover:text-white"
    }`;
  const paymentOptions = ["Cash", "Card"];
  const quickDiscountOptions = [0, 5, 10];

  useEffect(() => {
    if (searchResults.length > 0) {
      setExpandedCategory(searchResults[0].categoryKey);
    } else if (hasActiveSearch) {
      setExpandedCategory(null);
    }
  }, [hasActiveSearch, searchResults]);

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

  const removeItem = (item) => {
    setCart((prev) =>
      prev.filter((c) => !(c.id === item.id && c.portion === item.portion))
    );
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    const shouldClear = window.confirm("Clear all items from the order?");
    if (!shouldClear) return;
    setCart([]);
    setDiscountPercent("");
    setIsPaid(false);
  };

  const getValidPortions = (item) =>
    Object.entries(item.price || {})
      .map(([portion, value]) => [portion, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value > 0);

  const getItemsForCategory = useCallback(
    (label) => {
      if (!label) return [];
      if (label.includes(" - ")) {
        const [parent, child] = label.split(" - ").map((part) => part.trim());
        const items = menu[parent]?.[child];
        return Array.isArray(items)
          ? items.filter((item) => item.isAvailable !== false)
          : [];
      }
      const catData = menu[label];
      if (Array.isArray(catData)) {
        return catData.filter((item) => item.isAvailable !== false);
      }
      return [];
    },
    [menu]
  );

  const openCategoryModal = useCallback(
    (label, options = {}) => {
      const items = getItemsForCategory(label);
      if (items.length === 0) {
        triggerToast("Items currently unavailable");
        return;
      }
      setExpandedCategory(label);
      setModalFocusItemId(options.focusId ?? null);
      setCategoryModal(label);
    },
    [getItemsForCategory, triggerToast]
  );

  const closeCategoryModal = useCallback(() => {
    setCategoryModal(null);
    setModalFocusItemId(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (selectedItem) {
        setSelectedItem(null);
        return;
      }
      if (detailItem) {
        setDetailItem(null);
        return;
      }
      if (categoryModal) {
        closeCategoryModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [categoryModal, closeCategoryModal, detailItem, selectedItem]);

  const modalItems = useMemo(
    () => (categoryModal ? getItemsForCategory(categoryModal) : []),
    [categoryModal, getItemsForCategory]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!categoryModal || !modalFocusItemId) return;
    const frame = window.requestAnimationFrame(() => {
      const element = document.querySelector(
        `[data-pos-item-id="${modalFocusItemId}"]`
      );
      if (element && "scrollIntoView" in element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [categoryModal, modalFocusItemId]);

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

    if (paymentMethod === "Card" && !isPaid) {
      const confirmProceed = window.confirm(
        "Card payment has not been marked as received. Continue and leave the order as pending?"
      );
      if (!confirmProceed) {
        return;
      }
    }

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

    const customerDetails =
      customer.name || customer.phone
        ? `<div class="line"></div>
           <div class="section-title">Customer</div>
           <div>Name: ${customer.name || "-"}</div>
           <div>Phone: ${customer.phone || "-"}</div>
           <div>Address: ${customer.address || "-"}</div>
           <div>Postal: ${customer.postalCode || "-"}</div>`
        : "";

    const itemsHtml = cart
      .map((item) => {
        const portionLabel = item.portion ? ` (${formatPortionLabel(item.portion)})` : "";
        return `${item.quantity} × ${item.name}${portionLabel} - £${(
          item.price * item.quantity
        ).toFixed(2)}`;
      })
      .join("<br/>");

    const discountHtml =
      discountValue > 0
        ? `<div>Discount (${discountPercent}%): -£${discountValue.toFixed(2)}</div>`
        : "";

    const paymentSummary =
      paymentMethod === "Card"
        ? "Card payment collected securely by phone (details not stored)."
        : `Payment method: ${paymentMethod}`;

    const statusSummary = isPaid ? "Payment received" : "Awaiting payment";

    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${orderNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: monospace; padding: 8px; font-size: 12px; width: 80mm; margin: 0 auto; }
            h1 { text-align: center; margin-bottom: 2px; font-size: 18px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .order-number { font-size: 16px; font-weight: bold; text-align: center; margin: 4px 0; }
            .total { font-size: 14px; font-weight: bold; text-align: right; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; margin-bottom: 2px; }
            .note { font-size: 10px; margin-top: 3px; }
          </style>
        </head>
        <body>
          <h1>The MoMos</h1>
          <div class="center">Authentic Himalayan Street Food</div>
          <div class="center">340 Kingston Road, SW20 8LR</div>
          <div class="center">Tel: 0208 123 4567 • themomos.co.uk</div>
          <div class="line"></div>
          <div class="order-number">Order #${orderNumber}</div>
          <div>Date: ${new Date().toLocaleString()}</div>
          <div>Service: ${orderType}</div>
          ${customerDetails}
          <div class="line"></div>
          <div class="section-title">Items</div>
          ${itemsHtml}
          <div class="line"></div>
          <div>Subtotal: £${subtotal.toFixed(2)}</div>
          ${discountHtml}
          <div class="total">Total due: £${total.toFixed(2)}</div>
          <div class="line"></div>
          <div>${paymentSummary}</div>
          <div>Status: ${statusSummary}</div>
          <div class="line"></div>
          <div class="center note">Thank you for supporting independent Nepalese cuisine.</div>
          <div class="center note">Connect with us: @themomosldn • themomos.co.uk</div>
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

  const renderItems = (items, highlightedId = null) => {
    const visibleItems = (items || []).filter((item) => item.isAvailable !== false);
    if (visibleItems.length === 0) {
      return (
        <p className="rounded-lg border border-dashed border-white/10 bg-black/10 p-3 text-sm text-slate-400">
          No available items in this category.
        </p>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => {
          const isHighlighted = highlightedId === item.id;
          const portionOptions = getValidPortions(item);
          const multiplePortions = portionOptions.length > 1;
          const basePrice = portionOptions.length > 0
            ? Math.min(...portionOptions.map(([, value]) => value))
            : resolvePrice(item);
          const priceLabel = multiplePortions
            ? `From £${basePrice.toFixed(2)}`
            : `£${basePrice.toFixed(2)}`;
          return (
            <div
              key={item.id}
              data-pos-item-id={item.id}
              className={`flex h-full cursor-pointer flex-col gap-3 rounded-2xl border bg-[#0f1628] p-4 transition ${
                isHighlighted
                  ? "border-[#f26b30] ring-2 ring-[#f26b30]/60"
                  : "border-white/10 hover:border-[#f26b30]"
              }`}
              onClick={() => handleSelectPortion(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {multiplePortions ? "Multiple portions" : "Single portion"}
                  </p>
                </div>
                <span className="rounded-full bg-[#f26b30]/10 px-3 py-1 text-xs font-semibold text-[#f26b30]">
                  {priceLabel}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  🌶️{item.spicyLevel || "Mild"}
                </span>
                <span className="flex items-center gap-1">
                  ⚠️{(item.allergens || []).join(", ") || "No allergens"}
                </span>
              </div>
              <button
                className="self-start rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  setDetailItem(item);
                }}
              >
                View ingredients
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCategory = (categoryName, items) => {
    const availableCount = (items || []).filter((item) => item.isAvailable !== false).length;
    if (availableCount === 0) return null;
    const isActive = expandedCategory === categoryName;

    return (
      <button
        key={categoryName}
        className={`rounded-2xl border px-4 py-5 text-left transition ${
          isActive
            ? "border-[#f26b30] bg-[#f26b30]/10 text-white"
            : "border-white/10 bg-[#0f1628]/70 text-slate-200 hover:border-[#f26b30]"
        }`}
        onClick={() => openCategoryModal(categoryName)}
      >
        <span className="block text-sm font-semibold uppercase tracking-[0.25em]">{availableCount} dishes</span>
        <span className="mt-2 block text-lg font-semibold">{categoryName}</span>
      </button>
    );
  };

  const printOnlineOrderTicket = (order) => {
    if (typeof window === "undefined") return;
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;

    const orderDate = order.acceptedAt || order.createdAt || new Date().toISOString();
    const displayDate = new Date(orderDate).toLocaleString();
    const itemsHtml = (order.items || [])
      .map((item) => {
        const portionLabel = item.portion
          ? ` (${formatPortionLabel(item.portion)})`
          : "";
        const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
        return `${item.quantity} × ${item.name}${portionLabel} - £${lineTotal.toFixed(2)}`;
      })
      .join("<br/>");

    const customerInfo = order.customer || {};
    const total = Number(order.total || 0).toFixed(2);

    const paymentSummary =
      order.paymentMethod === "Card"
        ? "Card payment to be collected securely by phone (never store card details)."
        : `Payment method: ${order.paymentMethod || "Cash"}`;

    const statusSummary = order.status ? `Status: ${order.status}` : "Status: Pending";

    const content = `
      <html>
        <head>
          <title>Online Order - ${order.orderId}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: monospace; padding: 8px; font-size: 12px; width: 80mm; margin: 0 auto; }
            h1 { text-align: center; margin-bottom: 2px; font-size: 18px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .order-number { font-size: 16px; font-weight: bold; text-align: center; margin: 4px 0; }
            .total { font-size: 14px; font-weight: bold; text-align: right; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; margin-top: 4px; }
            .note { font-size: 10px; margin-top: 3px; }
          </style>
        </head>
        <body>
          <h1>The MoMos</h1>
          <div class="center">Online Order Ticket</div>
          <div class="center">340 Kingston Road, SW20 8LR</div>
          <div class="center">Tel: 0208 123 4567 • themomos.co.uk</div>
          <div class="line"></div>
          <div class="order-number">Order #${order.orderId}</div>
          <div>Date: ${displayDate}</div>
          <div>${paymentSummary}</div>
          <div>${statusSummary}</div>
          <div class="line"></div>
          <div class="section-title">Customer</div>
          <div>Name: ${customerInfo.name || "-"}</div>
          <div>Phone: ${customerInfo.phone || "-"}</div>
          <div>Address: ${customerInfo.address || "-"}</div>
          <div>Postal: ${customerInfo.postalCode || "-"}</div>
          ${customerInfo.notes ? `<div>Notes: ${customerInfo.notes}</div>` : ""}
          <div class="line"></div>
          <div class="section-title">Items</div>
          ${itemsHtml}
          <div class="line"></div>
          <div class="total">Total: £${total}</div>
          <div class="line"></div>
          <div class="center note">Card payments require an immediate phone call to capture details offline.</div>
          <div class="center note">Serve hot • Thank you!</div>
        </body>
      </html>
    `;

    receiptWindow.document.write(content);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
    receiptWindow.close();
  };

  const acceptOnlineOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/saveOrder/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Unable to accept order");
      }

      setIncomingOnlineOrders((prev) => {
        const remaining = prev.filter((o) => o.orderId !== orderId);
        setShowOnlineOrderModal(remaining.length > 0);
        return remaining;
      });

      triggerToast(`Online order #${orderId} accepted`);
      printOnlineOrderTicket(result.order || { orderId, items: [] });
    } catch (error) {
      console.error("Accept order failed", error);
      alert(`Failed to accept order: ${error.message}`);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    closeCategoryModal();
    setExpandedCategory(findFirstAvailableCategory(menu));
  };

  const handleSearchItemSelect = (result) => {
    handleSelectPortion(result.item);
    setSearchTerm("");
  };

  return (
    <StaffGate>
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
                    searchResults.map((result, idx) => {
                      const portionOptions = getValidPortions(result.item);
                      const multiplePortions = portionOptions.length > 1;
                      const basePrice = portionOptions.length > 0
                        ? Math.min(...portionOptions.map(([, value]) => value))
                        : resolvePrice(result.item);
                      const priceLabel = multiplePortions
                        ? `From £${basePrice.toFixed(2)}`
                        : `£${basePrice.toFixed(2)}`;
                      return (
                        <button
                          key={`${result.item.id}-${idx}`}
                          type="button"
                          onClick={() => handleSearchItemSelect(result)}
                          className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-[#0f1628] px-4 py-3 text-left text-sm shadow-sm shadow-black/10 transition hover:border-[#f26b30] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-white">{result.item.name}</p>
                            <p className="text-xs text-slate-400">{result.categoryKey}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              {multiplePortions ? "Multiple portions" : "Single portion"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="rounded-full bg-[#f26b30]/10 px-3 py-1 text-xs font-semibold text-[#f26b30]">
                              {priceLabel}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              Tap to add
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Categories</h3>
                  <p className="text-xs text-slate-400">Tap a category to focus; items open in a popup for speed.</p>
                </div>
                <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
                  {availableCategoryCount} groups
                </span>
              </div>

              {categories.length > 0 && (
                <div className="mt-4 overflow-x-auto pb-2">
                  <div className="flex gap-2">
                    {categories.map(({ label, items }) => {
                      const availableCount = (items || []).filter((item) => item.isAvailable !== false).length;
                      if (availableCount === 0) return null;
                      return (
                        <button
                          key={`quick-${label}`}
                          type="button"
                          onClick={() => openCategoryModal(label)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#10172d] px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-200 transition hover:border-[#f26b30] hover:text-white"
                        >
                          <span>{label}</span>
                          <span className="rounded-full bg-[#f26b30]/15 px-2 py-0.5 text-[11px] font-semibold text-[#f26b30]">
                            {availableCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {menuLoading ? (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1628]/80 px-4 py-3 text-sm text-slate-300">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-[#f26b30]"></span>
                  Loading menu…
                </div>
              ) : menuError ? (
                <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                  <p className="mb-3 font-semibold">We could not load the menu.</p>
                  <p className="text-xs text-red-100/80">{menuError}</p>
                  <button className={`${actionButtonClass} mt-4`} onClick={loadMenu}>
                    Try again
                  </button>
                </div>
              ) : categories.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-white/10 bg-[#0f1628]/60 px-4 py-4 text-sm italic text-slate-400">
                  No menu items available. Import the latest menu from the admin console to get started.
                </p>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {categories.map(({ label, items }) => renderCategory(label, items))}
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
                {paymentMethod === "Card" && (
                  <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-[#f26b30]/30 bg-[#f26b30]/10 px-4 py-3 text-xs text-[#f6ceb5]">
                    <p className="text-[#fbd7c1] font-semibold uppercase tracking-[0.2em]">Card order protocol</p>
                    <p className="mt-1 text-[#fde5d7]/80">
                      Call the customer straight away and take their card details securely over the phone. Do not store the card number in the system. Once payment is confirmed, tick "Payment received" so the receipt prints for the kitchen.
                    </p>
                  </div>
                )}
              </div>
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
                    {cartCount} item{cartCount === 1 ? "" : "s"} · £{total.toFixed(2)}
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-400 lg:inline-flex">
                      Ready
                    </span>
                    {cart.length > 0 && (
                      <button
                        className="hidden items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-[#f26b30] hover:text-white lg:inline-flex"
                        onClick={clearCart}
                      >
                        ⟲ Clear
                      </button>
                    )}
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
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white">
                            {item.name}
                            {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                          </p>
                          <button
                            className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-red-400/60 hover:text-red-200"
                            onClick={() => removeItem(item)}
                            title="Remove item"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>£{item.price.toFixed(2)} each</span>
                          <span className="font-semibold text-slate-200">
                            Line: £{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1">
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-lg text-slate-100"
                          onClick={() => updateQuantity(item, -1)}
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f26b30] text-lg text-white"
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

                  <div className="flex flex-col gap-3 text-xs text-slate-400 lg:flex-row lg:items-start lg:gap-4">
                    <div className="flex flex-1 flex-col gap-2">
                      <span className="font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Discount (%)
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          placeholder="Enter %"
                          onChange={(e) =>
                            setDiscountPercent(e.target.value.replace(/[^0-9.]/g, ""))
                          }
                          className={`${inputClass} w-24 text-right`}
                        />
                        <div className="flex flex-wrap items-center gap-1">
                          {quickDiscountOptions.map((value) => (
                            <button
                              key={`discount-${value}`}
                              type="button"
                              className={buildTogglePillClass(
                                Number(discountPercent || 0) === value
                              )}
                              onClick={() =>
                                setDiscountPercent(value === 0 ? "" : String(value))
                              }
                            >
                              {value}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <span className="font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Payment Method
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {paymentOptions.map((option) => (
                          <button
                            key={`payment-${option}`}
                            type="button"
                            className={buildTogglePillClass(paymentMethod === option)}
                            onClick={() => setPaymentMethod(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label
                      className="flex items-center gap-2 self-start rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-300"
                      title="Toggle once payment is confirmed so the receipt can be printed."
                    >
                      <input
                        type="checkbox"
                        checked={isPaid}
                        onChange={() => setIsPaid(!isPaid)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-[#f26b30]"
                      />
                      Payment received
                    </label>
                  </div>
                  {paymentMethod === "Card" && (
                    <div className="rounded-xl border border-[#f26b30]/30 bg-[#f26b30]/10 px-4 py-3 text-xs text-[#f6ceb5]">
                      Card orders: call the customer to take payment securely by phone. Do not store card details. Once payment is complete, tick "Payment received" to print the receipt.
                    </div>
                  )}

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

        {categoryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
            onClick={closeCategoryModal}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-[#101828] p-6 text-slate-100 shadow-2xl shadow-black/40"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Focused view</p>
                  <h3 className="text-2xl font-semibold text-white">{categoryModal}</h3>
                </div>
                <button
                  className={`${subtleButtonClass} mt-4 sm:mt-0`}
                  onClick={closeCategoryModal}
                >
                  Close
                </button>
              </div>
              <div className="mt-6 max-h-[65vh] overflow-y-auto pr-1">
                {renderItems(modalItems, modalFocusItemId)}
              </div>
            </div>
          </div>
        )}

        {detailItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
            onClick={() => setDetailItem(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#101828] p-6 text-slate-100 shadow-2xl shadow-black/40"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white">{detailItem.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {detailItem.description?.trim() || detailItem.ingredients?.join(", ") || "Ask the kitchen for the latest prep."}
              </p>
              <div className="mt-4 grid gap-2 text-xs text-slate-400">
                <span>🌶️ {detailItem.spicyLevel || "Mild"}</span>
                <span>⚠️ {(detailItem.allergens || []).join(", ") || "No listed allergens"}</span>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#f26b30] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/25 transition hover:bg-[#ff7a3e]"
                  onClick={() => {
                    handleSelectPortion(detailItem);
                    setDetailItem(null);
                  }}
                >
                  Add to cart
                </button>
                <button
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
                  onClick={() => setDetailItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101828] p-6 text-center text-slate-100 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
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
                Payment received • Print receipt
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
  </StaffGate>
  )};
