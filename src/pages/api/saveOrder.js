import connectToDatabase from "../../lib/mongodb";
import Order from "../../models/Order";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await connectToDatabase();

      const orderData = req.body;

      const newOrder = new Order({
        items: orderData.items,
        total: orderData.total,
        customerName: orderData.customerName || "",
      });
console.log("Saving new order:", newOrder);
      await newOrder.save();

      return res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "GET") {
    // Optional: fetch all orders
    try {
      await connectToDatabase();
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
