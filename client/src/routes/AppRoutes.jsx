import {
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";

import Home from "../pages/Home";
import Shop from "../pages/Shop";
import ProductDetails from "../pages/ProductDetails";
import Services from "../pages/Services";
import BookService from "../pages/BookService";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import NotFound from "../pages/NotFound";

import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminComingSoon from "../pages/admin/AdminComingSoon";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminOrderDetails from "../pages/admin/AdminOrderDetails";

export default function AppRoutes() {
  return (
    <Routes>

      <Route
        element={
          <MainLayout />
        }
      >

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/shop"
          element={<Shop />}
        />

        <Route
          path="/shop/:productId"
          element={
            <ProductDetails />
          }
        />

        <Route
          path="/services"
          element={
            <Services />
          }
        />

        <Route
          path="/book-service"
          element={
            <BookService />
          }
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={
            <Checkout />
          }
        />

      </Route>

      <Route
        path="/admin/login"
        element={
          <AdminLogin />
        }
      />

      <Route
        element={
          <ProtectedAdminRoute />
        }
      >

        <Route
          path="/admin"
          element={
            <AdminLayout />
          }
        >

          <Route
            index
            element={
              <AdminDashboard />
            }
          />

                    <Route
              path="orders"
              element={
                <AdminOrders />
              }
            />

            <Route
              path="orders/:orderId"
              element={
                <AdminOrderDetails />
              }
            />

          <Route
            path="bookings"
            element={
              <AdminComingSoon title="Service Bookings" />
            }
          />

          <Route
            path="products"
            element={
              <AdminComingSoon title="Products" />
            }
          />

          <Route
            path="inventory"
            element={
              <AdminComingSoon title="Inventory" />
            }
          />

          <Route
            path="customers"
            element={
              <AdminComingSoon title="Customers" />
            }
          />

          <Route
            path="settings"
            element={
              <AdminComingSoon title="Settings" />
            }
          />

        </Route>

      </Route>

      <Route
        path="*"
        element={
          <NotFound />
        }
      />

    </Routes>
  );
}