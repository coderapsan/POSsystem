/**
 * Thermal Printer Configuration
 * Supports 80mm direct thermal receipt printer with USB connection
 * Works with multiple barcode types and QR codes
 */

export const PRINTER_CONFIG = {
  // Printer connection settings
  connection: {
    type: "USB", // USB or Network
    baudRate: 9600, // For serial connection if applicable
    timeout: 5000,
  },
  
  // Paper settings
  paper: {
    width: 80, // mm
    dpi: 203, // dots per inch
    charsPerLine: 32, // standard for 80mm
  },

  // Print speeds
  speeds: {
    quality: 50,  // mm/s - highest quality
    normal: 150,  // mm/s - normal speed
    fast: 200,    // mm/s - fastest speed
  },

  // Character sets
  charsets: {
    ASCII: 0,
    CHINESE_SIMPLIFIED: 1,
    KOREAN: 2,
    JAPANESE: 3,
  },

  // Barcode types supported
  barcodes: {
    UPC_A: "UPC-A",
    UPC_E: "UPC-E",
    EAN13: "EAN-13",
    EAN8: "EAN-8",
    CODE128: "CODE128",
    CODE39: "CODE39",
    QR_CODE: "QR",
  },

  // Text alignment
  alignment: {
    LEFT: "left",
    CENTER: "center",
    RIGHT: "right",
  },

  // Text styles
  textStyle: {
    NORMAL: 0,
    BOLD: 1,
    DOUBLE_WIDTH: 2,
    DOUBLE_HEIGHT: 4,
  },
};

/**
 * Print command builder for thermal printer
 */
export class PrinterCommandBuilder {
  constructor() {
    this.commands = [];
    this.lineBuffer = "";
  }

  // Initialize printer
  initialize() {
    this.commands.push("\x1B\x40"); // ESC @ - Initialize
    return this;
  }

  // Set alignment
  setAlignment(alignment) {
    const alignMap = {
      left: 0,
      center: 1,
      right: 2,
    };
    this.commands.push(`\x1B\x61${String.fromCharCode(alignMap[alignment] || 0)}`);
    return this;
  }

  // Set text style
  setStyle(style) {
    this.commands.push(`\x1B\x21${String.fromCharCode(style)}`);
    return this;
  }

  // Print text
  text(content, alignment = "left") {
    this.setAlignment(alignment);
    this.commands.push(content);
    this.commands.push("\n");
    return this;
  }

  // Print bold text
  boldText(content, alignment = "center") {
    this.setStyle(PRINTER_CONFIG.textStyle.BOLD);
    this.text(content, alignment);
    this.setStyle(PRINTER_CONFIG.textStyle.NORMAL);
    return this;
  }

  // Print centered text
  centerText(content) {
    return this.text(content, "center");
  }

  // Print line separator
  separator(char = "-") {
    const line = char.repeat(PRINTER_CONFIG.paper.charsPerLine);
    this.commands.push(line);
    this.commands.push("\n");
    return this;
  }

  // Print blank lines
  newLine(count = 1) {
    for (let i = 0; i < count; i++) {
      this.commands.push("\n");
    }
    return this;
  }

  // Print barcode
  barcode(value, type = "CODE128") {
    // ESC w n1 n2 - Set barcode width
    this.commands.push("\x1D\x77\x03"); // width = 3
    // ESC h n - Set barcode height
    this.commands.push("\x1D\x68\x50"); // height = 80
    // GS k - Print barcode
    this.commands.push(`\x1D\x6B${String.fromCharCode(4)}`); // CODE128
    this.commands.push(value);
    this.commands.push("\x00");
    return this;
  }

  // Print QR code
  qrCode(value, size = 5) {
    // GS ( k - Set QR code size
    this.commands.push(`\x1D\x28\x6B\x03\x00\x31\x43${String.fromCharCode(size)}`);
    // GS ( k - Store data in symbol storage area
    const dataLength = value.length + 3;
    this.commands.push(`\x1D\x28\x6B${String.fromCharCode(dataLength & 0xFF)}${String.fromCharCode((dataLength >> 8) & 0xFF)}\x31\x44\x30`);
    this.commands.push(value);
    // GS ( k - Print QR code
    this.commands.push("\x1D\x28\x6B\x03\x00\x31\x52\x30");
    return this;
  }

