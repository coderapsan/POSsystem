# Stripe Payment Integration - Setup Guide

## 🎉 Overview
Your restaurant now uses **Stripe** for secure, PCI-compliant card payments! No more storing raw card data - everything is handled securely by Stripe.

---

## 🔑 Step 1: Get Your Stripe API Keys

### 1.1 Create a Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign Up" and create your account
3. Complete the business verification (required for live payments)

### 1.2 Get Your API Keys
1. Log in to your Stripe Dashboard
2. Click "Developers" in the left sidebar
3. Click "API keys"
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 1.3 Test vs Live Keys
- **Test mode** (`pk_test_` / `sk_test_`): Use for development
- **Live mode** (`pk_live_` / `sk_live_`): Use for real payments

---

## 📝 Step 2: Add Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Stripe API Keys (TEST MODE - for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Stripe Webhook Secret (optional, for webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Important Notes:
- ✅ `NEXT_PUBLIC_` prefix makes the key available in browser
- ✅ Secret key has NO prefix (server-side only)
- ✅ Never commit `.env.local` to git
- ✅ Use test keys during development

---

## 🧪 Step 3: Test with Stripe Test Cards

Stripe provides test card numbers for development:

### Successful Payments:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Declined Payments:
```
Card Number: 4000 0000 0000 0002
(Will be declined with generic decline code)
```

### Requires 3D Secure:
```
Card Number: 4000 0027 6000 3184
(Will trigger authentication flow)
```

More test cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🚀 Step 4: How It Works

### Customer Flow:
1. Customer adds items to cart
2. Selects "Card" as payment method
3. Clicks "Place Order"
4. Stripe payment modal appears
5. Enters card details securely (handled by Stripe)
6. Payment is processed instantly
7. Order is submitted with payment confirmation

### Staff Flow:
1. Receives order notification
2. Sees "✅ Stripe Payment Verified" badge
3. Payment ID is displayed
4. Order is marked as PAID automatically
5. No manual card processing needed

---

## 💰 Step 5: Understanding Stripe Fees

### UK/Europe Pricing:
- **European cards**: 1.4% + 20p per transaction
- **UK cards**: 1.5% + 20p per transaction
- **Non-European cards**: 2.9% + 20p per transaction

### Example:
- Order total: £25.00
- Stripe fee: £0.58 (1.5% + £0.20)
- You receive: £24.42

### No Hidden Fees:
- ✅ No monthly fees
- ✅ No setup fees
- ✅ No minimum transaction volume
- ✅ Instant payouts available

---

## 🔒 Security Features

### PCI Compliance:
- ✅ Stripe is PCI Level 1 certified (highest level)
- ✅ You never see or store card details
- ✅ All card data is encrypted
- ✅ 3D Secure authentication supported

### Fraud Protection:
- ✅ Built-in fraud detection (Radar)
- ✅ Machine learning analyzes every payment
- ✅ Automatic blocking of suspicious transactions
- ✅ Chargeback protection available

---

## 📊 Step 6: Stripe Dashboard

### View Payments:
1. Go to Stripe Dashboard
2. Click "Payments" to see all transactions
3. Click any payment to see details
4. Match payment ID with your order ID

### Useful Features:
- **Balance**: See your current balance
- **Payouts**: Track bank transfers
- **Customers**: View customer payment history
- **Disputes**: Handle chargebacks
- **Reports**: Download financial reports

---

## 🔧 Step 7: Testing the Integration

### Test Checklist:
- [ ] Environment variables are set correctly
- [ ] Test card payment works on customer page
- [ ] Payment success modal appears
- [ ] Order is created with `stripePaymentIntentId`
- [ ] Staff sees "✅ Stripe Payment Verified"
- [ ] Order is marked as `isPaid: true`
- [ ] Payment ID shows in order history
- [ ] Receipt prints with Stripe payment info

### Test a Payment:
```bash
# 1. Start your dev server
npm run dev

# 2. Go to customer order page
http://localhost:3000/customerOrder

# 3. Add items to cart
# 4. Select "Card" payment
# 5. Click "Place Order"
# 6. Use test card: 4242 4242 4242 4242
# 7. Enter any future date and CVC
# 8. Submit payment
# 9. Check Stripe Dashboard for payment
```

