import Settings from "../models/settingsModel.js";

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await new Settings().save();
  return settings;
};

export const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching settings", error: error.message });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ success: false, message: "Category name is required" });

    const settings = await getOrCreateSettings();
    if (settings.categories.includes(category)) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    settings.categories.push(category);
    settings.updatedAt = new Date();
    await settings.save();
    res.status(200).json({ success: true, message: "Category added successfully", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding category", error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await getOrCreateSettings();
    settings.categories = settings.categories.filter((c) => c !== category);
    settings.categoryLimits.delete(category);
    settings.updatedAt = new Date();
    await settings.save();
    res.status(200).json({ success: true, message: "Category deleted successfully", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting category", error: error.message });
  }
};

export const updateCategoryLimit = async (req, res) => {
  try {
    const { category, limit } = req.body;
    if (!category || limit === undefined) {
      return res.status(400).json({ success: false, message: "Category and limit are required" });
    }

    const settings = await getOrCreateSettings();
    settings.categoryLimits.set(category, Number(limit));
    settings.updatedAt = new Date();
    await settings.save();
    res.status(200).json({ success: true, message: "Category limit updated", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating category limit", error: error.message });
  }
};
