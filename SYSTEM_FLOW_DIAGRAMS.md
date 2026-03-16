# System Flow Diagrams - Enhanced POS

## 📱 Customer Lookup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STAFF ENTERS PHONE NUMBER                 │
│                        (07912345678)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │  800ms DEBOUNCE     │
                │  (Wait for typing)  │
                └─────────┬───────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  🔍 API: /api/customer/lookup     │
          │     Query: phone=07912345678      │
          └───────────┬───────────────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  📊 MongoDB Query:        │
          │  { "customer.phone": ... }│
          └───────────┬───────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
┌───────────────┐          ┌────────────────┐
│ CUSTOMER      │          │ NEW CUSTOMER   │
│ FOUND ✓       │          │ (Not Found)    │
└───────┬───────┘          └────────┬───────┘
        │                           │
        ▼                           ▼
┌──────────────────────┐   ┌───────────────────┐
│ AUTO-FILL FIELDS:    │   │ SHOW:             │
│ • Name               │   │ 🆕 New Customer   │
│ • Address            │   │ Badge             │
│ • Postal Code        │   │                   │
└──────────┬───────────┘   └───────────────────┘
           │
           ▼
┌──────────────────────────┐
│ SHOW CUSTOMER HISTORY:   │
│ 🔄 Returning Customer    │
│ • Last 10 orders         │
│ • Lifetime value         │
│ • Order details          │
└──────────────────────────┘
```

---

## 📍 Postal Code Lookup Flow

```
┌──────────────────────────────────────────────────────────┐
│              STAFF ENTERS POSTAL CODE                     │
│                    (SW20 8LR)                            │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  1000ms DEBOUNCE     │
              │  (Wait for complete) │
              └──────────┬───────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  🌍 API: /api/address/lookup       │
        │     Query: postalCode=SW20%208LR   │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  🌐 External API Call:         │
        │  postcodes.io/postcodes/SW208LR│
        └────────────┬───────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
       ▼                           ▼
┌──────────────┐          ┌────────────────┐
│ VALID CODE ✓ │          │ INVALID CODE ✗ │
└──────┬───────┘          └────────┬───────┘
       │                           │
       ▼                           ▼
┌─────────────────────┐   ┌──────────────────┐
│ AUTO-FILL ADDRESS:  │   │ NO AUTO-FILL     │
│ "Kingston Upon      │   │ Manual entry OK  │
│  Thames, Greater    │   │                  │
│  London"            │   │                  │
└─────────────────────┘   └──────────────────┘
```

---

## 🔄 Complete Order Flow with New Features

```
┌─────────────────────────────────────────────────────┐
│                  START NEW ORDER                     │
│              (Staff clicks "New Order")             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 1: Select Order Type                           │
│  ○ Dine In  ○ Take Away  ○ Delivery                 │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 2: Enter Phone Number                          │
│  ┌─────────────────────────────────────────────┐    │
│  │ Phone: 07912345678              [🔄]        │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 🔍 Customer Lookup (800ms)    │
        └──────────────┬────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌────────────────┐          ┌───────────────┐
│ FOUND ✓        │          │ NEW ✗         │
└────────┬───────┘          └───────┬───────┘
         │                          │
         ▼                          ▼
┌─────────────────────────┐  ┌──────────────────┐
│ AUTO-FILL:              │  │ MANUAL ENTRY:    │
│ • Name: John Smith      │  │ • Enter Name     │
│ • Address: 123 High St  │  │ • Enter Address  │
│ • Postal: SW20 8LR      │  │ • Enter Postal   │
└─────────┬───────────────┘  └────────┬─────────┘
          │                           │
          ▼                           │
┌─────────────────────────┐          │
│ SHOW HISTORY PANEL:     │          │
│ ┌─────────────────────┐ │          │
│ │🔄 Returning Customer│ │          │
│ │ 5 previous orders   │ │          │
│ │ £75.25 lifetime     │ │          │
│ │                     │ │          │
│ │ #45821 - £15.50    │ │          │
│ │ #42103 - £22.00    │ │          │
│ │ ...                │ │          │
│ └─────────────────────┘ │          │
└─────────┬───────────────┘          │
          │                           │
          └───────────┬───────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│  STEP 3: Verify/Complete Customer Details            │
