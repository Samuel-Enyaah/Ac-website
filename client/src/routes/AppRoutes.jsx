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
import AdminOrders from "../pages/admin/AdminOrders";
import AdminOrderDetails from "../pages/admin/AdminOrderDetails";
import AdminBookings from "../pages/admin/AdminBookings";
import AdminBookingDetails from "../pages/admin/AdminBookingDetails";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductForm from "../pages/admin/AdminProductForm";
import AdminInventory from "../pages/admin/AdminInventory";
import AdminCustomers from "../pages/admin/AdminCustomers";
import AdminCustomerDetails from "../pages/admin/AdminCustomerDetails";
import AdminSettings from "../pages/admin/AdminSettings";

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
                  <AdminBookings />
                }
            />

            <Route
              path="bookings/:bookingId"
              element={
                <AdminBookingDetails />
              }
            />

         <Route
  path="products"
  element={
    <AdminProducts />
  }
/>

          <Route
            path="products/new"
            element={
              <AdminProductForm />
            }
          />

          <Route
            path="products/:productId/edit"
            element={
              <AdminProductForm />
            }
          />

          <Route
            path="inventory"
            element={
              <AdminInventory />
            }
          />

          <Route
            path="customers"
            element={
              <AdminCustomers />
            }
          />

          <Route
            path="customers/:customerKey"
            element={
              <AdminCustomerDetails />
            }
          />

          <Route
            path="settings"
            element={
              <AdminSettings />
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