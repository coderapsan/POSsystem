import dbConnect from "../../../lib/mongodb";
import Menu from "../../../models/Menu";

export default async function handler(req, res) {
  await dbConnect();

  // Only POST requests allowed
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { itemId, imageUrl } = req.body;

  if (!itemId || !imageUrl) {
    return res.status(400).json({ success: false, error: "itemId and imageUrl are required" });
  }

  // Validate imageUrl is a proper URL
  try {
    new URL(imageUrl);
  } catch (error) {
    return res.status(400).json({ success: false, error: "Invalid image URL format" });
  }

  try {
    const updatedItem = await Menu.findByIdAndUpdate(
      itemId,
      { imageUrl },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ success: false, error: "Menu item not found" });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Image uploaded successfully",
      item: updatedItem 
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to upload image" 
    });
  }
}
