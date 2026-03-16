import dbConnect from "../../../lib/mongodb";
import Order from "../../../models/Order";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await dbConnect();
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }

    // Find the most recent order with this phone number
    const recentOrder = await Order.findOne({ 
      "customer.phone": phone 
    }).sort({ createdAt: -1 });

    if (!recentOrder) {
      return res.status(200).json({ 
        success: true, 
        found: false,
        customer: null,
        orders: []
      });
    }

    // Get all orders for this phone number
    const allOrders = await Order.find({ 
      "customer.phone": phone 
    }).sort({ createdAt: -1 }).limit(10);

    // Return the customer data from most recent order
    return res.status(200).json({
      success: true,
      found: true,
      customer: {
        name: recentOrder.customer?.name || recentOrder.customerName || "",
        phone: recentOrder.customer?.phone || phone,
        address: recentOrder.customer?.address || "",
        postalCode: recentOrder.customer?.postalCode || "",
      },
      orders: allOrders.map(order => ({
        orderId: order.orderId,
        orderType: order.orderType,
        total: order.total,
        items: order.items,
        createdAt: order.createdAt,
        status: order.status,
        isPaid: order.isPaid,
      })),
      orderCount: allOrders.length,
    });
  } catch (error) {
    console.error("Error looking up customer:", error);
    
    if (error.message === 'DATABASE_NOT_CONFIGURED') {
      return res.status(200).json({ 
        success: true, 
        found: false,
        customer: null,
        orders: [],
        warning: 'Database not configured' 
      });
    }
    
    return res.status(500).json({ success: false, error: error.message });
  }
}
