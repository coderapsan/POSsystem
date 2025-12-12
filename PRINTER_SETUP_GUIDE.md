# Thermal Printer Configuration Guide

## Printer Specifications
- **Model**: 80mm Direct Thermal Receipt Printer
- **Connection**: USB
- **Print Speed**: 50-200mm/s (Quality to Fast)
- **Resolution**: 203 DPI
- **Characters per Line**: 32 (80mm width)
- **Barcode Support**: UPC-A, UPC-E, EAN-13, EAN-8, CODE128, CODE39, QR Code
- **Character Sets**: ASCII, Chinese Simplified, Korean, Japanese

---

## Installation Steps

### 1. Windows Driver Installation

1. **Download Printer Drivers**
   - Locate drivers from your printer manufacturer (likely on D: drive)
   - Common manufacturers: Zebra, Star, EPSON TM series

2. **Install via Device Manager**
   ```
   1. Right-click Start Menu → Device Manager
   2. Find your printer in USB devices
   3. Right-click → Update Driver
   4. Select "Browse my computer for drivers"
   5. Navigate to driver folder and complete installation
   ```

3. **Verify Installation**
   - Settings → Devices → Printers & Scanners
   - Your thermal printer should appear in the list

### 2. System Configuration

#### Add printer to Windows Print Queue
```powershell
# Run as Administrator
Add-PrinterPort -Name "USB001" -PrinterHostAddress "192.168.1.100"
Add-Printer -Name "Thermal Receipt Printer" -PortName "USB001" -DriverName "Your Printer Model"
```

#### Test Connection
```bash
# From project root, test printer API
curl -X POST http://localhost:3000/api/printer -H "Content-Type: application/json" -d '{"action":"status"}'
```

---

## System Integration

### 1. Environment Configuration
Create or update `.env.local`:
```env
NEXT_PUBLIC_PRINTER_ENABLED=true
PRINTER_SPEED=normal
PRINTER_COPIES=1
PRINTER_MODEL=80mm_thermal
```

### 2. API Integration
The system includes `/api/printer` endpoint that:
- ✅ Detects printer connection
- ✅ Sends ESC/POS commands
- ✅ Manages print queue
- ✅ Handles multiple copies
- ✅ Returns status information

### 3. Admin Panel Integration
The admin dashboard now includes:
- **Print Button**: Available on each order
- **Printer Settings**: Configurable copy count (1, 2, or 3)
- **Status Indication**: Printer connected/ready status
- **Error Handling**: Graceful fallback to browser print

---

## Printer Commands Reference

### Receipt Printing
```javascript
import { ReceiptFormatter } from "@/utils/printerConfig";

const formatter = new ReceiptFormatter("normal"); // or "quality", "fast"
formatter.formatReceipt(order, shopInfo);
const buffer = formatter.buildBuffer();
```

### Barcode Printing
```javascript
// Add barcode to receipt
builder.barcode(orderNumber, "CODE128");
builder.qrCode(orderNumber, 4); // QR code with size 4
```

### Text Formatting
```javascript
builder.boldText("Order Confirmed", "center");
builder.separator("-");
builder.centerText("Thank You!");
builder.newLine(2);
```

---

## Troubleshooting

### Printer Not Detected
1. Check USB connection
2. Verify driver installation
3. Restart spooler service:
   ```powershell
   Restart-Service spooler -Force
   ```

### Print Jobs Queuing But Not Printing
1. Clear print queue:
   ```powershell
   Get-PrintJob -PrinterName "Thermal Receipt Printer" | Remove-PrintJob
   ```
2. Restart printer and wait 30 seconds
3. Test with print button

### Paper Size Issues
- Verify paper width matches (80mm)
- Check paper is loaded correctly
- Adjust line length in PRINTER_CONFIG if needed

### Character Encoding Problems
1. For Chinese/Japanese, ensure proper charset is set
2. Update PRINTER_CONFIG.charsets if needed
3. Verify font support on printer

---

## Performance Optimization

### Print Speed Settings
```javascript
// In printerService.js
const SPEEDS = {
  quality: 50,   // Best quality, slowest
  normal: 150,   // Recommended for receipts
  fast: 200      // Fastest, acceptable quality
};
```

### Queue Management
```javascript
// Automatic queue processing
// Max 1 print job at a time
// 1 second delay between jobs
// Manual clear available via /api/printer?action=clearQueue
```

---

## Features Enabled

✅ **Receipt Printing**: Full thermal receipt with order details
✅ **Multiple Copies**: Admin configurable (1, 2, 3 copies)
✅ **QR Code Tracking**: Order ID as QR code on receipt
✅ **Barcode Support**: UPC, EAN, CODE128, QR
✅ **Customer Info**: Name, phone, address, postal code
✅ **Order Items**: Quantity, name, price, portion
✅ **Auto Cut**: Paper cut after each receipt
✅ **Cash Drawer**: Optional drawer kick support

---

## Testing

### Test Print Page
```bash
# Send test page to printer
curl -X POST http://localhost:3000/api/printer \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

### Printer Status
```bash
# Check printer status
curl -X POST http://localhost:3000/api/printer \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

---

## Advanced Configuration

### Custom Header/Footer
Edit `/src/utils/printerConfig.js` in `ReceiptFormatter.formatReceipt()`:
```javascript
// Modify shop info
const shopInfo = {
  name: "Your Restaurant Name",
  address: "Your Address",
  phone: "Your Phone",
};
```

### Paper Cut Options
```javascript
builder.cut(false);  // Full cut (default)
builder.cut(true);   // Partial cut
```

### Character Set Selection
```javascript
// In printerConfig.js, modify charsets
charsets: {
  ASCII: 0,                // English
  CHINESE_SIMPLIFIED: 1,   // Simplified Chinese
  KOREAN: 2,               // Korean
  JAPANESE: 3,             // Japanese
}
```

---

## Support Resources

- **Printer Manual**: Check D: drive or manufacturer website
- **ESC/POS Documentation**: https://en.wikipedia.org/wiki/ESC/P
- **Node.js Serial Port**: https://serialport.io/
- **Thermal Printer Libraries**: node-thermal-printer

---

## Notes

- System gracefully falls back to browser print if thermal printer unavailable
- All print jobs are logged in server console
- Print queue is in-memory (clears on server restart)
- Supports up to 255 print jobs in queue
- Paper width of 80mm = 32 characters per line

Generated: December 10, 2025
System: The MoMos POS - Phase 4
