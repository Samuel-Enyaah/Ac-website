import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";

import {
  CartProvider,
} from "./context/CartContext";

import {
  AdminAuthProvider,
} from "./context/AdminAuthContext";

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);