import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Air Conditioners",
        "Spare Parts",
        "Accessories",
      ],
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    oldPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    stock: {
      type: Number,
      validate: { validator: Number.isInteger, message: "Stock must be a whole number." },
      default: 0,
      min: 0,
    },

    // Internal idempotency ledger; excluded from public and admin catalogue responses.
    reservedAttemptIds: { type: [String], default: [], select: false },
    releasedReservationIds: { type: [String], default: [], select: false },
    restoredOrderIds: { type: [mongoose.Schema.Types.ObjectId], default: [], select: false },

    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    specifications: [
      {
        type: String,
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

productSchema.index({
  name: "text",
  brand: "text",
  description: "text",
});

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;
