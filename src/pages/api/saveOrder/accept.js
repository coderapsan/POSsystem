import connectToDatabase from "../../../lib/mongodb";
import Order from "../../../models/Order";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, error: "orderId is required" });
  }

  try {
    await connectToDatabase();
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { status: "accepted", acceptedAt: new Date() },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error accepting order:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
