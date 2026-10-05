import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customer: {
      fullName: {
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
        default: "",
      },
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    fulfillmentMethod: {
      type: String,
      enum: [
        "delivery",
        "pickup",
      ],
      required: true,
    },

    deliveryAddress: {
      address: {
        type: String,
        default: "",
      },

      town: {
        type: String,
        default: "",
      },

      landmark: {
        type: String,
        default: "",
      },
    },

    installationRequired: {
      type: Boolean,
      default: false,
    },

    installationAddress: {
      type: String,
      default: "",
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    installationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "pay-on-delivery",
        "mobile-money",
        "card",
      ],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "ready",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    /*
     * true means this order has already
     * deducted stock from inventory.
     *
     * Existing orders created before this
     * feature will default to false.
     */
    stockDeducted: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model(
  "Order",
  orderSchema
);

export default Order;