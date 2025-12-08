import path from "path";
import { promises as fs } from "fs";
import dbConnect from "../../lib/mongodb";
import Menu from "../../models/Menu";

const MENU_CACHE_TTL = 1000 * 30; // 30 seconds

const globalMenuCache = global.__momosMenuCache || {
  data: null,
  expiresAt: 0,
};

if (!global.__momosMenuCache) {
  global.__momosMenuCache = globalMenuCache;
}

function getCachedMenu() {
  if (globalMenuCache.data && globalMenuCache.expiresAt > Date.now()) {
    return globalMenuCache.data;
  }
  return null;
}

function setCachedMenu(menu) {
  globalMenuCache.data = menu;
  globalMenuCache.expiresAt = Date.now() + MENU_CACHE_TTL;
}

function invalidateMenuCache() {
  globalMenuCache.data = null;
  globalMenuCache.expiresAt = 0;
}

function normalizeAllergens(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function seedMenuFromJson() {
  const jsonPath = path.join(process.cwd(), "src", "data", "momos.json");
  const raw = await fs.readFile(jsonPath, "utf-8");
  const menuData = JSON.parse(raw);

  const docs = [];

  Object.entries(menuData || {}).forEach(([category, items]) => {
    if (!Array.isArray(items)) return;

    items.forEach((item) => {
      const rawLarge = Number(
        item?.price?.large ?? item?.price?.regular ?? item?.price?.standard ?? item?.price
      );
      const rawSmall = Number(item?.price?.small ?? 0);
      const parsedLarge = Number.isFinite(rawLarge) && rawLarge > 0 ? rawLarge : 0;
      const parsedSmall = Number.isFinite(rawSmall) && rawSmall > 0 ? rawSmall : 0;

      docs.push({
        name: item.name,
        description: item.description || "",
        category,
        price: {
          large: parsedLarge || parsedSmall,
          small: parsedSmall && parsedSmall !== parsedLarge ? parsedSmall : 0,
        },
        portion: item.portion || "standard",
        spicyLevel: item.spicyLevel || "",
        allergens: normalizeAllergens(item.allergens),
        isAvailable: item.isAvailable !== false,
        legacyId: typeof item.id === "number" ? item.id : undefined,
      });
    });
  });

  if (docs.length === 0) return [];

  await Menu.insertMany(docs);
  return docs;
}

export default async function handler(req, res) {
  await dbConnect();

  try {
    switch (req.method) {
      case "GET": {
        const cached = getCachedMenu();
        if (cached) {
          return res.status(200).json({ success: true, menu: cached, cache: "hit" });
        }

        let items = await Menu.find({}).sort({ category: 1, name: 1 }).lean();

        if (items.length === 0) {
          try {
            await seedMenuFromJson();
            items = await Menu.find({}).sort({ category: 1, name: 1 }).lean();
          } catch (seedError) {
            console.error("Menu seed failed:", seedError);
          }
        }
        const menu = {};

        items.forEach((item) => {
          const category = item.category || "Uncategorized";
          if (!menu[category]) menu[category] = [];
          menu[category].push({
            id: item._id?.toString(),
            name: item.name,
            description: item.description,
            price: item.price,
            portion: item.portion,
            spicyLevel: item.spicyLevel,
            allergens: normalizeAllergens(item.allergens),
            isAvailable: item.isAvailable !== false,
          });
        });

        setCachedMenu(menu);

        return res.status(200).json({ success: true, menu });
      }

      case "POST": {
        const { category, item } = req.body;
        if (!category || !item || !item.name || !item.price) {
          return res.status(400).json({ success: false, error: "Missing fields" });
        }

        const payload = {
          category: String(category).trim(),
          name: item.name.trim(),
          description: item.description || "",
          price: {
            large: Number(item.price.large) || 0,
            small: Number(item.price.small) || 0,
          },
          portion: item.portion || "standard",
          spicyLevel: item.spicyLevel || "",
          allergens: normalizeAllergens(item.allergens),
          isAvailable: item.isAvailable !== false,
        };

        const newItem = await Menu.create(payload);
        invalidateMenuCache();
        return res.status(201).json({ success: true, item: newItem });
      }

      case "PUT": {
        const { itemId, field, value, updates } = req.body;
        if (!itemId) {
          return res.status(400).json({ success: false, error: "Missing fields" });
        }

        let update = {};
        if (updates && typeof updates === "object") {
          update = { ...updates };
        } else if (field) {
          if (field.startsWith("price.")) {
            const priceField = field.split(".")[1];
            update[`price.${priceField}`] = value;
          } else {
            update[field] = value;
          }
        } else {
          return res.status(400).json({ success: false, error: "Nothing to update" });
        }

        if (update.price) {
          update.price = {
            large: Number(update.price.large) || 0,
            small: Number(update.price.small) || 0,
          };
        }

        if (Object.prototype.hasOwnProperty.call(update, "allergens")) {
          update.allergens = normalizeAllergens(update.allergens);
        }

        if (Object.prototype.hasOwnProperty.call(update, "isAvailable")) {
          update.isAvailable = Boolean(update.isAvailable);
        }

        if (update.category) {
          update.category = String(update.category).trim();
        }

        if (update.name) {
          update.name = String(update.name).trim();
        }

        await Menu.findByIdAndUpdate(itemId, { $set: update });
        invalidateMenuCache();
        return res.status(200).json({ success: true });
      }

      case "DELETE": {
        const { itemId, password } = req.body;
        if (itemId) {
          await Menu.findByIdAndDelete(itemId);
          invalidateMenuCache();
          return res.status(200).json({ success: true });
        }

        if (password !== "MasterNepal") {
          return res.status(403).json({ success: false, error: "Invalid password" });
        }

        await Menu.deleteMany({});
        invalidateMenuCache();
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Menu API error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
