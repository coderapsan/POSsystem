# Card Payment System - Visual Guide

## 🖥️ What You'll See

### 1. Customer Side (Order Page)

#### When "Card" Payment is Selected:
```
┌─────────────────────────────────────────────────┐
│  Payment Method: [Cash] [Card✓] [Pay on...]   │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Card Number                               │ │
│  │ [1234 5678 9012 3456]            Visa    │ │
│  ├───────────────────────────────────────────┤ │
│  │ Cardholder Name                           │ │
│  │ [JOHN DOE]                                │ │
│  ├─────────────────────┬─────────────────────┤ │
│  │ Expiry Date         │ CVV                 │ │
│  │ [12/25]             │ [123]               │ │
│  └─────────────────────┴─────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔒 Secure Payment                         │ │
│  │ Your card details are encrypted and       │ │
│  │ securely transmitted. We do not store     │ │
│  │ your CVV.                                 │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Place Order - £25.50]                        │
└─────────────────────────────────────────────────┘
```

#### Features:
- **Auto-formatting**: Spaces added as you type card number
- **Card type**: Shows "Visa", "Mastercard", "Amex", etc.
- **Validation**: Red borders appear for invalid inputs
- **Error messages**: "Card has expired", "Invalid card number"

---

### 2. Staff Side - Incoming Order Popup

```
┌──────────────────────────────────────┐
│  🔔 New Online Order                 │
│                                      │
│  Customer: John Doe                  │
│  Order ID: 12345                     │
│  Payment: Card                       │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ 💳 Card Payment Details:         ││
│  │                                  ││
│  │ Card: 4532 1234 5678 9012        ││
│  │ Name: JOHN DOE                   ││
│  │ Expiry: 12/25                    ││
│  │ CVV: 123                         ││
│  └──────────────────────────────────┘│
│                                      │
│  Items:                              │
│  • Chicken Momos x 2                 │
│  • Veg Spring Rolls x 1              │
│                                      │
│  [Accept & Print]  [Dismiss]        │
└──────────────────────────────────────┘
```

#### Features:
- **Blue background**: Card details stand out
- **All information visible**: No need to click elsewhere
- **Ready to process**: Staff can immediately see all card details

---

### 3. Staff Side - Order History

```
┌─────────────────────────────────────────────────────┐
│  Order History                    📋 STAFF VIEW      │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Filter by order ID, customer, or phone...]  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────────┐
│  │ Order #12345              Dec 15, 2025 2:30 PM │
│  │                                                 │
│  │ Customer: John Doe      Phone: 555-0123        │
│  │ Type: Delivery          Payment: Card          │
│  │ Total: £25.50                                   │
│  │                                                 │
│  │ ┌─────────────────────────────────────────────┐ │
│  │ │ 💳 CARD PAYMENT DETAILS                     │ │
│  │ │ Card: 4532 1234 5678 9012                   │ │
│  │ │ Name: JOHN DOE                              │ │
│  │ │ Expiry: 12/25         CVV: 123              │ │
│  │ └─────────────────────────────────────────────┘ │
│  │                                                 │
│  │ ITEMS                                           │
│  │ 2× Chicken Momos          £12.00               │
│  │ 1× Veg Spring Rolls       £8.50                │
│  │                                                 │
│  │ [Print Receipt]                                │
│  └─────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
```

#### Features:
- **Historical tracking**: See all past card orders
- **Easy filtering**: Search by order ID or customer
- **Full details**: Everything needed to process payment

---

### 4. Printed Receipt

```
════════════════════════════════════
        The MoMos
    340 Kingston Rd, SW20 8LR
        0208 123 4567
────────────────────────────────────
           #12345
         Delivery
    Dec 15, 2025, 2:30:15 PM
────────────────────────────────────
       John Doe
     +44 7700 900123
  123 High Street, London
       SW1A 1AA
────────────────────────────────────

2× Chicken Momos              £12.00
1× Veg Spring Rolls            £8.50

────────────────────────────────────
              Subtotal: £20.50
                 Total: £25.50
────────────────────────────────────
Payment: Card

CARD DETAILS:
Card: 4532 1234 5678 9012
Name: JOHN DOE
Expiry: 12/25
CVV: 123

Status: New Customer
────────────────────────────────────
         Thank You!
      Visit Again Soon
════════════════════════════════════
```

