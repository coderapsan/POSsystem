# Testing Checklist - Enhanced POS Features

## 🧪 Pre-Testing Setup

### Environment Preparation
- [ ] MongoDB database is running and accessible
- [ ] Database has sample customer data
- [ ] Internet connection is available (for postal code lookup)
- [ ] Browser is updated (Chrome/Firefox/Edge recommended)
- [ ] POS system is running on localhost or test server

### Sample Test Data Needed
```
Test Customer 1 (Existing):
- Phone: 07912345678
- Name: John Smith
- Address: 123 High Street
- Postal Code: SW20 8LR
- Previous orders: At least 2-3

Test Customer 2 (New):
- Phone: 07987654321
- Name: Jane Doe
- Address: TBD
- Postal Code: TBD

Test Postal Codes:
- Valid: SW20 8LR, E1 6AN, M1 1AE, B1 1BB
- Invalid: XX00 0XX, 12345, ABCDE
```

---

## 📋 Feature 1: Customer Lookup by Phone

### Test 1.1: Existing Customer Auto-Fill
**Steps:**
1. Navigate to order page
2. Enter existing customer phone: `07912345678`
3. Wait 1 second

**Expected Results:**
- [ ] Loading spinner appears next to phone field
- [ ] After ~1 second, spinner disappears
- [ ] Name field auto-fills with "John Smith"
- [ ] Address field auto-fills with "123 High Street"
- [ ] Postal code field auto-fills with "SW20 8LR"
- [ ] Customer history panel appears below form
- [ ] Panel shows "🔄 Returning Customer" badge
- [ ] Previous orders are displayed

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 1.2: New Customer (Phone Not Found)
**Steps:**
1. Navigate to order page
2. Enter new phone: `07987654321`
3. Wait 1 second

**Expected Results:**
- [ ] Loading spinner appears
- [ ] After ~1 second, spinner disappears
- [ ] Name field remains empty
- [ ] Address field remains empty
- [ ] Postal code field remains empty
- [ ] Customer history panel appears
- [ ] Panel shows "🆕 New Customer" badge
- [ ] "No previous orders found" message shown

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 1.3: Partial Phone Number
**Steps:**
1. Navigate to order page
2. Enter partial phone: `07912` (only 5 digits)
3. Wait 1 second

**Expected Results:**
- [ ] No loading spinner appears (< 10 digits)
- [ ] No API call is made
- [ ] No auto-fill occurs
- [ ] No history panel appears

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 1.4: Phone Number Debouncing
**Steps:**
1. Navigate to order page
2. Type phone number slowly: `0-7-9-1-2-3-4-5-6-7-8`
3. Observe spinner timing

**Expected Results:**
- [ ] Spinner does NOT appear until typing stops for 800ms
- [ ] Only ONE API call is made (not multiple)
- [ ] Auto-fill happens after final digit + 800ms pause

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 1.5: Changing Phone Number
**Steps:**
1. Enter existing phone: `07912345678`
2. Wait for auto-fill to complete
3. Clear phone field
4. Enter different phone: `07987654321`
5. Wait 1 second

**Expected Results:**
- [ ] First auto-fill completes normally
- [ ] History panel shows for first customer
- [ ] When phone changed, history panel updates
- [ ] New customer data shown (or empty if not found)
- [ ] No errors in console

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## 📋 Feature 2: Postal Code Address Lookup

### Test 2.1: Valid UK Postal Code
**Steps:**
1. Navigate to order page
2. Enter valid postal code: `SW20 8LR`
3. Wait 1 second

**Expected Results:**
- [ ] Loading spinner appears next to postal code field
- [ ] After ~1 second, spinner disappears
- [ ] Address field auto-fills with area name
- [ ] Example: "Kingston Upon Thames, Greater London"
- [ ] Auto-fill only happens if address field is empty

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 2.2: Invalid Postal Code
**Steps:**
1. Navigate to order page
2. Enter invalid postal code: `XX00 0XX`
3. Wait 1 second