│  ✓ Name: John Smith                                  │
│  ✓ Phone: 07912345678                                │
│  ✓ Address: 123 High Street                          │
│  ✓ Postal: SW20 8LR                                  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 4: Add Items to Order                          │
│  [Search/Browse Menu] → [Add to Cart]                │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 5: Review Cart & Apply Discount (optional)     │
│  Items: 3  |  Total: £25.50                          │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 6: Select Payment Method                       │
│  ○ Cash  ○ Card  ○ Other                            │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 7: Generate Order ID                           │
│  orderId = generateOrderId() → "45821"               │
│  setOrderNumber("45821")                             │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 8: Save to Database                            │
│  POST /api/saveOrder                                 │
│  { orderId: "45821", customer: {...}, items: [...] } │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 9: Show Receipt Modal                          │
│  ┌────────────────────────────────────────────────┐ │
│  │            #45821                              │ │
│  │     18/12/2025, 14:35:22                       │ │
│  │                                                │ │
│  │  🔄 Returning Customer                         │ │
│  │  John Smith                                    │ │
│  │  07912345678                                   │ │
│  │  Postal: SW20 8LR                              │ │
│  │  ────────────────────────────                  │ │
│  │  2× Chicken Momo        £12.00                 │ │
│  │  1× Veg Momo            £6.00                  │ │
│  │  1× Mango Lassi         £3.50                  │ │
│  │  ────────────────────────────                  │ │
│  │  Subtotal:              £21.50                 │ │
│  │  Discount (10%):        -£2.15                 │ │
│  │  ════════════════════════════                  │ │
│  │  TOTAL:                 £19.35                 │ │
│  │                                                │ │
│  │  [Print Receipt] [Close]                       │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STEP 10: Print Physical Receipt                     │
│  (Uses same orderId: "45821")                        │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  ✅ ORDER COMPLETE                                   │
│  Order #45821 saved and printed                      │
│  → Reset form for next order                         │
└──────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Structure

```
┌─────────────────────────────────────────────────────┐
│                    ORDERS COLLECTION                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Order Document Example:                            │
│  ┌────────────────────────────────────────────┐    │
│  │ {                                          │    │
│  │   orderId: "45821",                        │    │ ← Unique ID
│  │   items: [...],                            │    │
│  │   total: 19.35,                            │    │
│  │   customerName: "John Smith",              │    │
│  │   customer: {                              │    │
│  │     name: "John Smith",                    │    │ ← For lookup
│  │     phone: "07912345678",                  │    │ ← Indexed!
│  │     address: "123 High Street",            │    │
│  │     postalCode: "SW20 8LR",                │    │ ← Indexed!
│  │     notes: ""                              │    │
│  │   },                                       │    │
│  │   paymentMethod: "Cash",                   │    │
│  │   isPaid: true,                            │    │
│  │   orderType: "Delivery",                   │    │
│  │   createdAt: ISODate("2025-12-18..."),     │    │ ← Indexed!
│  │   status: "completed",                     │    │
│  │   source: "pos",                           │    │
│  │   isNewCustomer: false                     │    │
│  │ }                                          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Indexes:                                           │
│  ✓ { "customer.phone": 1, createdAt: -1 }          │
│  ✓ { "customer.postalCode": 1, createdAt: -1 }     │
│  ✓ { orderId: 1 } (unique)                         │
│  ✓ { createdAt: -1 }                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔍 Customer Lookup Query Example

```
Query: Find customer by phone
─────────────────────────────

db.orders.find({
  "customer.phone": "07912345678"
}).sort({
  createdAt: -1
}).limit(10)

Results in ~50ms (with index)
↓
[
  { orderId: "45821", total: 19.35, items: [...], ... },
  { orderId: "42103", total: 22.00, items: [...], ... },
  { orderId: "38567", total: 15.50, items: [...], ... },
  ...
]
↓
Return to frontend:
{
  found: true,
  customer: { name: "John Smith", ... },
  orders: [...],
  orderCount: 5
}
```

---

## 🎨 UI State Transitions

```
OrderInfoForm Component States
───────────────────────────────

