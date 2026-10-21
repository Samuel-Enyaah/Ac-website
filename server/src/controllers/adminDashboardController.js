import ActivityLog from "../models/ActivityLog.js";
import NotificationJob from "../models/NotificationJob.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ServiceBooking from "../models/ServiceBooking.js";

export async function getAdminDashboard(req, res, next) {
  try {
    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      totalBookings,
      pendingBookings,
      lowStockProducts,
      paidRevenueResult,
      recentOrders,
      recentBookings,
      lowStockItems,
    ] = await Promise.all([
      Product.countDocuments({
        active: true,
      }),

      Order.countDocuments(),

      Order.countDocuments({
        status: "pending",
      }),

      ServiceBooking.countDocuments(),

      ServiceBooking.countDocuments({
        status: "pending",
      }),

      Product.countDocuments({
        active: true,
        stock: {
          $lte: 5,
        },
      }),

      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: {
              $ne: "cancelled",
            },
          },
        },

        {
          $group: {
            _id: null,
            total: {
              $sum: "$total",
            },
          },
        },
      ]),

      Order.find()
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .select(
          [
            "orderNumber",
            "customer",
            "total",
            "status",
            "paymentStatus",
            "createdAt",
          ].join(" "),
        )
        .lean(),

      ServiceBooking.find()
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .select(
          [
            "bookingNumber",
            "customer",
            "serviceType",
            "status",
            "preferredDate",
            "location",
            "createdAt",
          ].join(" "),
        )
        .lean(),

      Product.find({
        active: true,
        stock: {
          $lte: 5,
        },
      })
        .sort({
          stock: 1,
        })
        .limit(5)
        .select("name slug category stock")
        .lean(),
    ]);

    const [
      actionOrders,
      unassignedBookings,
      inProgressBookings,
      failedNotifications,
      recentActivity,
      notificationFailures,
    ] = await Promise.all([
      Order.countDocuments({
        status: {
          $in: ["confirmed", "processing", "ready", "out-for-delivery"],
        },
      }),
      ServiceBooking.countDocuments({
        assignedStaff: null,
        status: { $nin: ["completed", "cancelled"] },
      }),
      ServiceBooking.countDocuments({ status: "in-progress" }),
      NotificationJob.countDocuments({ status: "failed" }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      NotificationJob.find({ status: "failed" })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("-payload")
        .lean(),
    ]);
    const paidRevenue = paidRevenueResult[0]?.total || 0;

    res.status(200).json({
      success: true,

      dashboard: {
        recentActivity,
        notificationFailures,
        stats: {
          actionOrders,
          unassignedBookings,
          inProgressBookings,
          failedNotifications,
          totalProducts,
          totalOrders,
          pendingOrders,
          totalBookings,
          pendingBookings,
          lowStockProducts,
          paidRevenue,
        },

        recentOrders: recentOrders.map((order) => ({
          id: order._id,

          orderNumber: order.orderNumber,

          customerName: order.customer?.fullName || "Customer",

          phone: order.customer?.phone || "",

          total: order.total,

          status: order.status,

          paymentStatus: order.paymentStatus,

          createdAt: order.createdAt,
        })),

        recentBookings: recentBookings.map((booking) => ({
          id: booking._id,

          bookingNumber: booking.bookingNumber,

          customerName: booking.customer?.name || "Customer",

          phone: booking.customer?.phone || "",

          serviceType: booking.serviceType,

          status: booking.status,

          preferredDate: booking.preferredDate,

          location: booking.location,

          createdAt: booking.createdAt,
        })),

        lowStockItems: lowStockItems.map((product) => ({
          id: product._id,

          name: product.name,

          slug: product.slug,

          category: product.category,

          stock: product.stock,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