**Expected Results:**
- [ ] Loading spinner appears
- [ ] After ~1 second, spinner disappears
- [ ] Address field remains empty
- [ ] No error message shown to user
- [ ] Form remains usable
- [ ] Manual entry still works

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 2.3: Postal Code with Existing Address
**Steps:**
1. Navigate to order page
2. Manually type address: "123 Test Street"
3. Then enter postal code: `SW20 8LR`
4. Wait 1 second

**Expected Results:**
- [ ] Loading spinner appears
- [ ] Address field does NOT change
- [ ] Manual address is preserved
- [ ] Auto-fill respects existing data

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 2.4: Different Postal Code Formats
**Steps:**
1. Test with space: `SW20 8LR`
2. Test without space: `SW208LR`
3. Test lowercase: `sw20 8lr`

**Expected Results:**
- [ ] All formats work correctly
- [ ] System handles spacing automatically
- [ ] Case doesn't matter
- [ ] Address lookup works for all valid formats

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 2.5: Postal Code Debouncing
**Steps:**
1. Type postal code slowly: `S-W-2-0- -8-L-R`
2. Observe when API call happens

**Expected Results:**
- [ ] Spinner does NOT appear until 1000ms after typing stops
- [ ] Only ONE API call is made
- [ ] Lookup happens after complete postal code + pause

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## 📋 Feature 3: Customer Order History

### Test 3.1: Returning Customer History Display
**Steps:**
1. Enter existing customer phone: `07912345678`
2. Wait for history to load

