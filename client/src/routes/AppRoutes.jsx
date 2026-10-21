import { lazy, Suspense } from "react";
import StatusMessage from "../components/ui/StatusMessage";
import { Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";

const Home = lazy(() => import("../pages/Home"));
const Shop = lazy(() => import("../pages/Shop"));
const ProductDetails = lazy(() => import("../pages/ProductDetails"));
const Services = lazy(() => import("../pages/Services"));
const BookService = lazy(() => import("../pages/BookService"));
const About = lazy(() => import("../pages/About"));
const Contact = lazy(() => import("../pages/Contact"));
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../pages/Checkout"));
const NotFound = lazy(() => import("../pages/NotFound"));

const AdminStaff = lazy(() => import("../pages/admin/AdminStaff"));
const AdminNotifications = lazy(
  () => import("../pages/admin/AdminNotifications"),
);
const AdminLogin = lazy(() => import("../pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("../pages/admin/AdminOrders"));
const AdminOrderDetails = lazy(
  () => import("../pages/admin/AdminOrderDetails"),
);
const AdminBookings = lazy(() => import("../pages/admin/AdminBookings"));
const AdminBookingDetails = lazy(
  () => import("../pages/admin/AdminBookingDetails"),
);
const AdminProducts = lazy(() => import("../pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("../pages/admin/AdminProductForm"));
const AdminInventory = lazy(() => import("../pages/admin/AdminInventory"));
const AdminCustomers = lazy(() => import("../pages/admin/AdminCustomers"));
const AdminCustomerDetails = lazy(
  () => import("../pages/admin/AdminCustomerDetails"),
);
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<StatusMessage title="Loading page..." />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/shop" element={<Shop />} />

          <Route path="/shop/:productId" element={<ProductDetails />} />

          <Route path="/services" element={<Services />} />

          <Route path="/book-service" element={<BookService />} />

          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />

          <Route path="/cart" element={<Cart />} />

          <Route path="*" element={<NotFound />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="staff/new" element={<AdminStaff creating />} />
            <Route path="staff/:staffId" element={<AdminStaff />} />
            <Route path="notifications" element={<AdminNotifications />} />

            <Route path="orders" element={<AdminOrders />} />

            <Route path="orders/:orderId" element={<AdminOrderDetails />} />

            <Route path="bookings" element={<AdminBookings />} />

            <Route
              path="bookings/:bookingId"
              element={<AdminBookingDetails />}
            />

            <Route path="products" element={<AdminProducts />} />

            <Route path="products/new" element={<AdminProductForm />} />

            <Route
              path="products/:productId/edit"
              element={<AdminProductForm />}
            />

            <Route path="inventory" element={<AdminInventory />} />

            <Route path="customers" element={<AdminCustomers />} />

            <Route
              path="customers/:customerKey"
              element={<AdminCustomerDetails />}
            />

            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
