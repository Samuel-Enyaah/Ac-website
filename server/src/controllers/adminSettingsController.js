import { operationEvent } from "../services/operationEvents.js";
import { flushOperations } from "../services/operationsOutbox.js";
import { z } from "zod";

import BusinessSettings from "../models/BusinessSettings.js";

const optionalUrl = z.union([z.string().trim().url(), z.literal("")]);

const settingsSchema = z.object({
  businessName: z.string().trim().min(2),

  legalName: z.string().trim().min(2),

  slogan: z.string().trim().max(200),

  primaryPhone: z.string().trim().max(40),

  secondaryPhone: z.string().trim().max(40),

  whatsapp: z.string().trim().max(40),

  email: z.union([z.string().trim().email(), z.literal("")]),

  address: z.string().trim().max(300),

  city: z.string().trim().max(100),

  region: z.string().trim().max(100),

  country: z.string().trim().max(100),

  mapUrl: optionalUrl,

  deliveryNote: z.string().trim().max(500),

  serviceCoverage: z.string().trim().max(500),

  bookingNote: z.string().trim().max(500),

  openingHours: z.object({
    monday: z.string().trim().max(100),

    tuesday: z.string().trim().max(100),

    wednesday: z.string().trim().max(100),

    thursday: z.string().trim().max(100),

    friday: z.string().trim().max(100),

    saturday: z.string().trim().max(100),

    sunday: z.string().trim().max(100),
  }),

  socialLinks: z.object({
    facebook: optionalUrl,

    instagram: optionalUrl,

    tiktok: optionalUrl,

    x: optionalUrl,
  }),
});

async function getOrCreateSettings() {
  let settings = await BusinessSettings.findOne({
    key: "main",
  });

  if (!settings) {
    settings = await BusinessSettings.create({
      key: "main",
    });
  }

  return settings;
}

export async function getAdminSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,

      settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminSettings(req, res, next) {
  try {
    const parsed = settingsSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,

        message: "Please check the business settings.",

        errors: parsed.error.flatten().fieldErrors,
      });
    }

    /*
     * Logo fields are deliberately
     * absent from parsed.data.
     *
     * That prevents a normal
     * Settings save from breaking
     * the relationship between:
     *
     * logoUrl
     * logoPublicId
     */
    const previous = await BusinessSettings.findOne({ key: "main" }).lean();
    const changedFields = Object.keys(parsed.data).filter(
      (key) =>
        JSON.stringify(previous?.[key]) !== JSON.stringify(parsed.data[key]),
    );
    const audit = operationEvent("updated", "Business settings updated.", {
      admin: req.admin,
      metadata: { fields: changedFields },
    });
    const settings = await BusinessSettings.findOneAndUpdate(
      {
        key: "main",
      },

      {
        ...(changedFields.length ? { $push: { eventOutbox: audit } } : {}),
        $set: {
          ...parsed.data,

          updatedBy: req.admin._id,
        },
      },

      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    await flushOperations("settings", settings._id);
    res.status(200).json({
      success: true,

      message: "Business settings updated successfully.",

      settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,

      settings: {
        businessName: settings.businessName,

        legalName: settings.legalName,

        slogan: settings.slogan,

        primaryPhone: settings.primaryPhone,

        secondaryPhone: settings.secondaryPhone,

        whatsapp: settings.whatsapp,

        email: settings.email,

        address: settings.address,

        city: settings.city,

        region: settings.region,

        country: settings.country,

        mapUrl: settings.mapUrl,

        /*
         * Public frontend only
         * receives the usable URL.
         */
        logoUrl: settings.logoUrl,

        openingHours: settings.openingHours,

        socialLinks: settings.socialLinks,

        deliveryNote: settings.deliveryNote,

        serviceCoverage: settings.serviceCoverage,

        bookingNote: settings.bookingNote,
      },
    });
  } catch (error) {
    next(error);
  }
}