**Expected Results:**
- [ ] History panel appears below order form
- [ ] Shows "🔄 Returning Customer" badge
- [ ] Displays "X previous orders" count
- [ ] Lists recent orders (max 10)
- [ ] Each order shows:
  - [ ] Order ID (e.g., #45821)
  - [ ] Order type (Dine In/Take Away/Delivery)
  - [ ] Date and time
  - [ ] Total amount
  - [ ] Payment status (Paid/Pending badge)
  - [ ] First 3 items with prices
  - [ ] "+ X more items" if applicable
- [ ] Shows "Total Lifetime Value" at bottom
- [ ] All amounts formatted correctly (£X.XX)

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 3.2: New Customer Badge
**Steps:**
1. Enter new phone: `07987654321`
2. Wait for response

**Expected Results:**
- [ ] History panel appears
- [ ] Shows "🆕 New Customer" badge
- [ ] Green gradient background
- [ ] "No previous orders found" message
- [ ] No order list shown
- [ ] No lifetime value shown

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 3.3: History Panel Scrolling
**Steps:**
1. Use customer with 10+ previous orders
2. Enter their phone number
3. Try scrolling the history list

**Expected Results:**
- [ ] History panel has scrollbar if > 5 orders
- [ ] Scrolling works smoothly
- [ ] Max height maintained
- [ ] All orders accessible by scrolling

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 3.4: Order Details in History
**Steps:**
1. Enter customer phone with order history
2. Examine the displayed order details

**Expected Results:**
- [ ] Order dates formatted correctly (DD Mon YYYY, HH:MM)
- [ ] Prices show 2 decimal places
- [ ] Payment status badges colored correctly:
  - [ ] Green for "Paid"
  - [ ] Yellow/Amber for "Pending"
- [ ] Item portions shown if applicable
- [ ] Quantities shown correctly
- [ ] "+" indicator for truncated items

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 3.5: Lifetime Value Calculation
**Steps:**
1. Enter customer with multiple orders
2. Check lifetime value display
3. Manually verify calculation

**Expected Results:**
- [ ] Lifetime value = sum of all order totals
- [ ] Formatted as £XXX.XX
- [ ] Calculation is correct
- [ ] Displayed prominently in blue badge

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## 📋 Feature 4: Order Number Consistency

### Test 4.1: Order Number Generation
**Steps:**
1. Create a new order
2. Add items to cart
3. Submit order
4. Note the order number shown

**Expected Results:**
- [ ] Order number is 5 digits
- [ ] Format: #XXXXX (e.g., #45821)
- [ ] Number is unique
- [ ] Number appears immediately on receipt modal

**Status:** ⬜ Pass | ⬜ Fail  
**Order Number:** _________________  
**Notes:** _________________________________

---

### Test 4.2: Receipt Modal Order Number
**Steps:**
1. Complete an order
2. Receipt modal appears
3. Check order number display

**Expected Results:**
- [ ] Order number shown prominently at top
- [ ] Same number as generated
- [ ] Large, bold display (#XXXXX)
- [ ] Correct timestamp shown below

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 4.3: Printed Receipt Order Number
**Steps:**
1. Complete an order with order #12345
2. Click "Print Receipt"
3. Examine printed receipt

**Expected Results:**
- [ ] Printed receipt shows #12345
- [ ] Number matches receipt modal
- [ ] Number is prominent on print
- [ ] Same format as on screen

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 4.4: Database Order Number
**Steps:**
1. Complete an order with number #12345
2. Check MongoDB database
3. Query: `db.orders.findOne({orderId: "12345"})`

**Expected Results:**
- [ ] Order found in database
- [ ] `orderId` field = "12345"
- [ ] Matches displayed and printed number
- [ ] Stored as string, not number

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Test 4.5: Order History Page Number
**Steps:**
1. Complete an order with number #12345
2. Navigate to order history page
3. Find the order in the list

**Expected Results:**
- [ ] Order appears in history
- [ ] Shows same order number #12345
- [ ] Number matches throughout system
- [ ] Searchable/filterable by number

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## 🔄 Integration Tests

### Integration Test 1: Complete Flow with Returning Customer
**Steps:**
1. Start new order
2. Select "Delivery"
3. Enter phone: `07912345678`
4. Verify auto-fill
5. Check customer history
6. Add items to order
7. Apply discount
8. Select payment method
9. Submit order
10. Print receipt
11. Check database

**Expected Results:**
- [ ] Auto-fill works correctly
- [ ] History shows previous orders
- [ ] Order processes normally
- [ ] Order number consistent everywhere
- [ ] Receipt prints with correct data
- [ ] Database updated with new order
- [ ] New order appears in customer history

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Integration Test 2: New Customer with Postal Code
**Steps:**
1. Start new order
2. Select "Delivery"
3. Enter new phone: `07999888777`
4. Confirm "New Customer" badge
5. Enter postal code: `E1 6AN`
6. Verify address auto-fill
7. Complete remaining details
8. Add items
9. Complete order
10. Create another order with same phone

**Expected Results:**
- [ ] First order: Shows as new customer
- [ ] Postal code auto-fills address
- [ ] Order completes successfully
- [ ] Second order: Now shows as returning customer
- [ ] Second order: Auto-fills all details
- [ ] History shows first order

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Integration Test 3: Combined Phone + Postal Lookup
**Steps:**
1. Enter phone: `07912345678`
2. System auto-fills: Name, Address, Postal
3. Change postal code to: `M1 1AE`
4. Wait for postal lookup

**Expected Results:**
- [ ] Phone lookup works first
- [ ] Initial auto-fill completes
- [ ] Postal code change triggers new lookup
- [ ] Address updates to Manchester area
- [ ] No conflicts between lookups
- [ ] Both features work harmoniously

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## 🚫 Error Handling Tests

### Error Test 1: Database Offline
**Steps:**
1. Stop MongoDB database
2. Try to enter existing customer phone
3. Try to complete an order

**Expected Results:**
- [ ] Customer lookup fails gracefully
- [ ] "New Customer" badge shown
- [ ] Manual entry still works
- [ ] Order can still be created
- [ ] Warning logged to console
- [ ] User can continue working
- [ ] No error messages to user

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Error Test 2: No Internet Connection
**Steps:**
1. Disable internet connection
2. Enter postal code
3. Try customer lookup

**Expected Results:**
- [ ] Postal code lookup fails silently
- [ ] Customer lookup fails gracefully
- [ ] Manual entry works
- [ ] System remains functional
- [ ] No blocking error messages

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Error Test 3: Postal Code API Rate Limit
**Steps:**
1. Make 20+ postal code lookups quickly
2. Observe behavior

**Expected Results:**
- [ ] System handles rate limiting
- [ ] No crashes or freezes
- [ ] Manual entry always available
- [ ] Error logged but not shown to user

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Error Test 4: Malformed Data
**Steps:**
1. Enter invalid characters in phone: `abc123def`
2. Enter emoji in postal code: `SW20🎉8LR`
3. Try very long phone number: `079123456789012345`

**Expected Results:**
- [ ] System handles gracefully
- [ ] No crashes
- [ ] Invalid lookups fail silently
- [ ] User can correct and continue

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## 🎨 UI/UX Tests

### UX Test 1: Loading Indicators
**Steps:**
1. Enter phone number
2. Enter postal code
3. Observe loading spinners

**Expected Results:**
- [ ] Spinners appear immediately when searching
- [ ] Spinners positioned next to relevant fields
- [ ] Spinners disappear when complete
- [ ] Smooth animations
- [ ] Not intrusive to user

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### UX Test 2: Visual Feedback
**Steps:**
1. Test new customer badge (green)
2. Test returning customer badge (blue)
3. Test payment status badges

**Expected Results:**
- [ ] Colors are distinct and clear
- [ ] Badges are visible and well-positioned
- [ ] Icons (🆕, 🔄) display correctly
- [ ] Text is readable
- [ ] Gradient backgrounds work

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### UX Test 3: Responsive Design
**Steps:**
1. Test on desktop (1920x1080)
2. Test on tablet (768px wide)
3. Test on mobile (375px wide)

**Expected Results:**
- [ ] History panel adapts to screen size
- [ ] Form fields stack appropriately
- [ ] Scrolling works on all devices
- [ ] Touch targets adequate on mobile
- [ ] Text remains readable

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### UX Test 4: Placeholder Text
**Steps:**
1. Observe form field placeholders
2. Check for helpful hints

**Expected Results:**
- [ ] Phone field: "Phone (auto-fills data)"
- [ ] Postal field: "Postal Code (auto-fills address)"
- [ ] Placeholders provide guidance
- [ ] Text disappears when typing

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## ⚡ Performance Tests

### Performance Test 1: API Response Time
**Steps:**
1. Open browser DevTools Network tab
2. Enter customer phone
3. Measure API response time

**Expected Results:**
- [ ] Customer lookup: < 500ms
- [ ] Postal code lookup: < 1000ms
- [ ] No timeout errors
- [ ] Acceptable under normal network

**Status:** ⬜ Pass | ⬜ Fail  
**Response Times:** _________________  
**Notes:** _________________________________

---

### Performance Test 2: Large Order History
**Steps:**
1. Test customer with 50+ orders in database
2. Enter their phone
3. Observe loading and rendering

**Expected Results:**
- [ ] Only loads last 10 orders (as designed)
- [ ] Loads quickly despite large dataset
- [ ] Scrolling is smooth
- [ ] No lag or freezing

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

### Performance Test 3: Rapid Input Changes
**Steps:**
1. Type phone number
2. Immediately change it
3. Repeat several times quickly

**Expected Results:**
- [ ] Debouncing works correctly
- [ ] Only final input triggers API call
- [ ] No race conditions
- [ ] Correct data displays
- [ ] Previous requests cancelled

**Status:** ⬜ Pass | ⬜ Fail  
**Notes:** _________________________________

---

## 📊 Test Summary

### Overall Results

**Total Tests:** 40  
**Passed:** _____ / 40  
**Failed:** _____ / 40  
**Pass Rate:** _____ %

### Critical Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Minor Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Recommendations
1. _________________________________
2. _________________________________
3. _________________________________

---

## ✅ Sign-Off

**Tested By:** _______________________  
**Date:** _______________________  
**Environment:** ⬜ Development | ⬜ Staging | ⬜ Production  
**Browser:** _______________________  
**OS:** _______________________

**Ready for Production:** ⬜ Yes | ⬜ No | ⬜ With Conditions

**Conditions/Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## 📝 Additional Notes

Use this space for any additional observations, suggestions, or documentation:

_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________

---

**Testing Guide Version:** 1.0  
**Last Updated:** December 18, 2025  
**Next Review:** January 18, 2026
