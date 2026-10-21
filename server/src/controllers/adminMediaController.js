import BusinessSettings from "../models/BusinessSettings.js";
import { uploadTrackedImage, scheduleStoredCleanup, activateCleanup } from "../services/mediaCleanup.js";
async function getOrCreateSettings() {
  return await BusinessSettings.findOne({ key: "main" }) || BusinessSettings.create({ key: "main" });
}
export async function uploadBusinessLogo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please select a logo image." });
    const settings = await getOrCreateSettings();
    const oldPublicId = settings.logoPublicId;
    if (oldPublicId) await scheduleStoredCleanup(oldPublicId, "settings", settings._id, "logo-replacement");
    const result = await uploadTrackedImage(req.file.buffer, { folder: "rj-ac/branding" }, "settings", settings._id);
    settings.logoUrl = result.secure_url;
    settings.logoPublicId = result.public_id;
    settings.updatedBy = req.admin._id;
    await settings.save();
    await activateCleanup(oldPublicId);
    res.json({ success: true, message: "Business logo uploaded successfully.", logoUrl: settings.logoUrl, logoPublicId: settings.logoPublicId });
  } catch (error) { next(error); }
}
export async function deleteBusinessLogo(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    const oldPublicId = settings.logoPublicId;
    await scheduleStoredCleanup(settings.logoPublicId, "settings", settings._id, "logo-removal");
    settings.logoUrl = ""; settings.logoPublicId = ""; settings.updatedBy = req.admin._id;
    await settings.save();
    await activateCleanup(oldPublicId);
    res.json({ success: true, message: "Business logo removed successfully.", logoUrl: "", logoPublicId: "" });
  } catch (error) { next(error); }
}
