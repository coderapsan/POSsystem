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
        customerName: orderData.customerName || orderData.customer?.name || "",
        customer: orderData.customer || {},
        paymentMethod: orderData.paymentMethod || "",
        isPaid: orderData.isPaid || false,
        discountPercent: orderData.totals?.discount?.input || orderData.discountPercent || "",
        orderType: orderData.orderType || "",
        status: orderData.status || (orderData.source === "customer" ? "pending" : "accepted"),
        source: orderData.source || "pos",
        isNewCustomer: orderData.isNewCustomer !== undefined ? orderData.isNewCustomer : true,
        createdAt: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
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
      const { source, status, postalCode } = req.query;
      let query = {};
      if (source) query.source = source;
      if (status) query.status = status;
      if (postalCode) query["customer.postalCode"] = postalCode;
      const orders = await Order.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      await connectToDatabase();
      const { orderId } = req.query;
      if (!orderId) {
        return res.status(400).json({ success: false, error: "orderId is required" });
      }

      const result = await Order.findOneAndDelete({ orderId });
      if (!result) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting order:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
