# 🚀 STRIPE QUICK START

## ⚡ 3-Minute Setup

### 1️⃣ Get Stripe Keys (2 min)
```
https://dashboard.stripe.com/apikeys
→ Copy Publishable Key (pk_test_...)
→ Copy Secret Key (sk_test_...)
```

### 2️⃣ Add to .env.local (30 sec)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### 3️⃣ Restart Server (30 sec)
```bash
npm run dev
```

---

## 🧪 Test Payment Now

1. **Go to**: `http://localhost:3000/customerOrder`
2. **Add items** to cart
3. **Select**: Card payment
4. **Click**: Place Order
5. **Enter card**: `4242 4242 4242 4242`
6. **Expiry**: `12/25`
7. **CVC**: `123`
8. **Submit** ✅

---

## ✅ What You'll See

### Customer Side:
```
💳 Secure payment modal
🔒 "Secure Payment by Stripe" badge
⚡ Instant payment processing
✅ Success confirmation
```

### Staff Side:
```
🔔 Order notification
✅ "Stripe Payment Verified" badge
💰 Payment ID: pi_xxx...
✓ PAID automatically
```

---

## 📊 Check Your Payment

**Stripe Dashboard**: https://dashboard.stripe.com/payments

You'll see:
- Payment amount
- Order ID
- Payment ID
- Status: Succeeded ✅

---

## 🎯 Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Decline |
| 4000 0027 6000 3184 | 🔐 3D Secure |

Always use future expiry (12/25) and any CVC (123)

---

## 🔥 Key Features

✅ **No card data stored** - 100% secure  
✅ **PCI compliant** - Stripe handles everything  
✅ **Instant verification** - Real-time processing  
✅ **Fraud protection** - AI-powered  
✅ **Mobile ready** - Apple/Google Pay  

---

## 💰 Pricing

**UK Cards**: 1.5% + 20p  
**Example**: £25 order = £0.58 fee

No monthly fees • No setup costs

---

## 🆘 Troubleshooting

**Problem**: Stripe modal doesn't appear  
**Fix**: Check .env.local has keys, restart server

**Problem**: "Invalid API key"  
**Fix**: Verify keys start with pk_test_ and sk_test_

**Problem**: Payment stuck on "Processing"  
**Fix**: Check browser console, try test card again

---

## 📖 Full Docs

- **Setup Guide**: `STRIPE_SETUP_GUIDE.md`
- **Implementation**: `STRIPE_IMPLEMENTATION_SUMMARY.md`
- **Stripe Docs**: https://stripe.com/docs

---

## 🎉 You're Ready!

```bash
# Start accepting payments now:
npm run dev
→ Go to customer order page
→ Use test card: 4242 4242 4242 4242
→ See payment in Stripe Dashboard
```

**Production**: Switch to live keys (pk_live_...) when ready!
