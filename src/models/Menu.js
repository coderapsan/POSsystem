import mongoose from "mongoose";

const priceSchema = new mongoose.Schema({
  large: { type: Number, default: 0 },
  small: { type: Number, default: 0 }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  price: { type: priceSchema, required: true },
  portion: { type: String, default: "standard" },
  spicyLevel: String,
  allergens: { type: [String], default: [] },
  isAvailable: { type: Boolean, default: true },
  legacyId: { type: Number, index: true }
}, { timestamps: true });

export default mongoose.models.Menu || mongoose.model("Menu", menuItemSchema);
