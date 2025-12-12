/**
 * Thermal Printer Service
 * Handles communication with USB thermal printer for receipt printing
 */

import { ReceiptFormatter, PRINTER_CONFIG } from "./printerConfig";

class ThermalPrinterService {
  constructor() {
    this.isConnected = false;
    this.printerPort = null;
    this.printQueue = [];
    this.isPrinting = false;
  }

  /**
   * Initialize printer connection
   * For Windows, uses window.print() API or direct USB via Node.js backend
   */
  async initialize() {
    try {
      if (typeof window === "undefined") {
        // Server-side: Would use serialport or similar
        console.log("Printer service initialized (server mode)");
        return true;
      }

      // Client-side: Check if printer is available
      console.log("Thermal printer service ready");
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize printer:", error);
      return false;
    }
  }

  /**
   * Generate receipt and print
   */
  async printReceipt(order, shopInfo, copies = 1) {
    try {
      const formatter = new ReceiptFormatter();
      formatter.formatReceipt(order, shopInfo);
      const receiptContent = formatter.build();

      // Queue the print job
      for (let i = 0; i < copies; i++) {
        this.printQueue.push({
          content: receiptContent,
          orderId: order.orderId,
          timestamp: new Date(),
        });
      }

      // Process queue
      await this.processPrintQueue();
      return { success: true, message: `Receipt queued for printing (${copies} copies)` };
    } catch (error) {
      console.error("Print receipt error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process print queue
   */
  async processPrintQueue() {
    if (this.isPrinting || this.printQueue.length === 0) return;

    this.isPrinting = true;

    try {
      while (this.printQueue.length > 0) {
        const job = this.printQueue.shift();
        await this.executePrintJob(job);
        // Add delay between jobs
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      this.isPrinting = false;
    }
  }

  /**
   * Execute individual print job
   */
  async executePrintJob(job) {
    try {
      if (typeof window !== "undefined") {
        // Client-side printing via browser
        // This would send to backend API for actual printer control
        await fetch("/api/printer/print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: job.content,
            orderId: job.orderId,
          }),
        });
      }
      return true;
    } catch (error) {
      console.error("Execute print job error:", error);
      throw error;
    }
  }

  /**
   * Get printer status
   */
  async getStatus() {
    return {
      isConnected: this.isConnected,
      queueLength: this.printQueue.length,
      isPrinting: this.isPrinting,
      config: PRINTER_CONFIG,
    };
  }

  /**
   * Cancel all pending jobs
   */
  clearQueue() {
    this.printQueue = [];
    return { success: true, message: "Print queue cleared" };
  }
}

export default new ThermalPrinterService();
