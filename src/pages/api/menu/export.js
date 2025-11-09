import dbConnect from "../../../lib/mongodb";
import Menu from "../../../models/Menu";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method not allowed" });
  const items = await Menu.find({});
  const fields = ["name", "category", "description", "portion", "spicyLevel", "allergens", "isAvailable", "price.large", "price.small"];
  let csv = fields.join(",") + "\n";
  items.forEach(item => {
    csv += [
      item.name,
      item.category,
      item.description || "",
      item.portion || "",
      item.spicyLevel || "",
      item.allergens || "",
      item.isAvailable ? "true" : "false",
      item.price?.large ?? "",
      item.price?.small ?? "",
      item.customer?.name || "",
      item.customer?.phone || "",
      item.customer?.address || ""
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=menu_backup.csv");
  res.status(200).send(csv);
}
