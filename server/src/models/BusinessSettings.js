import mongoose from "mongoose";

const openingHoursSchema =
  new mongoose.Schema(
    {
      monday: {
        type: String,
        default:
          "8:00 AM - 5:00 PM",
      },

      tuesday: {
        type: String,
        default:
          "8:00 AM - 5:00 PM",
      },

      wednesday: {
        type: String,
        default:
          "8:00 AM - 5:00 PM",
      },

      thursday: {
        type: String,
        default:
          "8:00 AM - 5:00 PM",
      },

      friday: {
        type: String,
        default:
          "8:00 AM - 5:00 PM",
      },

      saturday: {
        type: String,
        default:
          "9:00 AM - 3:00 PM",
      },

      sunday: {
        type: String,
        default: "Closed",
      },
    },
    {
      _id: false,
    }
  );

const socialLinksSchema =
  new mongoose.Schema(
    {
      facebook: {
        type: String,
        default: "",
        trim: true,
      },

      instagram: {
        type: String,
        default: "",
        trim: true,
      },

      tiktok: {
        type: String,
        default: "",
        trim: true,
      },

      x: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

const businessSettingsSchema =
  new mongoose.Schema(
    {
      key: {
        type: String,
        default: "main",
        unique: true,
        immutable: true,
      },

      businessName: {
        type: String,
        default: "R&J AC",
        trim: true,
      },

      legalName: {
        type: String,
        default:
          "R&J AC ACCESSARIES COM. LTD",
        trim: true,
      },

      slogan: {
        type: String,
        default:
          "Cooling Solutions You Can Rely On.",
        trim: true,
      },

      primaryPhone: {
        type: String,
        default: "",
        trim: true,
      },

      secondaryPhone: {
        type: String,
        default: "",
        trim: true,
      },

      whatsapp: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      address: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
        trim: true,
      },

      region: {
        type: String,
        default: "",
        trim: true,
      },

      country: {
        type: String,
        default: "Ghana",
        trim: true,
      },

      mapUrl: {
        type: String,
        default: "",
        trim: true,
      },

      openingHours: {
        type: openingHoursSchema,
        default: () => ({}),
      },

      socialLinks: {
        type: socialLinksSchema,
        default: () => ({}),
      },

      deliveryNote: {
        type: String,
        default:
          "Delivery arrangements and charges are confirmed before dispatch.",
        trim: true,
      },

      serviceCoverage: {
        type: String,
        default:
          "Residential and commercial air-conditioning services.",
        trim: true,
      },

      bookingNote: {
        type: String,
        default:
          "Service requests are reviewed before confirmation.",
        trim: true,
      },

      logoUrl: {
        type: String,
        default: "",
        trim: true,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

const BusinessSettings =
  mongoose.model(
    "BusinessSettings",
    businessSettingsSchema
  );

export default BusinessSettings;