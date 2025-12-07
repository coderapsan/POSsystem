import path from "path";
import { promises as fs } from "fs";
import dbConnect from "../../../lib/mongodb";
import Menu from "../../../models/Menu";

const MASTER_PASSWORD = "MasterNepal";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normaliseAllergens(allergens) {
  if (Array.isArray(allergens)) {
    return allergens.filter(Boolean).map((tag) => String(tag).trim());
  }
  if (!allergens) return [];
  return String(allergens)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { password } = req.body || {};
  if (password !== MASTER_PASSWORD) {
    return res.status(403).json({ success: false, error: "Invalid password" });
  }

  try {
    await dbConnect();

    const jsonPath = path.join(process.cwd(), "src", "data", "momos.json");
    const raw = await fs.readFile(jsonPath, "utf-8");
    const menuData = JSON.parse(raw);

    let created = 0;
    let updated = 0;

    for (const [category, items] of Object.entries(menuData || {})) {
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const filter = item.id
          ? { legacyId: item.id }
          : { name: item.name, category };

        const existing = await Menu.findOne(filter);

        const rawLarge = toNumber(
          item.price?.large ?? item.price?.regular ?? item.price?.standard ?? item.price
        );
        const rawSmall = toNumber(item.price?.small);
        const priceLarge = rawLarge > 0 ? rawLarge : rawSmall;
        const priceSmall = rawSmall > 0 && rawSmall !== priceLarge ? rawSmall : 0;

        const payload = {
          name: item.name,
          description: item.description || "",
          category,
          price: {
            large: priceLarge,
            small: priceSmall,
          },
          portion: item.portion || "standard",
          spicyLevel: item.spicyLevel || "",
          allergens: normaliseAllergens(item.allergens),
          isAvailable: item.isAvailable !== false,
          legacyId: typeof item.id === "number" ? item.id : existing?.legacyId,
        };

        if (existing) {
          await Menu.updateOne({ _id: existing._id }, { $set: payload });
          updated += 1;
        } else {
          await Menu.create(payload);
          created += 1;
        }
      }
    }

    return res.status(200).json({ success: true, created, updated });
  } catch (error) {
    console.error("Menu import error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