  // Set print speed
  setSpeed(speed = "normal") {
    const speedMap = {
      quality: 0,
      normal: 1,
      fast: 2,
    };
    this.commands.push(`\x1D\x7C${String.fromCharCode(speedMap[speed] || 1)}`);
    return this;
  }

  // Cut paper
  cut(partial = false) {
    if (partial) {
      this.commands.push("\x1D\x56\x01"); // Partial cut
    } else {
      this.commands.push("\x1D\x56\x00"); // Full cut
    }
    return this;
  }

  // Open cash drawer
  openDrawer() {
    this.commands.push("\x1B\x70\x00\x32\xC8");
    return this;
  }

  // Get all commands as string
  build() {
    return this.commands.join("");
  }

  // Get all commands as buffer for binary sending
  buildBuffer() {
    return Buffer.from(this.build(), "binary");
  }

  // Reset builder
  reset() {
    this.commands = [];
    return this;
  }
}

/**
 * Receipt formatter for thermal printer
 */
export class ReceiptFormatter {
  constructor(printSpeed = "normal") {
    this.builder = new PrinterCommandBuilder();
    this.builder.setSpeed(printSpeed);
  }

  /**
   * Format complete receipt
   */
  formatReceipt(order, shopInfo) {
    this.builder.initialize();

    // Header
    this.builder.newLine(1);
    this.builder.boldText(shopInfo.name || "The MoMos", "center");
    this.builder.centerText(shopInfo.address || "");
    this.builder.centerText(shopInfo.phone || "");
    this.builder.separator();

    // Order info
    this.builder.setAlignment("left");
    this.builder.text(`Order #: ${order.orderId}`);
    this.builder.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`);
    this.builder.text(`Type: ${order.orderType || "Delivery"}`);

    // Customer info
    if (order.customer?.name) {
      this.builder.separator();
      this.builder.text(`Customer: ${order.customer.name}`);
      if (order.customer.phone) this.builder.text(`Phone: ${order.customer.phone}`);
      if (order.customer.address) this.builder.text(`Address: ${order.customer.address}`);
      if (order.customer.postalCode) this.builder.text(`Postal: ${order.customer.postalCode}`);
    }

    // Items
    this.builder.separator();
    (order.items || []).forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const total = (qty * price).toFixed(2);
      const portion = item.portion ? ` (${item.portion})` : "";
      
      // Item name and quantity
      this.builder.text(`${qty}x ${item.name}${portion}`);
      
      // Price aligned to right
      const line = `${qty} × £${price.toFixed(2)} = £${total}`;
      this.builder.setAlignment("right");
      this.builder.text(`£${total}`);
      this.builder.setAlignment("left");
    });

    // Totals
    this.builder.separator();
    this.builder.setAlignment("right");
    this.builder.text(`Subtotal: £${Number(order.total || 0).toFixed(2)}`);
    this.builder.boldText(`Total: £${Number(order.total || 0).toFixed(2)}`);
    this.builder.setAlignment("left");

    // Payment
    this.builder.separator();
    this.builder.text(`Payment: ${order.paymentMethod || "Cash"}`);
    if (order.isNewCustomer !== false) {
      this.builder.text(`Status: New Customer`);
    } else {
      this.builder.text(`Status: Returning Customer`);
    }

    // QR Code for order tracking (optional)
    if (order.orderId) {
      this.builder.newLine(1);
      this.builder.centerText("Order ID:");
      this.builder.qrCode(order.orderId, 4);
    }

    // Footer
    this.builder.newLine(2);
    this.builder.centerText("Thank You!");
    this.builder.centerText("Visit Again Soon");
    this.builder.newLine(1);

    // Cut paper
    this.builder.cut(false);
    this.builder.newLine(2);

    return this;
  }

  /**
   * Get the built receipt commands
   */
  build() {
    return this.builder.build();
  }

  /**
   * Get as buffer for sending to printer
   */
  buildBuffer() {
    return this.builder.buildBuffer();
  }
}

export default PRINTER_CONFIG;
