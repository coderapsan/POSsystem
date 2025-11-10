import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // 5-digit unique order id
    items: { type: Array, required: true },  // array of items in the order
    total: { type: Number, required: true },
    customerName: { type: String },
    customer: { type: Object }, // full customer info
    paymentMethod: { type: String },
    isPaid: { type: Boolean },
    discountPercent: { type: String },
    orderType: { type: String },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "pending" }, // pending, accepted, completed
    source: { type: String }, // 'customer' or 'pos'
  },
  { collection: "orders" }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
