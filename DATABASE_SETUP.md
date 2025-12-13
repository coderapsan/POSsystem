# 🗄️ Database Setup Guide

## Current Status: ⚠️ Database Not Configured

Your POS system is **fully functional** without a database! You can:
- ✅ Take orders
- ✅ Print receipts
- ✅ Process payments
- ✅ Use all POS features

However, **order history and customer tracking** require MongoDB.

---

## Option 1: Use Without Database (Current Setup)

**No setup needed!** The system works perfectly for immediate orders and receipt printing.

---

## Option 2: Enable Database Features (5 minutes)

### Step 1: Get MongoDB Connection String

#### A. Free MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in (free tier available)
3. Create a new cluster (choose Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like below)

#### B. Local MongoDB
If you have MongoDB installed locally:
```
mongodb://localhost:27017/fourdreams
```

### Step 2: Update .env.local File

Open `.env.local` file and replace line 11:

**From:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**To:**
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/fourdreams?retryWrites=true&w=majority
```

**Example (replace with your actual values):**
```env
MONGODB_URI=mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/fourdreams?retryWrites=true&w=majority
```

### Step 3: Restart Development Server

In your terminal:
1. Press `Ctrl + C` to stop the server
2. Run `npm run dev` to start it again

### Step 4: Test

1. Go to http://localhost:3000/order
2. Create a test order
3. Click "Save Order" or "Print Receipt"
4. Go to http://localhost:3000/order-history
5. You should see your saved order!

---

## Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

- **USERNAME**: Your MongoDB username
- **PASSWORD**: Your MongoDB password (URL-encode special characters!)
- **CLUSTER**: Your cluster address (e.g., cluster0.abc123)
- **DATABASE**: Database name (e.g., fourdreams, momos, restaurant)

### Important Notes:

1. **Special Characters in Password**: 
   - If your password has special characters like `@`, `#`, `:`, etc.
   - Use URL-encoded versions:
     - `@` → `%40`
     - `#` → `%23`
     - `:` → `%3A`
   - Example: Password `My@Pass` → `My%40Pass`

2. **Security**:
   - Never commit `.env.local` to Git (it's already in `.gitignore`)
   - Don't share your connection string publicly

3. **Testing Connection**:
   - After updating, restart the dev server
   - Check terminal for "⚠️ MongoDB not configured" warning
   - If you see it, double-check your connection string

---

## Troubleshooting

### Error: "querySrv ENOTFOUND"
- Your connection string is incorrect or has placeholders
- Make sure you replaced `<username>`, `<password>`, and `<cluster>`

### Error: "Authentication failed"
- Wrong username or password
- Special characters not URL-encoded

### Error: "Network timeout"
- Check your internet connection
- Verify MongoDB Atlas IP whitelist (add `0.0.0.0/0` for all IPs)

### Still seeing warning?
1. Verify `.env.local` is in the root folder (same level as `package.json`)
2. Check for typos in variable name (must be `MONGODB_URI`)
3. Restart dev server completely
4. Check console for specific error messages

---

## What Features Need Database?

| Feature | Without DB | With DB |
|---------|-----------|---------|
| Take orders | ✅ | ✅ |
| Print receipts | ✅ | ✅ |
| Process payments | ✅ | ✅ |
| Menu display | ✅ | ✅ |
| Order history | ❌ | ✅ |
| Customer tracking | ❌ | ✅ |
| Reprint old receipts | ❌ | ✅ |
| Sales reports | ❌ | ✅ |
| Online orders | ❌ | ✅ |

---

## Need Help?

1. Check terminal console for error messages
2. Verify `.env.local` format matches exactly
3. Test with a simple local MongoDB first: `mongodb://localhost:27017/test`
4. Make sure to restart the server after any `.env.local` changes

---

**Quick Test Command:**
```bash
# Stop server (Ctrl+C)
# Then run:
npm run dev
```

Look for these messages:
- ❌ Bad: "⚠️ MongoDB not configured"
- ✅ Good: No warnings about MongoDB

---

*Your POS system is ready to use with or without database!*
