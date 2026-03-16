# Quick Setup Guide - Get Real Address Data

## 🚨 Important: You're Currently Seeing Demo Data

The system is showing **area names** instead of **street addresses** because you haven't set up the API key yet.

### What You're Seeing Now:
```
CR4 3RB → "Merton, unparished area, Merton"  ❌ (area only)
```

### What You Should See:
```
CR4 3RB → "1 Birch Close, Mitcham"           ✅ (actual address)
         "2 Birch Close, Mitcham"           ✅
         "3 Birch Close, Mitcham"           ✅
```

---

## ⚡ Quick Fix - 5 Minutes Setup

### Option 1: GetAddress.io (RECOMMENDED - Most Accurate)

**Step 1: Get Free API Key**
1. Go to: https://getaddress.io/
2. Click "Sign Up" (top right)
3. Choose "Free" plan (20 lookups/day)
4. Verify email
5. Copy your API key

**Step 2: Add to Your Project**
1. Open your project folder
2. Create/edit `.env.local` file in the root directory
3. Add this line:
   ```
   GETADDRESS_API_KEY=your_actual_api_key_here
   ```
4. Save the file

**Step 3: Restart Server**
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Step 4: Test It**
- Enter any UK postal code
- You'll now see REAL street addresses! 🎉

**Upgrade Plans** (if you need more):
- Free: 20 lookups/day (good for testing)
- Starter: £10/month for 500 lookups
- Business: £40/month for 5000 lookups

---

### Option 2: Ideal Postcodes (Alternative)

**Step 1: Get Free API Key**
1. Go to: https://ideal-postcodes.co.uk/
2. Sign up for free trial
3. Get API key from dashboard

**Step 2: Modify API File**

In `src/pages/api/address/lookup.js`, replace the GetAddress.io section with:

```javascript
// Try Ideal Postcodes
const apiKey = process.env.IDEAL_POSTCODES_KEY;
if (apiKey) {
  const response = await fetch(
    `https://api.ideal-postcodes.co.uk/v1/postcodes/${cleanPostcode}?api_key=${apiKey}`
  );
  // ... rest of implementation
}
```

**Step 3: Add to .env.local**
```
IDEAL_POSTCODES_KEY=your_api_key_here
```

---

## 🎯 Demo Mode (For Testing Only)

**While waiting for API approval, test with these postal codes:**

### Working Demo Postal Codes:
```
✅ CR4 3QR  - Glipin Close (12 addresses)
✅ CR4 3RB  - Birch Close (10 addresses)  ← Your example!
✅ CR4 4AT  - London Road (6 addresses)
✅ SW20 8LR - Kingston Road (6 addresses)
✅ SW20 9JH - High Street (5 addresses)
✅ SW19 8QW - Merton High Street (5 addresses)
✅ E1 6AN   - Brick Lane (5 addresses)
```

**Try it now:**
1. Type: `CR4 3RB` (with space)
2. Wait 0.6 seconds
3. You'll see: "1 Birch Close", "2 Birch Close", etc.

---

## 🔍 Why GetAddress.io is Best

| Feature | GetAddress.io | Postcodes.io | Google Places |
|---------|--------------|--------------|---------------|
| **Street Addresses** | ✅ Yes | ❌ No (area only) | ✅ Yes |
| **Accurate** | ✅ Royal Mail data | ⚠️ General area | ✅ Very accurate |
| **Free Tier** | ✅ 20/day | ✅ Unlimited | ❌ Paid only |
| **Easy Setup** | ✅ 5 minutes | ✅ No setup | ⚠️ Complex |
| **UK Focused** | ✅ Excellent | ✅ Good | ⚠️ Global |

---

## 📞 Your Use Case: Phone Call Verification

**Scenario:**
```
Customer: "My postal code is CR4 3RB"
Staff: [Types CR4 3RB]
System: Shows dropdown with all addresses
Staff: "Is it 1, 2, 3... which number Birch Close?"
Customer: "Number 7"
Staff: [Presses down arrow to 7, Enter]
Done! Verified in 5 seconds! ✅
```

**Why This Matters:**
- ✅ Customer hears their street name → confirms it's right
- ✅ Staff sees all options → no spelling mistakes
- ✅ One letter difference (CR4 3RB vs CR4 3QR) → Different streets shown
- ✅ Fast verification during busy phone calls

---

## 🚀 Production Checklist

### Before Going Live:
- [ ] Sign up for GetAddress.io (or Ideal Postcodes)
- [ ] Get API key
- [ ] Add to `.env.local` file
- [ ] Restart server
- [ ] Test with 5 real postal codes from your delivery area
- [ ] Train staff on using dropdown
- [ ] Monitor usage (check dashboard)
- [ ] Upgrade plan if needed (after testing)

### Cost Planning:
```
Average Restaurant Usage:
- 50 orders/day = 50 lookups
- 1,500 orders/month = 1,500 lookups

