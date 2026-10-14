import BusinessSettings from "../models/BusinessSettings.js";

import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "../utils/cloudinaryMedia.js";

async function getOrCreateSettings() {
  let settings =
    await BusinessSettings.findOne({
      key: "main",
    });

  if (!settings) {
    settings =
      await BusinessSettings.create({
        key: "main",
      });
  }

  return settings;
}

export async function uploadBusinessLogo(
  req,
  res,
  next
) {
  let newAsset = null;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Please select a logo image.",
        });
    }

    const settings =
      await getOrCreateSettings();

    const oldPublicId =
      settings.logoPublicId;

    const result =
      await uploadImageBuffer(
        req.file.buffer,
        {
          folder:
            "rj-ac/branding",

          transformation: [
            {
              width: 1000,
              height: 1000,
              crop: "limit",
            },

            {
              quality: "auto",
            },

            {
              fetch_format:
                "auto",
            },
          ],
        }
      );

    newAsset = {
      url:
        result.secure_url,

      publicId:
        result.public_id,
    };

    settings.logoUrl =
      newAsset.url;

    settings.logoPublicId =
      newAsset.publicId;

    settings.updatedBy =
      req.admin._id;

    await settings.save();

    /*
     * Only remove the old logo
     * after the new logo has been
     * safely stored in MongoDB.
     */
    if (
      oldPublicId &&
      oldPublicId !==
        newAsset.publicId
    ) {
      try {
        await deleteCloudinaryImage(
          oldPublicId
        );
      } catch (error) {
        console.error(
          "Old logo cleanup failed:",
          error
        );
      }
    }

    res.status(200).json({
      success: true,

      message:
        "Business logo uploaded successfully.",

      logoUrl:
        settings.logoUrl,

      logoPublicId:
        settings.logoPublicId,
    });
  } catch (error) {
    /*
     * If Cloudinary succeeded but
     * MongoDB failed, delete the
     * newly uploaded logo.
     */
    if (
      newAsset?.publicId
    ) {
      try {
        await deleteCloudinaryImage(
          newAsset.publicId
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "New logo cleanup failed:",
          cleanupError
        );
      }
    }

    next(error);
  }
}

export async function deleteBusinessLogo(
  req,
  res,
  next
) {
  try {
    const settings =
      await getOrCreateSettings();

    const publicId =
      settings.logoPublicId;

    settings.logoUrl = "";
    settings.logoPublicId =
      "";

    settings.updatedBy =
      req.admin._id;

    await settings.save();

    if (publicId) {
      try {
        await deleteCloudinaryImage(
          publicId
        );
      } catch (error) {
        console.error(
          "Logo deletion from Cloudinary failed:",
          error
        );
      }
    }

    res.status(200).json({
      success: true,

      message:
        "Business logo removed successfully.",

      logoUrl: "",
      logoPublicId: "",
    });
  } catch (error) {
    next(error);
  }
}