STATE 1: Initial (Empty)
┌──────────────────────────────────┐
│ Order Information                │
│ ┌──────────────────────────────┐ │
│ │ Phone: [          ]          │ │
│ │ Name:  [          ]          │ │
│ │ Address: [          ]        │ │
│ │ Postal: [          ]         │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘

        ↓ (User types phone)

STATE 2: Searching
┌──────────────────────────────────┐
│ Order Information                │
│ ┌──────────────────────────────┐ │
│ │ Phone: [07912345678] [🔄]    │ │ ← Spinner
│ │ Name:  [          ]          │ │
│ │ Address: [          ]        │ │
│ │ Postal: [          ]         │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘

        ↓ (Customer found)

STATE 3: Auto-Filled + History
┌──────────────────────────────────┐
│ Order Information                │
│ ┌──────────────────────────────┐ │
│ │ Phone: [07912345678]         │ │
│ │ Name:  [John Smith]          │ │ ← Auto-filled
│ │ Address: [123 High Street]   │ │ ← Auto-filled
│ │ Postal: [SW20 8LR]           │ │ ← Auto-filled
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
          ↓
┌──────────────────────────────────┐
│ 🔄 Returning Customer            │ ← New section!
│ 5 previous orders                │
│ ┌──────────────────────────────┐ │
│ │ #45821  Delivery    £19.35   │ │
│ │ #42103  Take Away   £22.00   │ │
│ │ ...                          │ │
│ └──────────────────────────────┘ │
│ Lifetime Value: £75.25           │
└──────────────────────────────────┘
```

---

## 📊 Performance Comparison

```
BEFORE Enhancement                AFTER Enhancement
──────────────────────────────────────────────────────

Manual Entry:                     Auto-Fill:
┌───────────────────────┐        ┌───────────────────────┐
│ Type phone: 5 sec     │        │ Type phone: 5 sec     │
│ Type name: 8 sec      │        │ Wait: 1 sec (auto)    │
│ Type address: 15 sec  │        │ Verify: 2 sec         │
│ Type postal: 5 sec    │        │                       │
│ ────────────────────  │        │ ─────────────────────│
│ Total: ~33 seconds    │        │ Total: ~8 seconds     │
└───────────────────────┘        └───────────────────────┘

Time Saved: 25 seconds per returning customer!

30 returning customers/day
× 25 seconds saved
= 12.5 minutes saved per day
= ~75 hours saved per year!
```

---

## 🔐 Error Handling Flow

```
API Call Flow with Error Handling
──────────────────────────────────

┌───────────────────────┐
│  Frontend makes       │
│  API call             │
└──────────┬────────────┘
           │
           ▼
    ┌─────────────┐
    │ Try-Catch   │
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐   ┌──────────┐
│ SUCCESS │   │  ERROR   │
└────┬────┘   └─────┬────┘
     │              │
     │              ▼
     │         ┌────────────────┐
     │         │ Check error    │
     │         │ type           │
     │         └────┬───────────┘
     │              │
     │    ┌─────────┼─────────┐
     │    │         │         │
     │    ▼         ▼         ▼
     │ ┌──────┐ ┌──────┐ ┌──────┐
     │ │ 404  │ │ 500  │ │ Timeout│
     │ │ Not  │ │ DB   │ │ Network│
     │ │Found │ │Error │ │ Error  │
     │ └──┬───┘ └──┬───┘ └───┬───┘
     │    │        │         │
     │    ▼        ▼         ▼
     │ ┌─────────────────────────┐
     │ │ Graceful Fallback:      │
     │ │ • Show "New Customer"   │
     │ │ • Allow manual entry    │
     │ │ • Log error             │
     │ │ • Continue working      │
     │ └─────────────────────────┘
     │                            
     ▼                            
┌──────────────────────┐
│ Display results:     │
│ • Auto-fill fields   │
│ • Show history       │
│ • Update UI          │
└──────────────────────┘

Result: System NEVER breaks, always usable!
```

---

**Visual Guide Version:** 1.0  
**Last Updated:** December 18, 2025  
**For:** Four Dreams Restaurant POS System