Recommended Plan:
GetAddress.io Business - £40/month (5000 lookups)
= £0.008 per lookup
= Tiny cost for huge accuracy improvement!
```

---

## 🔧 Troubleshooting

### "Still showing area name only"
**Problem:** Seeing "Merton, unparished area"
**Solution:**
1. Check `.env.local` file exists in root folder (not in src/)
2. Check API key is on this line: `GETADDRESS_API_KEY=xxxxx`
3. Check no extra spaces or quotes
4. Restart server completely (stop and start)
5. Try a test postal code first (CR4 3RB)

### "Dropdown is empty"
**Problem:** No addresses showing
**Solution:**
1. Check internet connection
2. Check API key is valid (log in to GetAddress.io)
3. Check if you've exceeded free tier (20/day)
4. Check browser console for errors (F12)

### "Wrong addresses showing"
**Problem:** Addresses don't match postal code
**Solution:**
1. Check postal code is typed correctly
2. Check if space is included (CR4 3RB not CR43RB)
3. Try removing and re-typing
4. Check if postal code exists (try on Royal Mail website)

---

## 📱 Quick Contact

**GetAddress.io Support:**
- Website: https://getaddress.io/
- Support: support@getaddress.io
- Docs: https://documentation.getaddress.io/

**Ideal Postcodes Support:**
- Website: https://ideal-postcodes.co.uk/
- Support: support@ideal-postcodes.co.uk

---

## 🎉 After Setup - What Changes

### Before (Demo Mode):
- Limited postal codes work
- Some show area names only
- Testing purposes only

### After (Production Mode):
- ✅ ALL UK postal codes work
- ✅ Real street addresses from Royal Mail
- ✅ Accurate and up-to-date
- ✅ Customer confidence
- ✅ No delivery mistakes
- ✅ Professional experience

---

## 💰 ROI Calculator

**Cost of Wrong Address:**
```
Wrong delivery = £5-10 wasted + unhappy customer
Correct address = Happy customer + good review

Cost of GetAddress.io = £40/month
Wrong deliveries prevented = 4/month
Savings = £20-40/month

Result: PAYS FOR ITSELF! 🎯
```

---

## ⏱️ Timeline

1. **Now (5 minutes):** Sign up for GetAddress.io
2. **Now (1 minute):** Add API key to `.env.local`
3. **Now (1 minute):** Restart server
4. **Now (2 minutes):** Test with 3 postal codes
5. **Today:** Train staff (5 minutes)
6. **Tomorrow:** Full production use!

**Total Time: 14 minutes to production-ready address lookup! 🚀**

---

## 🎓 Summary

1. **Sign up** at https://getaddress.io/ (free)
2. **Copy** your API key
3. **Add** to `.env.local` file
4. **Restart** server
5. **Test** with real postal codes
6. **Done!** Professional address lookup working!

**Questions? Check the main ADDRESS_AUTOCOMPLETE_GUIDE.md**

---

**Setup Guide Version:** 1.0  
**Estimated Time:** 5 minutes  
**Difficulty:** Very Easy  
**Required:** Internet connection + Email address  

🚀 **Do this now before your next order!** 🚀
