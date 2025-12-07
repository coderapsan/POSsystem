import connectToDatabase from "../../../lib/mongodb";
import Order from "../../../models/Order";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { orderId, status } = req.body || {};
  if (!orderId || !status) {
    return res.status(400).json({ success: false, error: "orderId and status are required" });
  }

  const allowedStatuses = ["pending", "accepted", "completed", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status" });
  }

  try {
    await connectToDatabase();

    const update = { status };
    if (status === "accepted") {
      update.acceptedAt = new Date();
    }
    if (status === "completed") {
      update.completedAt = new Date();
    }

    const order = await Order.findOneAndUpdate({ orderId }, { $set: update }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
