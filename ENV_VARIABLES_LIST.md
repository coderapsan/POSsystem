# 🔐 Environment Variables - Required Setup

## Quick Setup Checklist

Before deploying or running the application, you **MUST** configure these environment variables:

---

## 📝 Environment Variables List

### 1. `MONGODB_URI` (REQUIRED ⚠️)

**Purpose**: Connection string for MongoDB database

**Required for**: 
- Saving orders to database
- Loading order history
- Storing customer data

**Format**:
```
MongoDB Atlas (Cloud):
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

Local MongoDB:
mongodb://localhost:27017/fourdreams
```

**How to get**:
- **Production**: Sign up at https://www.mongodb.com/cloud/atlas (Free tier available)
- **Development**: Install MongoDB locally or use Docker

**Example**:
```env
MONGODB_URI=mongodb+srv://admin:MyP@ssw0rd@cluster0.abc123.mongodb.net/fourdreams?retryWrites=true&w=majority
```

---

### 2. `NEXT_PUBLIC_STAFF_PIN` (OPTIONAL)

**Purpose**: PIN code for accessing staff-only pages (order management, admin panel)

**Default value**: `momos-staff`

**Format**: Any string

**Recommended**: Change to a secure PIN for production

**Example**:
```env
NEXT_PUBLIC_STAFF_PIN=MySecurePin2024
```

**Note**: Must start with `NEXT_PUBLIC_` prefix to be accessible in browser

---

### 3. `ADMIN_PASSWORD` (OPTIONAL)

**Purpose**: Password for admin panel access

**Default value**: `admin123`

**Format**: Any string

**Recommended**: Change to a strong password for production

**Example**:
```env
ADMIN_PASSWORD=MyStr0ngAdm!nP@ss
```

**Note**: This password can also be changed through the admin panel interface

---

### 4. `MASTER_PASSWORD` (REQUIRED for sensitive operations ⚠️)

**Purpose**: High-level password for destructive operations (clearing menu, bulk delete)

**Default value**: `MasterNepal`

**Format**: Any string

**Recommended**: Use a very strong, unique password

**Example**:
```env
MASTER_PASSWORD=MyVeryStr0ngM@sterP@ss2024
NEXT_PUBLIC_MASTER_PASSWORD=MyVeryStr0ngM@sterP@ss2024
```

**Note**: 
- Used for sensitive operations like clearing entire menu or order history
- Requires both `MASTER_PASSWORD` (server-side) and `NEXT_PUBLIC_MASTER_PASSWORD` (client-side)
- **Must be the same value for both variables**

---

## 🚀 Quick Start

### Local Development

1. **Create `.env.local` file** in project root:

```bash
# Windows PowerShell
New-Item .env.local

# Mac/Linux
touch .env.local
```

2. **Add your environment variables**:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_STAFF_PIN=your_secure_pin
```

3. **Restart the server**:

```bash
npm run dev
```

---

### Production Deployment

#### Vercel
```
Settings → Environment Variables → Add:
- MONGODB_URI: your_production_mongodb_uri
- NEXT_PUBLIC_STAFF_PIN: your_staff_pin
```

#### Netlify
```
Site settings → Environment variables → Add same as above
```

#### Other Platforms
Set environment variables in your hosting platform's dashboard

---

## ✅ Verification

### Test your setup:

1. **Check server starts without errors**:
   ```bash
   npm run dev
   ```
   ❌ Error: "Please define the MONGODB_URI" → Setup incomplete
   ✅ No errors → Setup complete

2. **Test order saving**:
   - Go to http://localhost:3000/order
   - Add items to cart
   - Click "Print Receipt"
   - Check http://localhost:3000/order-history
   - ✅ Order appears → Database connected successfully

3. **Test staff access**:
   - Go to http://localhost:3000/order
   - Enter your `NEXT_PUBLIC_STAFF_PIN`
   - ✅ Access granted → PIN configured correctly

---

## 🔒 Security Checklist

- [ ] `.env.local` file created (for local development)
- [ ] `.env.local` is listed in `.gitignore` ✅ (Already configured)
- [ ] Never commit `.env.local` to Git
- [ ] Production environment variables set in hosting platform
- [ ] Strong, unique MongoDB password used
- [ ] Default staff PIN changed to something secure
- [ ] Environment variables never hard-coded in source files

---

## 🆘 Troubleshooting

### Problem: Application crashes on start
**Cause**: Missing `MONGODB_URI`
**Solution**: Add `MONGODB_URI` to `.env.local` and restart server

### Problem: Orders not saving
**Cause**: Invalid MongoDB connection string
**Solution**: 
1. Verify connection string is correct
2. Check MongoDB cluster is running
3. Ensure IP whitelist includes your IP (MongoDB Atlas)

### Problem: Can't access staff pages
**Cause**: Wrong PIN or `NEXT_PUBLIC_STAFF_PIN` not set
**Solution**: Verify PIN in `.env.local` matches what you're entering

### Problem: Environment variables not loading
**Cause**: File location or server not restarted
**Solution**:
1. Ensure `.env.local` is in root directory (same level as `package.json`)
2. Restart development server completely
3. Check for typos in variable names (case-sensitive!)

---

## 📂 File Structure

```
four-dreams-restaurant/
├── .env.local          ← Your environment variables (DO NOT commit)
├── .env.example        ← Template with placeholders (safe to commit)
├── .gitignore          ← Contains .env.local (prevents Git commits)
├── package.json
├── next.config.js
└── src/
    ├── lib/
    │   └── mongodb.js         ← Uses MONGODB_URI
    ├── components/
    │   └── common/
    │       └── StaffGate.js   ← Uses NEXT_PUBLIC_STAFF_PIN
    └── pages/
        └── api/
            └── saveOrder.js   ← Uses MONGODB_URI
```

---

## 📞 Need Help?

1. Read the full guide: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
2. Check MongoDB Atlas docs: https://www.mongodb.com/docs/atlas/
3. Verify all variables are spelled correctly (case-sensitive)
4. Check terminal for specific error messages

---

## 🎯 Summary

**Minimum required for production**: `MONGODB_URI`

**Recommended for production**: Both `MONGODB_URI` and `NEXT_PUBLIC_STAFF_PIN`

**Critical**: Never commit `.env.local` or expose credentials in code

---

**Created**: December 12, 2025  
**Status**: ✅ `.gitignore` configured to protect sensitive files