---

## 🌐 Step 8: Going Live (Production)

### Before Going Live:
1. Complete Stripe account verification
2. Add business details and bank account
3. Switch from test keys to live keys
4. Test with real (small) transaction
5. Enable automatic payouts

### Update Environment Variables:
```env
# PRODUCTION - Live Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
```

### Deployment Platforms:
- **Vercel**: Add env vars in project settings
- **Netlify**: Add in Site settings → Environment
- **Railway**: Add in project variables
- **AWS**: Use AWS Systems Manager

---

## 🔔 Step 9: Webhooks (Optional but Recommended)

Webhooks notify your server when payments succeed/fail.

### Setup:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

### Benefits:
- ✅ Automatic order status updates
- ✅ Handle payment failures gracefully
- ✅ Track refunds automatically
- ✅ Better reliability

---

## 📱 Step 10: Mobile Payments

Stripe automatically supports:
- ✅ Apple Pay
- ✅ Google Pay
- ✅ Digital wallets
- ✅ All major credit/debit cards

No extra code needed - it's all built-in!

---

## 🆘 Troubleshooting

### Error: "Stripe is not defined"
**Solution**: Check that publishable key is set:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Error: "Invalid API key"
**Solution**: 
- Check for typos in `.env.local`
- Restart dev server after changing env vars
- Verify key starts with `pk_test_` or `sk_test_`

### Payment hangs at "Processing..."
**Solution**:
- Check browser console for errors
- Verify secret key is correct
- Test with Stripe test card
- Check network tab for API errors

### Order created but payment failed
**Solution**:
- This is normal - order is created first
- Check `stripePaymentIntentId` field
- Verify in Stripe Dashboard
- Payment might be pending authentication

---

## 📖 Database Structure

### Orders with Stripe Payments:
```javascript
{
  orderId: "12345",
  paymentMethod: "Card",
  stripePaymentIntentId: "pi_1AbC2dEf3GhI4jKl",
  stripePaymentStatus: "succeeded",
  isPaid: true,
  total: 25.50,
  // ... other fields
}
```

### Legacy Orders (old system):
```javascript
{
  orderId: "12346",
  paymentMethod: "Card",
  cardDetails: { /* old raw card data */ },
  stripePaymentIntentId: null,
  // ... other fields
}
```

---

## 🎯 Key Benefits

### For You (Business):
- ✅ PCI compliant - no liability
- ✅ Automatic fraud detection
- ✅ Faster payments (instant verification)
- ✅ Lower chargeback rates
- ✅ Professional payment experience
- ✅ Detailed financial reports

### For Customers:
- ✅ Secure payment processing
- ✅ No card details stored by restaurant
- ✅ 3D Secure authentication
- ✅ Instant payment confirmation
- ✅ Digital wallet support
- ✅ Trust in Stripe brand

---

## 📞 Support

### Stripe Support:
- **Email**: support@stripe.com
- **Phone**: Available in dashboard
- **Docs**: https://stripe.com/docs
- **Community**: https://stripe.com/community

### Common Questions:

**Q: How long until I receive my money?**  
A: Standard payouts are 2 business days. Instant payouts available for verified businesses.

**Q: What happens if a payment fails?**  
A: Customer sees an error, order isn't created, no charge occurs.

**Q: Can I refund a payment?**  
A: Yes, full or partial refunds available in Stripe Dashboard.

**Q: Are there limits on payment amounts?**  
A: Default limits apply. Contact Stripe to increase if needed.

---

## ✅ Setup Complete!

Your restaurant is now using Stripe for secure card payments!

### Next Steps:
1. ✅ Add your Stripe API keys to `.env.local`
2. ✅ Test with Stripe test cards
3. ✅ Process a few test orders
4. ✅ Verify payments in Stripe Dashboard
5. ✅ Go live when ready!

### Quick Test:
```bash
# Test a payment right now:
1. Start server: npm run dev
2. Go to: http://localhost:3000/customerOrder
3. Add items, select Card payment
4. Use: 4242 4242 4242 4242
5. Check Stripe Dashboard for payment
```

---

## 🎉 You're All Set!

Stripe integration is complete and ready to accept secure payments!
