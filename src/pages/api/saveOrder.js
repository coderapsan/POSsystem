import connectToDatabase from "../../lib/mongodb";
import Order from "../../models/Order";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await connectToDatabase();

      const orderData = req.body;

      const newOrder = new Order({
        orderId: orderData.orderId,
        items: orderData.items,
        total: orderData.total,
        customerName: orderData.customerName || "",
        customer: orderData.customer || {},
        paymentMethod: orderData.paymentMethod || "",
        isPaid: orderData.isPaid || false,
        discountPercent: orderData.discountPercent || "",
        orderType: orderData.orderType || "",
        status: orderData.status || (orderData.source === "customer" ? "pending" : "accepted"),
        source: orderData.source || "pos",
      });
      console.log("Saving new order:", newOrder);
      await newOrder.save();

      return res.status(200).json({ success: true, orderId: newOrder.orderId });
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "GET") {
    try {
      await connectToDatabase();
      const { source, status } = req.query;
      let query = {};
      if (source) query.source = source;
      if (status) query.status = status;
      const orders = await Order.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
