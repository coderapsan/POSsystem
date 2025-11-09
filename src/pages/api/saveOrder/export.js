import dbConnect from "../../../lib/mongodb";
import Order from "../../../models/Order";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method not allowed" });
  const { start, end } = req.query;
  let filter = {};
  if (start && end) {
    filter.createdAt = { $gte: new Date(start), $lte: new Date(end) };
  }
  const orders = await Order.find(filter);
  const fields = ["orderId", "customerName", "phone", "address", "items", "total", "createdAt"];
  let csv = fields.join(",") + "\n";
  orders.forEach(order => {
    const itemNames = Array.isArray(order.items)
      ? order.items.map(i => i.name).join(";")
      : "";
    csv += [
      order.orderId,
      order.customerName || "",
      order.phone || "",
      order.address || "",
      itemNames,
      order.total,
      order.createdAt.toISOString()
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=orders_backup.csv");
  res.status(200).send(csv);
}
