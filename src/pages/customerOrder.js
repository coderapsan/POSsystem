import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MENU_CACHE_KEY = "momos-menu-cache";
const MENU_CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const INGREDIENT_FALLBACK = "Ask our team for today's preparation.";

export default function CustomerOrder() {
  const [menu, setMenu] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [modalFocusItemId, setModalFocusItemId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [fulfilmentType, setFulfilmentType] = useState("Delivery");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    postalCode: "",
    notes: "",
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);

  const triggerToast = useCallback((message) => {
    if (!message) return;
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMessage(""), 2200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  const categories = useMemo(() => {
    const list = [];
    Object.entries(menu || {}).forEach(([parent, value]) => {
      if (Array.isArray(value)) {
        list.push({ label: parent, items: value });
      } else if (value && typeof value === "object") {
        Object.entries(value).forEach(([child, items]) => {
          list.push({ label: `${parent} - ${child}`, items: Array.isArray(items) ? items : [] });
        });
      }
    });
    return list;
  }, [menu]);

  const firstAvailableCategory = useMemo(() => {
    for (const entry of categories) {
      if ((entry.items || []).some((item) => item.isAvailable !== false)) {
        return entry.label;
      }
    }
    return null;
  }, [categories]);

  useEffect(() => {
    setActiveCategory((prev) => {
      if (
        prev &&
        categories.some(
          (entry) =>
            entry.label === prev &&
            (entry.items || []).some((item) => item.isAvailable !== false)
        )
      ) {
        return prev;
      }
      return firstAvailableCategory;
    });
  }, [categories, firstAvailableCategory]);

  const applyMenuPayload = useCallback((payload) => {
    setMenu(payload || {});
  }, []);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) {
        const payload = data.menu || {};
        applyMenuPayload(payload);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            MENU_CACHE_KEY,
            JSON.stringify({ data: payload, expiresAt: Date.now() + MENU_CACHE_TTL })
          );
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
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.data && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
        applyMenuPayload(parsed.data);
      }
    } catch (error) {
      console.warn("Unable to parse cached menu", error);
    }
  }, [applyMenuPayload]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const getValidPortions = useCallback(
    (item) =>
      Object.entries(item.price || {})
        .map(([portion, value]) => [portion, Number(value)])
        .filter(([, value]) => Number.isFinite(value) && value > 0),
    []
  );

  const resolvePrice = useCallback(
    (item, portionKey = "") => {
      const valid = getValidPortions(item);
      if (portionKey) {
        const match = valid.find(([portion]) => portion === portionKey);
        if (match) return match[1];
      }
      return valid.length > 0 ? valid[0][1] : 0;
    },
    [getValidPortions]
  );

  const formatPortionLabel = (portion) =>
    portion ? portion.charAt(0).toUpperCase() + portion.slice(1) : "";

  const getItemImage = useCallback((item) => {
    const candidate = item?.image || item?.imageUrl || item?.photo || "";
    if (!candidate) return "";
    if (candidate.startsWith("http") || candidate.startsWith("data:")) {
      return candidate;
    }
    return candidate.startsWith("/") ? candidate : `/assets/images/usedImages/${candidate}`;
  }, []);

  const addToCart = useCallback(
    (item, portion = "") => {
      const normalizedPortion = portion || "";
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
      const portionLabel = normalizedPortion
        ? ` (${formatPortionLabel(normalizedPortion)})`
        : "";
      triggerToast(`${item.name}${portionLabel} added to cart`);
    },
    [resolvePrice, triggerToast]
  );

  const handleSelectItem = useCallback(
    (item) => {
      const portions = getValidPortions(item);
      if (portions.length <= 1) {
        addToCart(item, "");
        return;
      }
      setSelectedItem(item);
    },
    [addToCart, getValidPortions]
  );

  const handlePortionChoice = (portion) => {
    if (!selectedItem) return;
    addToCart(selectedItem, portion);
    setSelectedItem(null);
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

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
    [cart]
  );

  const getItemsForCategory = useCallback(
    (label) => {
      const entry = categories.find((category) => category.label === label);
      if (!entry) return [];
      return (entry.items || []).filter((item) => item.isAvailable !== false);
    },
    [categories]
  );

  const galleryItems = useMemo(() => {
    const seen = new Set();
    const collection = [];
    categories.forEach(({ label, items }) => {
      (items || []).forEach((item) => {
        const image = getItemImage(item);
        if (!image || seen.has(image)) return;
        seen.add(image);
        collection.push({ item, categoryKey: label, image });
      });
    });
    return collection.slice(0, 8);
  }, [categories, getItemImage]);

  const openCategoryModal = useCallback(
    (label, options = {}) => {
      const items = getItemsForCategory(label);
      if (items.length === 0) {
        triggerToast("Items currently unavailable");
        return;
      }
      setActiveCategory(label);
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

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    const matches = [];
    categories.forEach(({ label, items }) => {
      (items || []).forEach((item) => {
        if (item.isAvailable === false) return;
        if (item.name?.toLowerCase().includes(term)) {
          matches.push({ item, categoryKey: label });
        }
      });
    });
    return matches;
  }, [categories, searchTerm]);

  const hasActiveSearch = searchTerm.trim().length > 0;

  const handleSearchSelect = (result) => {
    handleSelectItem(result.item);
    setSearchTerm("");
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }
    if (!customer.name || !customer.phone) {
      alert("Please provide your name and phone number.");
      return;
    }

    const orderPayload = {
      orderId: Math.floor(10000 + Math.random() * 90000).toString(),
      timestamp: new Date().toISOString(),
      customer,
      paymentMethod,
      items: cart,
      total: subtotal,
      source: "customer",
      status: "pending",
      orderType: fulfilmentType,
    };

    try {
      const response = await fetch("/api/saveOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Unable to place order");
      }
      setOrderPlaced(true);
      setOrderId(orderPayload.orderId);
      setCart([]);
      triggerToast("Thank you! Your order has been submitted.");
    } catch (error) {
      alert(`Failed to place order: ${error.message}`);
    }
  };

  const modalItems = useMemo(
    () => (categoryModal ? getItemsForCategory(categoryModal) : []),
    [categoryModal, getItemsForCategory]
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-lg shadow-black/30 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.5em] text-[#f26b30]">Online Ordering</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            The MoMos – Quick Order
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Browse the categories, tap the dishes you love, and your ticket drops straight into the POS for our team to action.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search the menu"
                className="w-full rounded-full border border-white/10 bg-[#10172d] px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                ⌕
              </span>
            </div>
            {hasActiveSearch && (
              <button
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </button>
            )}
          </div>
          {hasActiveSearch && (
            <div className="mt-4 space-y-2">
              {searchResults.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
                  No dishes match your search yet.
                </p>
              ) : (
                searchResults.map((result, index) => (
                  <button
                    key={`${result.item.id}-${index}`}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0f1628] px-4 py-3 text-left text-sm transition hover:border-[#f26b30]"
                    onClick={() => handleSearchSelect(result)}
                  >
                    <span className="text-white">{result.item.name}</span>
                    <span className="text-xs text-slate-400">{result.categoryKey}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </header>

        {orderPlaced ? (
          <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-10 text-center text-slate-100">
            <h2 className="text-2xl font-semibold">Order confirmed</h2>
            <p className="mt-2 text-sm text-emerald-100/80">
              Ticket <span className="font-semibold">#{orderId}</span> is now with our kitchen team.
            </p>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
              onClick={() => setOrderPlaced(false)}
            >
              Start a new order
            </button>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-white">Your details</h2>
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-500">{fulfilmentType}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Full name"
                    value={customer.name}
                    onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none"
                  />
                  <input
                    placeholder="Mobile number"
                    value={customer.phone}
                    onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none"
                  />
                  <input
                    placeholder="Address line"
                    value={customer.address}
                    onChange={(event) => setCustomer({ ...customer, address: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none"
                  />
                  <input
                    placeholder="Postal code"
                    value={customer.postalCode}
                    onChange={(event) => setCustomer({ ...customer, postalCode: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none"
                  />
                  <select
                    value={fulfilmentType}
                    onChange={(event) => setFulfilmentType(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 focus:border-[#f26b30] focus:outline-none"
                  >
                    <option>Delivery</option>
                    <option>Collection</option>
                  </select>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 focus:border-[#f26b30] focus:outline-none"
                  >
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Pay on collection</option>
                  </select>
                  <textarea
                    placeholder="Notes for the kitchen (optional)"
                    value={customer.notes}
                    onChange={(event) => setCustomer({ ...customer, notes: event.target.value })}
                    className="sm:col-span-2 w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Browse the menu</h2>
                    <p className="text-xs text-slate-400">Tap a category to focus. Items open in a popup so you stay on track.</p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300 transition hover:border-[#f26b30] hover:text-white"
                    onClick={loadMenu}
                  >
                    Refresh
                  </button>
                </div>
                {menuLoading ? (
                  <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1628]/80 px-4 py-3 text-sm text-slate-300">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-[#f26b30]"></span>
                    Loading menu…
                  </div>
                ) : menuError ? (
                  <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                    <p className="mb-3 font-semibold">We could not load the menu.</p>
                    <p className="text-xs text-red-100/80">{menuError}</p>
                  </div>
                ) : categories.length === 0 ? (
                  <p className="mt-6 rounded-2xl border border-white/10 bg-[#0f1628]/60 px-4 py-4 text-sm italic text-slate-400">
                    Menu is not available right now. Please check back soon.
                  </p>
                ) : (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map(({ label, items }) => {
                      const availableCount = (items || []).filter((item) => item.isAvailable !== false).length;
                      if (availableCount === 0) return null;
                      const isActive = activeCategory === label;
                      return (
                        <button
                          key={label}
                          className={`rounded-2xl border px-4 py-5 text-left transition ${
                            isActive
                              ? "border-[#f26b30] bg-[#f26b30]/10 text-white"
                              : "border-white/10 bg-[#0f1628]/70 text-slate-200 hover:border-[#f26b30]"
                          }`}
                          onClick={() => openCategoryModal(label)}
                        >
                          <span className="block text-sm font-semibold uppercase tracking-[0.25em]">
                            {availableCount} dishes
                          </span>
                          <span className="mt-2 block text-lg font-semibold">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-[#101828] p-6 shadow-xl shadow-black/40">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Your cart</h2>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                  {cart.length} item{cart.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {cart.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center text-sm text-slate-500">
                    Cart is empty. Tap a dish to add it here.
                  </p>
                ) : (
                  cart.map((item, index) => (
                    <div
                      key={`${item.id}-${item.portion}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.name}
                          {item.portion ? ` (${formatPortionLabel(item.portion)})` : ""}
                        </p>
                        <p className="text-xs text-slate-400">
                          £{Number(item.price || 0).toFixed(2)} × {item.quantity}
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
              <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-white">
                  <span>Total due</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                className="mt-6 w-full rounded-full bg-[#f26b30] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/30 transition hover:bg-[#ff7a3e]"
                onClick={handleSubmitOrder}
              >
                Submit order
              </button>
              {cart.length > 0 && (
                <button
                  className="mt-3 w-full rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
                  onClick={() => setCart([])}
                >
                  Clear cart
                </button>
              )}
            </aside>
          </section>
        )}
      </main>

      {categoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
          onClick={closeCategoryModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-[#101828] p-6 text-slate-100 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Focused view</p>
                <h3 className="text-2xl font-semibold text-white">{categoryModal}</h3>
              </div>
              <button
                className="mt-4 inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white sm:mt-0"
                onClick={closeCategoryModal}
              >
                Close
              </button>
            </div>
            <div className="mt-6 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {modalItems.map((item) => {
                  const isHighlighted = modalFocusItemId === item.id;
                  const portionOptions = getValidPortions(item);
                  const multiplePortions = portionOptions.length > 1;
                  const imageUrl = getItemImage(item);
                  const basePrice = portionOptions.length > 0
                    ? Math.min(...portionOptions.map(([, value]) => value))
                    : resolvePrice(item);
                  return (
                    <div
                      key={item.id}
                      data-customer-item-id={item.id}
                      className={`flex h-full cursor-pointer flex-col gap-3 rounded-2xl border bg-[#0f1628] p-4 transition ${
                        isHighlighted
                          ? "border-[#f26b30] ring-2 ring-[#f26b30]/60"
                          : "border-white/10 hover:border-[#f26b30]"
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="relative overflow-hidden rounded-xl bg-[#111b30]">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="h-40 w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-40 w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-500">
                            Image coming soon
                          </div>
                        )}
                        {multiplePortions && (
                          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
                            Multi-size
                          </span>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            {multiplePortions ? "Multiple portions" : "Single portion"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f26b30]/10 px-3 py-1 text-xs font-semibold text-[#f26b30]">
                          {multiplePortions ? `From £${basePrice.toFixed(2)}` : `£${basePrice.toFixed(2)}`}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {item.description || "Ask our team for today’s chef notes."}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        <span>Spice: {item.spicyLevel || "Mild"}</span>
                        <span>
                          Allergens: {(item.allergens || []).length > 0 ? item.allergens.join(", ") : "None"}
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
              {detailItem.description?.trim() || detailItem.ingredients?.join(", ") || INGREDIENT_FALLBACK}
            </p>
            <div className="mt-4 grid gap-2 text-xs text-slate-400">
              <span>🌶️ {detailItem.spicyLevel || "Mild"}</span>
              <span>⚠️ {(detailItem.allergens || []).join(", ") || "No listed allergens"}</span>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#f26b30] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/25 transition hover:bg-[#ff7a3e]"
                onClick={() => {
                  handleSelectItem(detailItem);
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
              Choose a portion for {selectedItem.name}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Select a size so we prepare it exactly how you like it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {getValidPortions(selectedItem).map(([portion, value]) => (
                <button
                  key={portion}
                  className="inline-flex min-w-[150px] items-center justify-center rounded-full bg-[#f26b30] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/30 transition hover:bg-[#ff7a3e]"
                  onClick={() => handlePortionChoice(portion)}
                >
                  {formatPortionLabel(portion)} (£{value.toFixed(2)})
                </button>
              ))}
            </div>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f26b30] hover:text-white"
              onClick={() => setSelectedItem(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#111b30]/95 px-6 py-3 text-sm font-medium text-slate-100 shadow-xl shadow-black/40">
          ✅ {toastMessage}
        </div>
      )}
    </div>
  );
}
