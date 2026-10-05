import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import healthRoutes from "./routes/healthRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import serviceBookingRoutes from "./routes/serviceBookingRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import adminServiceBookingRoutes from "./routes/adminServiceBookingRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";
import adminCustomerRoutes from "./routes/adminCustomerRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";
import publicSettingsRoutes from "./routes/publicSettingsRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "R&J AC ACCESSARIES COM. LTD API",
  });
});

app.use(
  "/api/v1/health",
  healthRoutes
);

app.use(
  "/api/v1/products",
  productRoutes
);

app.use(
  "/api/v1/orders",
  orderRoutes
);


app.use(
  "/api/v1/service-bookings",
  serviceBookingRoutes
);

app.use(
  "/api/v1/admin/auth",
  adminAuthRoutes
);

app.use(
  "/api/v1/admin/dashboard",
  adminDashboardRoutes
);
    
app.use(
  "/api/v1/admin/orders",
  adminOrderRoutes
);

app.use(
  "/api/v1/admin/bookings",
  adminServiceBookingRoutes
);

app.use(
  "/api/v1/admin/products",
  adminProductRoutes
);
app.use(
  "/api/v1/admin/customers",
  adminCustomerRoutes
);

app.use(
  "/api/v1/admin/settings",
  adminSettingsRoutes
);

app.use(
  "/api/v1/settings",
  publicSettingsRoutes
);

app.use(notFound);
app.use(errorHandler);

export default app;