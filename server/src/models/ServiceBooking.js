import mongoose from "mongoose";

const serviceBookingSchema =
  new mongoose.Schema(
    {
      bookingNumber: {
        type: String,
        required: true,
        unique: true,
      },

      customer: {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        phone: {
          type: String,
          required: true,
          trim: true,
        },

        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
      },

      serviceType: {
        type: String,
        required: true,
        enum: [
          "installation",
          "repairs",
          "maintenance",
          "diagnosis",
          "spare-parts",
          "commercial",
        ],
      },

      acType: {
        type: String,
        default: "",
      },

      brand: {
        type: String,
        default: "",
      },

      units: {
        type: Number,
        default: 1,
        min: 1,
      },

      description: {
        type: String,
        required: true,
      },

      preferredDate: {
        type: Date,
        required: true,
      },

      preferredTime: {
        type: String,
        enum: [
          "",
          "morning",
          "afternoon",
          "evening",
        ],
        default: "",
      },

      location: {
        type: String,
        required: true,
      },

      landmark: {
        type: String,
        default: "",
      },

      images: [
        {
          url: String,
          publicId: String,
        },
      ],

      notes: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "pending",
          "confirmed",
          "technician-assigned",
          "in-progress",
          "completed",
          "cancelled",
        ],
        default: "pending",
      },
    },
    {
      timestamps: true,
    }
  );

const ServiceBooking =
  mongoose.model(
    "ServiceBooking",
    serviceBookingSchema
  );

export default ServiceBooking;