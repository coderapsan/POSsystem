# Cart Button Functions - Quick Reference

## 🎯 Button Overview

The cart panel has **two main action buttons** with distinct purposes:

### 1. **"Save Order"** (Left Button - White/Gray)
- **Action**: Saves order to database
- **Flow**: Save → Show success message → Reset cart
- **Use case**: When you want to record the order but don't need a physical receipt
- **Saves to**: Order history ✅
- **Prints receipt**: ❌

### 2. **"Print Receipt"** (Right Button - Orange)
- **Action**: Saves order to database AND prints receipt
- **Flow**: Save → Show success → Open print dialog → Reset cart
- **Use case**: Standard checkout process - customer needs a receipt
- **Saves to**: Order history ✅
- **Prints receipt**: ✅

---

## 📊 Feature Comparison

| Feature | Save Order | Print Receipt |
|---------|-----------|---------------|
| Saves to database | ✅ Yes | ✅ Yes |
| Saves to order history | ✅ Yes | ✅ Yes |
| Prints receipt | ❌ No | ✅ Yes |
| Resets cart | ✅ Yes | ✅ Yes |
| Requires items in cart | ✅ Yes | ✅ Yes |
| Checks payment status | ✅ Yes | ✅ Yes |

---

## 🔄 Complete Flow Diagram

```
User adds items to cart
         ↓
User fills customer info (optional)
         ↓
User selects payment method & marks as paid
         ↓
         ├─── Click "Save Order" ────────────┐
         │                                    ↓
         │                         Save to database
         │                                    ↓
         │                         Show success toast
         │                                    ↓
         │                              Reset cart
         │
         └─── Click "Print Receipt" ─────────┐
                                              ↓
                                   Save to database
                                              ↓
                                   Show success toast
                                              ↓
                                   Open print dialog
                                              ↓
                                   User prints receipt
                                              ↓
                                        Reset cart
```

---

## 💡 Usage Examples

### Scenario 1: Walk-in customer pays cash, wants receipt
1. Add items to cart
2. Select **"Cash"** payment
3. Enter amount received
4. Check **"order paid"**
5. Click **"Print Receipt"** (Orange button)
6. Receipt prints automatically
7. Cart resets for next customer

### Scenario 2: Phone order for later pickup, no receipt needed yet
1. Take order over phone
2. Add items to cart
3. Enter customer phone/name
4. Leave payment as **"Cash"** or **"Card"**
5. Leave **"order paid"** unchecked (they'll pay on pickup)
6. Click **"Save Order"** (White button)
7. Order saved to history, cart resets

### Scenario 3: Table service, bill printed but not paid yet
1. Take table order
2. Add items to cart
3. Select **"Dine In"** order type
4. Leave **"order paid"** unchecked
5. Click **"Print Receipt"** to print bill for table
6. Later: mark as paid and finalize in order history

---

## ⚠️ Important Notes

### Both buttons save to order history!
- Every order is permanently saved in the database
- View all orders at `/order-history`
- Can reprint receipts from order history

### Payment status reminder
- If payment method is **"Card"** and **"order paid"** is not checked:
  - System will prompt: "Card payment not marked as received. Continue?"
  - Allows you to save unpaid orders

### Order numbering
- Each order gets a unique 5-digit ID (e.g., 12345)
- Order ID appears on receipt and in order history
- Used for tracking and reference

---

## 🔍 Button State Logic

### Buttons are **disabled** when:
- Cart is empty (no items)
- *(Both buttons always check this)*

### Buttons are **enabled** when:
- At least one item in cart ✅

### Optional fields:
- Customer info (name, phone, address)
- Discount
- Payment received amount
- *Can complete order even if these are empty*

---

## 🎨 Visual Identification

- **"Save Order"**: Gray/white button with border (subtle style)
- **"Print Receipt"**: Orange button (`#f26b30`) - stands out as primary action

This color scheme follows UX best practices:
- Primary action (print receipt) = Bright, attention-grabbing
- Secondary action (just save) = Subtle, available but not emphasized

---

**Last Updated**: December 12, 2025
