import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/common/Navbar";
import StaffGate from "../components/common/StaffGate";
import OrderHeader from "../components/order/OrderHeader";
import MenuSearch from "../components/order/MenuSearch";
import CategoryGrid from "../components/order/CategoryGrid";
import OrderInfoForm from "../components/order/OrderInfoForm";
import CartPanel from "../components/order/CartPanel";
import OrderHistoryShortcuts from "../components/order/OrderHistoryShortcuts";
import CategoryModal from "../components/order/CategoryModal";
import ItemDetailModal from "../components/order/ItemDetailModal";
import PortionModal from "../components/order/PortionModal";
import ReceiptModal from "../components/order/ReceiptModal";
import IncomingOrderModal from "../components/order/IncomingOrderModal";
import FloatingCartButton from "../components/order/FloatingCartButton";
import ToastNotification from "../components/order/ToastNotification";
import CustomItemModal from "../components/order/CustomItemModal";
import { formatPortionLabel, getValidPortions, resolvePrice } from "../utils/orderUtils";

const INITIAL_CUSTOMER = {
  name: "",
  phone: "",
  address: "",
  postalCode: "",
  notes: "",
};

const createInitialCustomer = () => ({ ...INITIAL_CUSTOMER });

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
  const [receiptTimestamp, setReceiptTimestamp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isPaid, setIsPaid] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountInput, setDiscountInput] = useState("");
  const [orderType, setOrderType] = useState("Dine In");
  const [customer, setCustomer] = useState(() => createInitialCustomer());
  const [amountReceived, setAmountReceived] = useState("");
  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({
    name: "",
    price: "",
    quantity: 1,
  });
  const resetCustomItemForm = useCallback(() => {
    setCustomItemForm({ name: "", price: "", quantity: 1 });
  }, []);
  const resetOrderState = useCallback(() => {
    setCart([]);
    setDiscountInput("");
    setDiscountType("percentage");
    setIsPaid(false);
    setAmountReceived("");
    setPaymentMethod("Cash");
    setOrderNumber("");
    setReceiptTimestamp("");
    setCustomer(createInitialCustomer());
    setCustomItemModalOpen(false);
    resetCustomItemForm();
  }, [resetCustomItemForm]);
  const [incomingOnlineOrders, setIncomingOnlineOrders] = useState([]);
  const [showOnlineOrderModal, setShowOnlineOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [navHidden, setNavHidden] = useState(false);

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
  const lastScrollYRef = useRef(0);
  const cartItemsListRef = useRef(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      const current = window.scrollY;
      const previous = lastScrollYRef.current;

      if (current < 120) {
        setNavHidden(false);
      } else if (current > previous + 12 && current > 160) {
        setNavHidden(true);
      } else if (current < previous - 12) {
        setNavHidden(false);
      }

      lastScrollYRef.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Poll for new online orders every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/saveOrder?source=customer&status=pending");
        if (!res.ok) {
          // Silently fail if API returns error (e.g., DB not connected)
          return;
        }
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          setIncomingOnlineOrders(data.orders);
          setShowOnlineOrderModal(true);
          const audio = new Audio("/assets/ringtone.mp3");
          audio.play();
        }
      } catch (error) {
        // Silently fail - don't show errors for polling failures
        console.warn("Order polling failed:", error.message);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!cartInitRef.current) {
      // Keep cart closed on mobile viewport, open on desktop only
      setShowCart(!isMobileViewport);
      cartInitRef.current = true;
      return;
    }
    // Only auto-open on desktop, keep mobile closed unless user clicks
    if (!isMobileViewport) {
      setShowCart(true);
    }
    // Never auto-open on mobile after initial load
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
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 caret-[#f26b30] focus:border-[#f26b30] focus:outline-none focus:ring-2 focus:ring-[#f26b30]/30";
  const actionButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[#f26b30] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#f26b30]/20 transition hover:bg-[#ff773c] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  const subtleButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#f26b30] hover:text-[#f26b30] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  const paymentOptions = ["Cash", "Card"];

  useEffect(() => {
    if (searchResults.length > 0) {
      setExpandedCategory(searchResults[0].categoryKey);
    } else if (hasActiveSearch) {
      setExpandedCategory(null);
    }
  }, [hasActiveSearch, searchResults]);

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
          note: "",
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

  const focusCartItems = useCallback(() => {
    if (isMobileViewport) {
      setShowCart(true);
    }
    requestAnimationFrame(() => {
      if (cartItemsListRef.current) {
        cartItemsListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [isMobileViewport]);

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
    setDiscountInput("");
    setDiscountType("percentage");
    setIsPaid(false);
    setAmountReceived("");
    setPaymentMethod("Cash");
    setOrderNumber("");
    setReceiptTimestamp("");
    resetCustomItemForm();
    setCustomItemModalOpen(false);
  };

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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const parsedDiscount = Number(discountInput);
  const rawDiscount =
    !Number.isFinite(parsedDiscount) || parsedDiscount <= 0
      ? 0
      : discountType === "percentage"
      ? (subtotal * parsedDiscount) / 100
      : parsedDiscount;
  const discountValue = Math.min(rawDiscount, subtotal);

  const taxAmount = 0;
  const totalBeforeTax = Math.max(subtotal - discountValue, 0);
  const total = totalBeforeTax + taxAmount;

  const amountReceivedNumber = Number(amountReceived) || 0;
  const changeDue = paymentMethod === "Cash" ? Math.max(amountReceivedNumber - total, 0) : 0;

  function generateOrderId() {
    // Generates a random 5-digit number as a string, padded if needed
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      window.alert("No items in the order!");
      return;
    }

    if (paymentMethod === "Card" && !isPaid) {
      const confirmProceed = window.confirm(
        "Card payment has not been marked as received. Continue and leave the order as pending?"
      );
      if (!confirmProceed) {
        return;
      }
    }

    const orderId = generateOrderId();
    const timestamp = new Date().toLocaleString();
    
    // Set order details immediately
    setOrderNumber(orderId);
    setReceiptTimestamp(timestamp);
    
    // Check if this is a new customer (postal code not in system before)
    let isNewCustomer = true;
    if (customer.postalCode) {
      try {
        const response = await fetch(`/api/saveOrder?postalCode=${encodeURIComponent(customer.postalCode)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.orders && data.orders.length > 0) {
            isNewCustomer = false;
          }
        }
      } catch (error) {
        console.warn("Could not check customer history:", error);
      }
    }
    
    setIsNewCustomer(isNewCustomer);
    
    const orderData = {
      orderId,
      orderNumber: orderId,
      timestamp,
      orderType,
      customer,
      customerName: customer.name,
      paymentMethod,
      isPaid,
      amountReceived: paymentMethod === "Cash" ? amountReceivedNumber : total,
      changeDue,
      total,
      isNewCustomer,
      totals: {
        subtotal,
        discount: {
          type: discountType,
          input: discountInput,
          value: discountValue,
        },
        tax: taxAmount,
        grandTotal: total,
      },
      items: cart,
    };

    try {
      const response = await fetch("/api/saveOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error("Database not configured. Order recorded locally only.");
      }
      
      const result = await response.json();
      if (result.success) {
        triggerToast(`Order #${orderId} saved to database!`);
      } else {
        triggerToast(`Order #${orderId} recorded (database unavailable)`);
        console.warn("Database save failed:", result.error);
      }
    } catch (error) {
      // Don't block the user - just show a friendly message
      triggerToast(`Order #${orderId} recorded (database not configured)`);
      console.warn("Database not available:", error.message);
    }
    
    // Reset after a short delay regardless of database status
    setTimeout(() => {
      resetOrderState();
    }, 1500);
  };

  const handleSaveAndPrint = async () => {
    if (cart.length === 0) {
      window.alert("No items in the order!");
      return;
    }

    if (paymentMethod === "Card" && !isPaid) {
      const confirmProceed = window.confirm(
        "Card payment has not been marked as received. Continue and leave the order as pending?"
      );
      if (!confirmProceed) {
        return;
      }
    }

    const orderId = generateOrderId();
    const timestamp = new Date().toLocaleString();
    
    // Set order details immediately for printing
    setOrderNumber(orderId);
    setReceiptTimestamp(timestamp);
    
    // Check if this is a new customer (non-blocking)
    let isNewCustomer = true;
    if (customer.postalCode) {
      try {
        const response = await fetch(`/api/saveOrder?postalCode=${encodeURIComponent(customer.postalCode)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.orders && data.orders.length > 0) {
            isNewCustomer = false;
          }
        }
      } catch (error) {
        console.warn("Could not check customer history:", error);
      }
    }
    
    setIsNewCustomer(isNewCustomer);
    
    const orderData = {
      orderId,
      orderNumber: orderId,
      timestamp,
      orderType,
      customer,
      customerName: customer.name,
      paymentMethod,
      isPaid,
      amountReceived: paymentMethod === "Cash" ? amountReceivedNumber : total,
      changeDue,
      total,
      isNewCustomer,
      totals: {
        subtotal,
        discount: {
          type: discountType,
          input: discountInput,
          value: discountValue,
        },
        tax: taxAmount,
        grandTotal: total,
      },
      items: cart,
    };

    // Try to save to database in background (non-blocking)
    fetch("/api/saveOrder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Database not available");
      })
      .then(result => {
        if (result.success) {
          console.log(`Order #${orderId} saved to database`);
        }
      })
      .catch(error => {
        console.warn("Order saved locally only (database not configured):", error.message);
      });

    // Print receipt immediately without waiting for database
    triggerToast(`Printing receipt #${orderId}...`);
    setTimeout(() => {
      handlePrintReceipt();
      // Reset after printing
      setTimeout(() => {
        resetOrderState();
      }, 500);
    }, 300);
  };

  const handlePrintReceipt = (receiptData = null) => {
    console.log("=== PRINT RECEIPT CALLED ===");
    
    // Use passed data or fall back to current state
    const printCart = receiptData?.cart || cart;
    const printOrderNumber = receiptData?.orderNumber || orderNumber;
    const printTimestamp = receiptData?.timestamp || receiptTimestamp;
    const printOrderType = receiptData?.orderType || orderType;
    const printCustomer = receiptData?.customer || customer;
    const printPaymentMethod = receiptData?.paymentMethod || paymentMethod;
    const printIsPaid = receiptData?.isPaid !== undefined ? receiptData.isPaid : isPaid;
    
    if (printCart.length === 0) {
      window.alert("Nothing to print — the cart is empty.");
      return;
    }

    const currentOrderNumber = printOrderNumber || generateOrderId();
    if (!orderNumber && !receiptData) {
      setOrderNumber(currentOrderNumber);
    }

    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) {
      window.alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const effectiveTimestamp = printTimestamp || new Date().toLocaleString();
    if (!receiptTimestamp && !receiptData) {
      setReceiptTimestamp(effectiveTimestamp);
    }

    // Calculate subtotal and build items list
    let subtotalAmount = 0;
    const itemsList = [];
    
    printCart.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const priceEach = Number(item.price) || 0;
      const lineTotal = qty * priceEach;
      subtotalAmount += lineTotal;
      
      const portion = item.portion ? ` (${formatPortionLabel(item.portion)})` : "";
      itemsList.push({
        name: String(item.name || "Item"),
        portion: portion,
        qty: qty,
        price: lineTotal.toFixed(2),
        note: item.note || ""
      });
    });

    // Calculate discount
    const parsedDiscount = Number(discountInput) || 0;
    const rawDiscount = 
      !discountInput || discountInput === "" 
        ? 0 
        : discountType === "percentage"
        ? (subtotalAmount * parsedDiscount) / 100
        : parsedDiscount;
    const discountAmount = Math.min(rawDiscount, subtotalAmount);
    
    // Calculate final total
    const finalTotal = Math.max(subtotalAmount - discountAmount, 0);
    
    const subtotalStr = subtotalAmount.toFixed(2);
    const discountStr = discountAmount.toFixed(2);
    const totalAmount = finalTotal.toFixed(2);
    
    // Build customer info
    const customerInfo = {
      name: printCustomer.name || "",
      phone: printCustomer.phone || "",
      address: printCustomer.address || "",
      postalCode: printCustomer.postalCode || ""
    };

    // Build HTML using simple inline-block layout for thermal printer
    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
    htmlContent += '<title>Receipt ' + currentOrderNumber + '</title>';
    htmlContent += '<style>';
    htmlContent += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    htmlContent += '@page { margin: 0; size: 80mm auto; }';
    htmlContent += 'body { font-family: "Courier New", monospace; width: 44mm; margin: 0; padding: 0; background: white; font-size: 14px; line-height: 1.5; text-align: left; }';
    htmlContent += '.divider { border-bottom: 1px dashed #333; margin: 5px 0; height: 1px; }';
    htmlContent += '.center { text-align: center; }';
    htmlContent += '.bold { font-weight: bold; }';
    htmlContent += '.line { margin: 2px 0; overflow: hidden; }';
    htmlContent += '.left { float: left; max-width: 60%; }';
    htmlContent += '.right { float: right; text-align: right; }';
    htmlContent += '.clear { clear: both; }';
    htmlContent += '@media print { body { width: 44mm; margin: 0; padding: 0; } }';
    htmlContent += '</style></head><body>';
    
    // Header
    htmlContent += '<div class="center bold" style="font-size: 16px; margin-bottom: 2px;">The MoMos</div>';
    htmlContent += '<div class="center" style="font-size: 11px; margin-bottom: 5px;">340 Kingston Road, SW20 8LR<br>0208 123 4567</div>';
    htmlContent += '<div class="divider"></div>';
    
    // Order number
    htmlContent += '<div class="center bold" style="font-size: 28px; margin: 5px 0;">#' + currentOrderNumber + '</div>';
    htmlContent += '<div class="center" style="font-size: 12px; margin-bottom: 5px;">' + String(printOrderType) + '<br>' + effectiveTimestamp + '</div>';
    htmlContent += '<div class="divider"></div>';
    
    // Customer details
    if (customerInfo.name || customerInfo.phone) {
      htmlContent += '<div style="margin: 5px 0; padding: 4px 0; border-bottom: 1px solid #000;">';
      if (customerInfo.name) {
        htmlContent += '<div class="bold" style="font-size: 14px; margin-bottom: 2px;">' + customerInfo.name + '</div>';
      }
      if (customerInfo.phone) {
        htmlContent += '<div class="bold" style="font-size: 16px; margin-bottom: 2px;">' + customerInfo.phone + '</div>';
      }
      if (customerInfo.address) {
        htmlContent += '<div style="font-size: 11px; margin-bottom: 2px;">' + customerInfo.address + '</div>';
      }
      if (customerInfo.postalCode) {
        htmlContent += '<div class="bold" style="font-size: 16px;">' + customerInfo.postalCode + '</div>';
      }
      htmlContent += '</div><div class="divider"></div>';
    }
    
    // Items - simple inline format
    itemsList.forEach(item => {
      htmlContent += '<div class="bold" style="font-size: 17px; margin: 3px 0;">';
      htmlContent += item.qty + 'x ' + item.name + item.portion + ' &pound;' + item.price;
      htmlContent += '</div>';
      if (item.note) {
        htmlContent += '<div style="font-size: 11px; padding-left: 4px; color: #555; margin: 2px 0 4px 0;">Note: ' + item.note + '</div>';
      }
    });
    
    htmlContent += '<div class="divider"></div>';
    
    // Subtotal
    htmlContent += '<div style="font-size: 15px; margin: 4px 0;">Subtotal: &pound;' + subtotalStr + '</div>';
    
    // Discount
    if (discountAmount > 0) {
      let discountLabel = 'Discount:';
      if (discountType === 'percentage' && discountInput) {
        discountLabel = 'Discount (' + discountInput + '%):';
      }
      htmlContent += '<div style="font-size: 13px; margin: 5px 0;">' + discountLabel + ' -&pound;' + discountStr + '</div>';
    }
    
    htmlContent += '<div class="divider"></div>';
    
    // Total
    htmlContent += '<div class="bold" style="font-size: 24px; margin: 12px 0; padding: 10px 0; border-top: 2px solid #000; border-bottom: 2px solid #000;">';
    htmlContent += 'TOTAL: &pound;' + totalAmount;
    htmlContent += '</div>';
    
    htmlContent += '<div class="divider"></div>';
    
    // Payment status
    const paymentMethodStr = String(printPaymentMethod);
    const paymentStatus = printIsPaid ? 'Paid' : 'Not Paid';
    const paymentText = paymentMethodStr + ' ' + paymentStatus;
    htmlContent += '<div class="center bold" style="font-size: 18px; margin: 8px 0; text-decoration: underline;">';
    htmlContent += paymentText;
    htmlContent += '</div>';
    htmlContent += '<div class="divider"></div>';
    htmlContent += '<div class="center" style="font-size: 15px; margin-top: 10px;">Thank You!</div>';
    
    htmlContent += '</body></html>';

    console.log("Total amount:", totalAmount);
    console.log("HTML Content generated, length:", htmlContent.length);
    
    receiptWindow.document.write(htmlContent);
    receiptWindow.document.close();
    
    // Wait for content to fully render before printing
    setTimeout(() => {
      receiptWindow.focus();
      receiptWindow.print();
      
      // Only reset state if not printing from saved receipt data
      if (!receiptData) {
        setTimeout(() => {
          resetOrderState();
          setShowReceipt(false);
          triggerToast("Receipt sent to printer");
        }, 1000);
      }
    }, 500);
  };

  const handlePreviewReceipt = () => {
    if (cart.length === 0) {
      window.alert("No items in the cart to preview.");
      return;
    }

    const nextOrderNumber = orderNumber || generateOrderId();
    if (!orderNumber) {
      setOrderNumber(nextOrderNumber);
    }

    setReceiptTimestamp(new Date().toLocaleString());
    setShowReceipt(true);
  };

  const handlePrintBillOnly = () => {
    if (cart.length === 0) {
      window.alert("No items in the cart to print.");
      return;
    }

    // Generate order number if needed
    const currentOrderNumber = orderNumber || generateOrderId();
    if (!orderNumber) {
      setOrderNumber(currentOrderNumber);
    }

    // Print directly without saving to database
    handlePrintReceipt();
  };

  const printOnlineOrderTicket = (order) => {
    if (typeof window === "undefined") return;
    
    // Convert online order format to match our standard receipt data format
    const receiptData = {
      cart: order.items || [],
      orderNumber: order.orderId,
      timestamp: order.acceptedAt || order.createdAt ? new Date(order.acceptedAt || order.createdAt).toLocaleString() : new Date().toLocaleString(),
      orderType: "ONLINE ORDER - DELIVER HOT",
      customer: order.customer || {},
      paymentMethod: order.paymentMethod || "Online",
      isPaid: order.isPaid || false
    };
    
    // Use the same print function for consistency
    handlePrintReceipt(receiptData);
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

  const handleCustomerChange = (field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiscountInputChange = (value) => {
    setDiscountInput(value.replace(/[^0-9.]/g, ""));
  };

  const handleDiscountTypeChange = (value) => {
    setDiscountType(value);
    setDiscountInput("");
  };

  const handlePaymentMethodChange = (option) => {
    setPaymentMethod(option);
    if (option === "Cash") {
      if (isPaid && !amountReceived) {
        setAmountReceived(total.toFixed(2));
      }
    } else {
      setAmountReceived("");
    }
  };

  const handleAmountReceivedChange = (value) => {
    setAmountReceived(value.replace(/[^0-9.]/g, ""));
  };

  const handleTogglePaid = () => {
    setIsPaid((prev) => {
      const next = !prev;

      if (paymentMethod === "Cash") {
        if (next && !amountReceived) {
          setAmountReceived(total.toFixed(2));
        }
        if (!next) {
          setAmountReceived("");
        }
      }

      return next;
    });
  };

  const handleItemNoteChange = (targetItem, note) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === targetItem.id && item.portion === targetItem.portion
          ? { ...item, note }
          : item
      )
    );
  };

  const handleOpenCustomItemModal = () => {
    resetCustomItemForm();
    setCustomItemModalOpen(true);
  };

  const handleCloseCustomItemModal = () => {
    setCustomItemModalOpen(false);
    resetCustomItemForm();
  };

  const handleCustomItemFieldChange = (field, value) => {
    setCustomItemForm((prev) => ({
      ...prev,
      [field]: field === "price" ? value.replace(/[^0-9.]/g, "") : value,
    }));
  };

  const handleCustomItemQuantityChange = (delta) => {
    setCustomItemForm((prev) => {
      const currentQuantity = Number(prev.quantity) || 1;
      const nextQuantity = Math.max(1, currentQuantity + delta);
      return { ...prev, quantity: nextQuantity };
    });
  };

  const handleSaveCustomItem = () => {
    const name = customItemForm.name.trim();
    const priceValue = parseFloat(customItemForm.price);
    const quantityValue = Math.max(1, Math.round(Number(customItemForm.quantity) || 1));

    if (!name || !Number.isFinite(priceValue) || priceValue <= 0 || quantityValue <= 0) {
      window.alert("Enter a valid name, price, and quantity for the custom item.");
      return;
    }

    const unitPrice = Number(priceValue.toFixed(2));

    const customItem = {
      id: `custom-${Date.now()}`,
      name,
      portion: "",
      quantity: quantityValue,
      price: unitPrice,
      description: "Custom entry",
      spicyLevel: "",
      allergens: [],
      isAvailable: true,
      note: "",
    };

    setCart((prev) => [...prev, customItem]);
    setCustomItemModalOpen(false);
    resetCustomItemForm();

    if (isMobileViewport) {
      setShowCart(true);
    }

    triggerToast(`${name} added to cart`);
  };

  const handleHideCart = () => {
    setShowCart(false);
  };

  return (
    <StaffGate>
      <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
        <Navbar scheme="light" isHidden={navHidden} />
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 pb-56 sm:px-6 lg:px-8 lg:pb-12">
        <OrderHeader subtleButtonClass={subtleButtonClass} />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <MenuSearch
              searchTerm={searchTerm}
              onSearchChange={(event) => setSearchTerm(event.target.value)}
              hasActiveSearch={hasActiveSearch}
              searchResults={searchResults}
              onClearSearch={clearSearch}
              onRefreshMenu={loadMenu}
              menuLoading={menuLoading}
              inputClass={inputClass}
              actionButtonClass={actionButtonClass}
              subtleButtonClass={subtleButtonClass}
              onSelectResult={handleSearchItemSelect}
              onViewItemDetails={setDetailItem}
            />

            <CategoryGrid
              categories={categories}
              availableCategoryCount={availableCategoryCount}
              menuLoading={menuLoading}
              menuError={menuError}
              onReload={loadMenu}
              actionButtonClass={actionButtonClass}
              expandedCategory={expandedCategory}
              onOpenCategory={openCategoryModal}
            />

            <OrderInfoForm
              orderType={orderType}
              onOrderTypeChange={setOrderType}
              customer={customer}
              onCustomerChange={handleCustomerChange}
              inputClass={inputClass}
            />
          </div>

          <CartPanel
            cart={cart}
            cartCount={cartCount}
            subtotal={subtotal}
            discountInput={discountInput}
            discountType={discountType}
            onDiscountInputChange={handleDiscountInputChange}
            onDiscountTypeChange={handleDiscountTypeChange}
            discountValue={discountValue}
            taxAmount={taxAmount}
            total={total}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
            paymentOptions={paymentOptions}
            amountReceived={amountReceived}
            onAmountReceivedChange={handleAmountReceivedChange}
            changeDue={changeDue}
            isPaid={isPaid}
            onTogglePaid={handleTogglePaid}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onItemNoteChange={handleItemNoteChange}
            onClearCart={clearCart}
            onOpenCustomItemModal={handleOpenCustomItemModal}
            onPrintBill={handleSaveAndPrint}
            onConfirmOrder={handleSubmitOrder}
            showCart={showCart}
            onHideCart={handleHideCart}
            actionButtonClass={actionButtonClass}
            inputClass={inputClass}
            cartItemsListRef={cartItemsListRef}
            onFocusItems={focusCartItems}
            subtleButtonClass={subtleButtonClass}
          />
        </section>

        <OrderHistoryShortcuts subtleButtonClass={subtleButtonClass} />
      </main>

        <CategoryModal
          isOpen={Boolean(categoryModal)}
          title={categoryModal}
          items={modalItems}
          highlightedId={modalFocusItemId}
          subtleButtonClass={subtleButtonClass}
          onClose={closeCategoryModal}
          onSelectItem={handleSelectPortion}
          onViewItemDetails={setDetailItem}
        />

        <ItemDetailModal
          item={detailItem}
          subtleButtonClass={subtleButtonClass}
          actionButtonClass={actionButtonClass}
          onClose={() => setDetailItem(null)}
          onSelectItem={(item) => {
            handleSelectPortion(item);
            setDetailItem(null);
          }}
        />

        <PortionModal
          item={selectedItem}
          actionButtonClass={actionButtonClass}
          subtleButtonClass={subtleButtonClass}
          onSelectPortion={handlePortionChoice}
          onClose={() => setSelectedItem(null)}
        />

        <CustomItemModal
          isOpen={customItemModalOpen}
          form={customItemForm}
          inputClass={inputClass}
          actionButtonClass={actionButtonClass}
          subtleButtonClass={subtleButtonClass}
          onClose={handleCloseCustomItemModal}
          onFieldChange={handleCustomItemFieldChange}
          onQuantityChange={handleCustomItemQuantityChange}
          onSave={handleSaveCustomItem}
        />

        <ReceiptModal
          isOpen={showReceipt}
          orderNumber={orderNumber}
          timestamp={receiptTimestamp || new Date().toLocaleString()}
          orderType={orderType}
          customer={customer}
          cart={cart}
          subtotal={subtotal}
          discountValue={discountValue}
          discountType={discountType}
          discountInput={discountInput}
          taxAmount={taxAmount}
          total={total}
          paymentMethod={paymentMethod}
          amountReceived={amountReceived}
          changeDue={changeDue}
          isPaid={isPaid}
          isNewCustomer={isNewCustomer}
          actionButtonClass={actionButtonClass}
          subtleButtonClass={subtleButtonClass}
          onPrint={handlePrintReceipt}
          onClose={() => setShowReceipt(false)}
        />

        <IncomingOrderModal
          isOpen={showOnlineOrderModal && incomingOnlineOrders.length > 0}
          orders={incomingOnlineOrders}
          actionButtonClass={actionButtonClass}
          subtleButtonClass={subtleButtonClass}
          onAccept={acceptOnlineOrder}
          onDismiss={() => setShowOnlineOrderModal(false)}
        />

        <FloatingCartButton
          isVisible={isMobileViewport && !showCart}
          cartCount={cartCount}
          onClick={() => setShowCart(true)}
        />

        <ToastNotification isVisible={isToastVisible} message={toastMessage} />
      </div>
    </StaffGate>
  );
}
