import mongoose from "mongoose";
import { z } from "zod";

import ServiceBooking from "../models/ServiceBooking.js";

const bookingStatuses = [
  "pending",
  "confirmed",
  "technician-assigned",
  "in-progress",
  "completed",
  "cancelled",
];

const serviceTypes = [
  "installation",
  "repairs",
  "maintenance",
  "diagnosis",
  "spare-parts",
  "commercial",
];

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getAdminServiceBookings(
  req,
  res,
  next
) {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 10,
        1
      ),
      50
    );

    const search = String(
      req.query.search || ""
    ).trim();

    const status = String(
      req.query.status || ""
    ).trim();

    const serviceType = String(
      req.query.serviceType || ""
    ).trim();

    const query = {};

    if (
      status &&
      status !== "all" &&
      bookingStatuses.includes(status)
    ) {
      query.status = status;
    }

    if (
      serviceType &&
      serviceType !== "all" &&
      serviceTypes.includes(serviceType)
    ) {
      query.serviceType = serviceType;
    }

    if (search) {
      const regex = new RegExp(
        escapeRegex(search),
        "i"
      );

      query.$or = [
        {
          bookingNumber: regex,
        },
        {
          "customer.name": regex,
        },
        {
          "customer.phone": regex,
        },
        {
          "customer.email": regex,
        },
        {
          location: regex,
        },
        {
          brand: regex,
        },
      ];
    }

    const [
      bookings,
      total,
    ] = await Promise.all([
      ServiceBooking.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(
          (page - 1) * limit
        )
        .limit(limit)
        .lean(),

      ServiceBooking.countDocuments(
        query
      ),
    ]);

    const pages = Math.max(
      Math.ceil(total / limit),
      1
    );

    res.status(200).json({
      success: true,

      bookings,

      pagination: {
        page,
        limit,
        total,
        pages,

        hasNextPage:
          page < pages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminServiceBookingById(
  req,
  res,
  next
) {
  try {
    const {
      bookingId,
    } = req.params;

    if (
      !mongoose.isValidObjectId(
        bookingId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid service booking ID.",
      });
    }

    const booking =
      await ServiceBooking.findById(
        bookingId
      ).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Service booking not found.",
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
}

const updateBookingSchema =
  z
    .object({
      status: z
        .enum([
          "pending",
          "confirmed",
          "technician-assigned",
          "in-progress",
          "completed",
          "cancelled",
        ])
        .optional(),
    })
    .refine(
      (data) =>
        data.status !== undefined,
      {
        message:
          "Nothing was provided to update.",
      }
    );

export async function updateAdminServiceBooking(
  req,
  res,
  next
) {
  try {
    const {
      bookingId,
    } = req.params;

    if (
      !mongoose.isValidObjectId(
        bookingId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid service booking ID.",
      });
    }

    const parsed =
      updateBookingSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking update.",
      });
    }

    const booking =
      await ServiceBooking.findById(
        bookingId
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Service booking not found.",
      });
    }

    booking.status =
      parsed.data.status;

    await booking.save();

    res.status(200).json({
      success: true,

      message:
        "Service booking updated successfully.",

      booking,
    });
  } catch (error) {
    next(error);
  }
}