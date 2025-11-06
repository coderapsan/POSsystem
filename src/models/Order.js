import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    items: { type: Array, required: true },  // array of items in the order
    total: { type: Number, required: true },
    customerName: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "orders" }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
