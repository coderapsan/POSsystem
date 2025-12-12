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
    
    // Validate orderId format
    if (typeof orderId !== "string" || orderId.trim() === "") {
      return res.status(400).json({ success: false, error: "Invalid orderId format" });
    }
    
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId.trim() },
      { status: "accepted", acceptedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      console.warn(`Order not found for orderId: ${orderId}`);
      return res.status(404).json({ success: false, error: `Order #${orderId} not found in system` });
    }

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error accepting order:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to accept order. Please try again." 
    });
  }
}
