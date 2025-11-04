// src/lib/orders.js

// Save order to localStorage (temporary store)
export function saveOrder(order) {
  if (typeof window !== 'undefined') {
    const existing = JSON.parse(localStorage.getItem('orders')) || [];
    const updated = [order, ...existing];
    localStorage.setItem('orders', JSON.stringify(updated));
  }
}

// Get all saved orders
export function getOrders() {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('orders')) || [];
  }
  return [];
}

// Clear all orders (for admin/test)
export function clearOrders() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('orders');
  }
}
