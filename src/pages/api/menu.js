import dbConnect from "../../lib/mongodb";
import Menu from "../../models/Menu";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === "GET") {
    // Fetch all menu items, group by category
    const items = await Menu.find({});
    const menu = {};
    items.forEach(item => {
      if (!menu[item.category]) menu[item.category] = [];
      menu[item.category].push({
        id: item._id,
        name: item.name,
        description: item.description,
        price: item.price,
        portion: item.portion,
        spicyLevel: item.spicyLevel,
        allergens: item.allergens,
        isAvailable: item.isAvailable
      });
    });
    return res.status(200).json({ success: true, menu });
  }
  if (req.method === "POST") {
    // Add new menu item
    const { category, item } = req.body;
    if (!category || !item || !item.name || !item.price) return res.status(400).json({ success: false, error: "Missing fields" });
    try {
      const newItem = await Menu.create({ ...item, category, price: item.price });
      return res.status(201).json({ success: true, item: newItem });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  if (req.method === "PUT") {
    // Edit menu item field
    const { itemId, field, value } = req.body;
    if (!itemId || !field) return res.status(400).json({ success: false, error: "Missing fields" });
    try {
      let update = {};
      if (field.startsWith("price.")) {
        const priceField = field.split(".")[1];
        update[`price.${priceField}`] = value;
      } else {
        update[field] = value;
      }
      await Menu.findByIdAndUpdate(itemId, { $set: update });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  if (req.method === "DELETE") {
    // Clear all menu items (requires password)
    const { password } = req.body;
    if (password !== "MasterNepal") return res.status(403).json({ success: false, error: "Invalid password" });
    try {
      await Menu.deleteMany({});
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  res.status(405).json({ success: false, error: "Method not allowed" });
}
