import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method === "POST") {
    try {
      const orderData = req.body;
      const filePath = path.join(process.cwd(), "src", "data", "orders.json");

      let existingOrders = [];
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        existingOrders = JSON.parse(fileData || "[]");
      }

      existingOrders.push(orderData);
      fs.writeFileSync(filePath, JSON.stringify(existingOrders, null, 2), "utf-8");

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({ success: false });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
