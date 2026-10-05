import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  CartProvider,
} from "./context/CartContext";

import {
  AdminAuthProvider,
} from "./context/AdminAuthContext";

import {
  BusinessSettingsProvider,
} from "./context/BusinessSettingsContext";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById(
    "root"
  )
).render(
  <React.StrictMode>

    <BrowserRouter>

      <BusinessSettingsProvider>

        <CartProvider>

          <AdminAuthProvider>

            <App />

          </AdminAuthProvider>

        </CartProvider>

      </BusinessSettingsProvider>

    </BrowserRouter>

  </React.StrictMode>
);