import ActivityLog from "../models/ActivityLog.js";
import Order from "../models/Order.js";
import ServiceBooking from "../models/ServiceBooking.js";

function normalizePhone(phone = "") {
  let digits = String(phone).replace(/\D/g, "");

  // Ghana local number: 0530343250 -> 233530343250
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `233${digits.slice(1)}`;
  }

  // Handle formats such as 2330530343250
  if (digits.length === 13 && digits.startsWith("2330")) {
    digits = `233${digits.slice(4)}`;
  }

  return digits;
}

function newerDate(current, candidate) {
  if (!current) {
    return candidate;
  }

  return new Date(candidate) > new Date(current) ? candidate : current;
}

function getOrCreateCustomer(customers, phone, profile = {}) {
  const customerKey = normalizePhone(phone);

  if (!customerKey) {
    return null;
  }

  if (!customers.has(customerKey)) {
    customers.set(customerKey, {
      customerKey,

      name: profile.name || "Customer",

      phone: phone || "",

      email: profile.email || "",

      totalOrders: 0,
      purchases: 0,
      cancelledOrders: 0,
      deliveredOrders: 0,

      totalSpent: 0,

      serviceRequests: 0,
      completedServices: 0,
      cancelledServices: 0,

      lastActivity: null,
      lastProfileUpdate: null,
    });
  }

  return customers.get(customerKey);
}

async function buildCustomers() {
  const [orders, bookings] = await Promise.all([
    Order.find()
      .select(
        [
          "orderNumber",
          "customer",
          "total",
          "status",
          "paymentStatus",
          "fulfillmentMethod",
          "createdAt",
          "updatedAt",
          "lastActivity",
          "assignedStaffName",
        ].join(" "),
      )
      .lean(),

    ServiceBooking.find()
      .select(
        [
          "bookingNumber",
          "customer",
          "serviceType",
          "status",
          "preferredDate",
          "location",
          "createdAt",
          "updatedAt",
          "lastActivity",
          "assignedStaffName",
        ].join(" "),
      )
      .lean(),
  ]);

  const customers = new Map();

  for (const order of orders) {
    const phone = order.customer?.phone || "";

    const customer = getOrCreateCustomer(customers, phone, {
      name: order.customer?.fullName,

      email: order.customer?.email,
    });

    if (!customer) {
      continue;
    }

    /*
     * Use the most recently submitted
     * details as the displayed profile.
     */
    if (
      !customer.lastProfileUpdate ||
      new Date(order.createdAt) > new Date(customer.lastProfileUpdate)
    ) {
      customer.name = order.customer?.fullName || customer.name;

      customer.phone = order.customer?.phone || customer.phone;

      if (order.customer?.email) {
        customer.email = order.customer.email;
      }

      customer.lastProfileUpdate = order.createdAt;
    }

    customer.totalOrders += 1;

    if (order.status === "cancelled") {
      customer.cancelledOrders += 1;
    } else {
      customer.purchases += 1;
    }

    if (order.status === "delivered") {
      customer.deliveredOrders += 1;
    }

    /*
     * Money counted here represents
     * orders actually marked paid.
     */
    if (order.paymentStatus === "paid" && order.status !== "cancelled") {
      customer.totalSpent += Number(order.total || 0);
    }

    customer.lastActivity = newerDate(
      customer.lastActivity,
      order.lastActivity?.at || order.updatedAt || order.createdAt,
    );
  }

  for (const booking of bookings) {
    const phone = booking.customer?.phone || "";

    const customer = getOrCreateCustomer(customers, phone, {
      name: booking.customer?.name,

      email: booking.customer?.email,
    });

    if (!customer) {
      continue;
    }

    if (
      !customer.lastProfileUpdate ||
      new Date(booking.createdAt) > new Date(customer.lastProfileUpdate)
    ) {
      customer.name = booking.customer?.name || customer.name;

      customer.phone = booking.customer?.phone || customer.phone;

      if (booking.customer?.email) {
        customer.email = booking.customer.email;
      }

      customer.lastProfileUpdate = booking.createdAt;
    }

    customer.serviceRequests += 1;

    if (booking.status === "completed") {
      customer.completedServices += 1;
    }

    if (booking.status === "cancelled") {
      customer.cancelledServices += 1;
    }

    customer.lastActivity = newerDate(
      customer.lastActivity,
      booking.lastActivity?.at || booking.updatedAt || booking.createdAt,
    );
  }

  return Array.from(customers.values());
}

export async function getAdminCustomers(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      50,
    );

    const search = String(req.query.search || "")
      .trim()
      .toLowerCase();

    let customers = await buildCustomers();

    if (search) {
      const searchDigits = normalizePhone(search);

      customers = customers.filter((customer) => {
        const name = customer.name?.toLowerCase() || "";

        const email = customer.email?.toLowerCase() || "";

        const phone = customer.phone || "";

        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          (searchDigits && customer.customerKey.includes(searchDigits))
        );
      });
    }

    customers.sort(
      (a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0),
    );

    const total = customers.length;

    const pages = Math.max(Math.ceil(total / limit), 1);

    const start = (page - 1) * limit;

    const paginated = customers.slice(start, start + limit);

    res.status(200).json({
      success: true,

      customers: paginated,

      pagination: {
        page,
        limit,
        total,
        pages,

        hasNextPage: page < pages,

        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCustomerByKey(req, res, next) {
  try {
    const customerKey = normalizePhone(req.params.customerKey);

    if (!customerKey) {
      return res.status(400).json({
        success: false,

        message: "Invalid customer identifier.",
      });
    }

    const [allOrders, allBookings] = await Promise.all([
      Order.find()
        .sort({
          createdAt: -1,
        })
        .lean(),

      ServiceBooking.find()
        .sort({
          createdAt: -1,
        })
        .lean(),
    ]);

    const orders = allOrders.filter(
      (order) => normalizePhone(order.customer?.phone) === customerKey,
    );

    const bookings = allBookings.filter(
      (booking) => normalizePhone(booking.customer?.phone) === customerKey,
    );

    if (orders.length === 0 && bookings.length === 0) {
      return res.status(404).json({
        success: false,

        message: "Customer not found.",
      });
    }

    const allCustomers = await buildCustomers();

    const customer = allCustomers.find(
      (item) => item.customerKey === customerKey,
    );

    res.status(200).json({
      success: true,

      customer,
      activity: await ActivityLog.find({
        $or: [
          {
            entityType: "order",
            entityId: { $in: orders.map((item) => item._id) },
          },
          {
            entityType: "booking",
            entityId: { $in: bookings.map((item) => item._id) },
          },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      orders,

      bookings,
    });
  } catch (error) {
    next(error);
  }
}
