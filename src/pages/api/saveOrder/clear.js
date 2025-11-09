import dbConnect from "../../../lib/mongodb";
import Order from "../../../models/Order";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "DELETE") return res.status(405).json({ success: false, error: "Method not allowed" });
  const { start, end, password } = req.body;
  if (password !== "MasterNepal") return res.status(403).json({ success: false, error: "Invalid password" });
  if (!start || !end) return res.status(400).json({ success: false, error: "Missing date range" });
  try {
    const result = await Order.deleteMany({ createdAt: { $gte: new Date(start), $lte: new Date(end) } });
    return res.status(200).json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
