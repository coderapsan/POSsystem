# Environment Variables Setup Guide

This document lists all environment variables required for the Four Dreams Restaurant POS system.

## 📋 Required Environment Variables

### 1. **MONGODB_URI** (Required for Production)
- **Purpose**: Database connection string for storing orders, menu items, and customer data
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- **Where to get it**: 
  - MongoDB Atlas (Cloud): https://www.mongodb.com/cloud/atlas
  - Local MongoDB: `mongodb://localhost:27017/fourdreams`
- **Used in**: 
  - `/src/lib/mongodb.js`
  - `/src/pages/api/saveOrder.js`
  - `/src/pages/api/order-history.js`

### 2. **NEXT_PUBLIC_STAFF_PIN** (Optional)
- **Purpose**: PIN code for accessing staff-only pages
- **Default**: `momos-staff`
- **Format**: Any string (e.g., `your-secure-pin-123`)
- **Note**: Must start with `NEXT_PUBLIC_` to be accessible in the browser
- **Used in**: 
  - `/src/components/common/StaffGate.js`

---

## 🔧 Setup Instructions

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the **root directory** of your project (same level as `package.json`):

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Staff Access PIN
NEXT_PUBLIC_STAFF_PIN=your-secure-pin
```

### Step 2: Get MongoDB Connection String

#### Option A: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new cluster (free tier available)
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string
6. Replace `<username>`, `<password>`, and `<database>` with your credentials

Example:
```
MONGODB_URI=mongodb+srv://admin:MyP@ssw0rd@cluster0.abc123.mongodb.net/fourdreams?retryWrites=true&w=majority
```

#### Option B: Local MongoDB (Development)

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use local connection string:

```
MONGODB_URI=mongodb://localhost:27017/fourdreams
```

### Step 3: Set Staff PIN (Optional)

Change the default PIN to something secure:

```env
NEXT_PUBLIC_STAFF_PIN=MySecurePin2024
```

### Step 4: Restart Development Server

**Important**: After creating or modifying `.env.local`, you **must** restart the Next.js server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🚫 Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore` (already configured)
- Use strong, unique passwords for MongoDB
- Change the default staff PIN
- Use environment variables for all sensitive data
- For production, set environment variables in your hosting platform (Vercel, Netlify, etc.)

### ❌ DON'T:
- Commit `.env.local` to Git
- Share your environment variables publicly
- Use weak or default passwords
- Hard-code sensitive values in your source code

---

## 🌐 Production Deployment

### Vercel
1. Go to your project settings on Vercel
2. Navigate to **Environment Variables**
3. Add each variable:
   - `MONGODB_URI` → Your production MongoDB connection
   - `NEXT_PUBLIC_STAFF_PIN` → Your staff PIN

### Netlify
1. Go to **Site settings** → **Environment variables**
2. Add the same variables as above

### Other Platforms
Consult your hosting platform's documentation for setting environment variables.

---

## 🧪 Testing Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Check for errors in the terminal:
   - ❌ If you see "Please define the MONGODB_URI environment variable" → Your `.env.local` is not configured
   - ✅ No errors → Environment variables are loaded correctly

3. Test order saving:
   - Go to `/order` page
   - Add items to cart
   - Fill customer details
   - Click **"Print Receipt"**
   - Check `/order-history` to verify the order was saved

---

## 📝 Environment Variables Checklist

Before deploying to production, ensure:

- [ ] `.env.local` file created
- [ ] `MONGODB_URI` configured with valid connection string
- [ ] MongoDB connection tested (orders save successfully)
- [ ] `NEXT_PUBLIC_STAFF_PIN` changed from default
- [ ] `.env.local` is in `.gitignore`
- [ ] Environment variables configured in production hosting platform
- [ ] Production build tested: `npm run build`

---

## 🆘 Troubleshooting

### Problem: "Please define the MONGODB_URI environment variable"
**Solution**: Create `.env.local` file with `MONGODB_URI` and restart server

### Problem: Orders not saving to database
**Solution**: 
1. Check MongoDB connection string is correct
2. Ensure MongoDB cluster/service is running
3. Check server logs for connection errors

### Problem: Can't access staff pages
**Solution**: Check that `NEXT_PUBLIC_STAFF_PIN` matches the PIN you're entering

### Problem: Environment variables not loading
**Solution**: 
1. Ensure `.env.local` is in the root directory (not in `/src`)
2. Restart the development server
3. Check for typos in variable names

---

## 📞 Support

If you continue to experience issues:
1. Check the terminal/console for error messages
2. Verify all environment variables are spelled correctly
3. Ensure MongoDB is accessible from your network
4. Test MongoDB connection using MongoDB Compass

---

**Last Updated**: December 12, 2025
