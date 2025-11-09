import dbConnect from "../../../lib/mongodb";
import Order from "../../../models/Order";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method not allowed" });
  // Get all unique customer records
  const orders = await Order.find({}, "customerName phone address");
  const seen = new Set();
  const customers = [];
  for (const o of orders) {
    const key = `${o.customerName}|${o.phone}|${o.address}`;
    if (!seen.has(key) && o.customerName && o.phone && o.address) {
      customers.push({ name: o.customerName, phone: o.phone, address: o.address });
      seen.add(key);
    }
  }
  res.status(200).json({ success: true, customers });
}