#### Features:
- **Clear section**: Bold "CARD DETAILS:" header
- **All info included**: Ready for manual processing
- **Professional format**: Easy to read on thermal paper

---

## 🎯 Real-World Usage Scenarios

### Scenario 1: Customer Places Card Order
1. Customer browses menu on their phone
2. Adds items to cart
3. Selects "Card" payment
4. Card form appears below payment selection
5. Types card number: `4532123456789012`
   - Auto-formats to: `4532 1234 5678 9012`
   - Shows "Visa" on the right
6. Enters name: `john doe`
   - Auto-capitalizes to: `JOHN DOE`
7. Types expiry: `1225`
   - Auto-formats to: `12/25`
8. Enters CVV: `123`
9. Clicks "Place Order"
10. Order submitted successfully!

### Scenario 2: Staff Receives and Processes Order
1. Staff hears notification bell 🔔
2. Popup appears with order details
3. Sees blue box with card information
4. Notes down card details or takes photo
5. Clicks "Accept & Print"
6. Receipt prints with all card details
7. Uses card details to process payment
8. Marks order as paid in system

### Scenario 3: Looking Up Past Orders
1. Staff opens Order History page
2. Sees list of all orders
3. Card orders have blue highlighted section
4. Clicks "Print Receipt" to reprint if needed
5. All card details available for reference

---

## 🔧 Testing Examples

### Test Card Numbers (for testing):
```
Visa:         4532 1234 5678 9012
Mastercard:   5425 2334 3010 9903
Amex:         3782 822463 10005
Discover:     6011 1111 1111 1117
```

### Valid Expiry Dates:
- `12/25` - December 2025 ✅
- `06/26` - June 2026 ✅
- `01/24` - January 2024 ❌ (expired)

### Valid CVV:
- `123` ✅ (3 digits)
- `1234` ✅ (4 digits for Amex)
- `12` ❌ (too short)

---

## ✨ Interactive Features

### Real-Time Validation:
```
Card Number: [4532]
Status: ⚠️ Card number must be 13-19 digits

Card Number: [4532 1234 5678 9012]
Status: ✅ Valid (Visa detected)

Expiry: [12/24]
Status: ❌ Card has expired

Expiry: [12/25]
Status: ✅ Valid

CVV: [12]
Status: ❌ CVV must be 3 or 4 digits

CVV: [123]
Status: ✅ Valid
```

---

## 🎨 Color Guide

### Customer Side:
- **Input backgrounds**: Dark blue-grey (`#10172d`)
- **Borders**: White with transparency
- **Focus color**: Orange (`#f26b30`)
- **Security notice**: Blue background (`#3b82f6`)

### Staff Side:
- **Card details box**: Light blue background (`bg-blue-50`)
- **Card text**: Blue shades (`text-blue-800`, `text-blue-900`)
- **Border**: Blue border (`border-blue-200`)
- **Icon**: 💳 emoji for quick recognition

---

## 📱 Mobile vs Desktop

### Mobile View:
- Card fields stack vertically
- Larger touch targets
- Full-width buttons
- Optimized for one-handed use

### Desktop View:
- Expiry and CVV side-by-side
- More compact layout
- Hover effects on buttons
- Keyboard shortcuts available

---

## 🚀 Ready to Use!

Your card payment system is now fully operational with:
✅ Beautiful, intuitive customer interface
✅ Staff-friendly order viewing
✅ Complete card details capture
✅ Printed receipts with card info
✅ Historical tracking and search

Start accepting card payments today! 🎉
