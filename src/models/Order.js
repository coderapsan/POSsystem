import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // 5-digit unique order id
    items: { type: Array, required: true },  // array of items in the order
    total: { type: Number, required: true },
    customerName: { type: String },
    customer: { 
      type: Object,
      default: {}
    }, // full customer info with phone, address, postalCode, etc.
    paymentMethod: { type: String },
    stripePaymentIntentId: { type: String }, // Stripe payment intent ID
    stripePaymentStatus: { type: String }, // succeeded, pending, failed
    cardDetails: {
      type: Object,
      default: null
    }, // DEPRECATED: Use Stripe instead. Legacy orders only.
    isPaid: { type: Boolean },
    discountPercent: { type: String },
    orderType: { type: String },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "pending" }, // pending, accepted, completed, rejected
    source: { type: String }, // 'customer' or 'pos'
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    completedAt: { type: Date },
    isNewCustomer: { type: Boolean, default: true }, // true if first order with postal code
  },
  { collection: "orders" }
);

// Create indexes for efficient customer lookups
OrderSchema.index({ "customer.phone": 1, createdAt: -1 });
OrderSchema.index({ "customer.postalCode": 1, createdAt: -1 });
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
