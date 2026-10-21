import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CartContext } from "./CartState";
import { getProducts } from "../services/productService";
function cleanProduct(p) {
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    category: p.category || "",
    brand: p.brand || "",
    price: Number(p.price),
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    images: Array.isArray(p.images)
      ? p.images
          .filter((i) => i && /^https?:\/\//.test(i.url))
          .map((i) => ({ url: i.url }))
      : [],
    unavailable: p.active === false,
  };
}
function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("rj-ac-cart"));
    if (!Array.isArray(saved)) return [];
    const seen = new Set();
    return saved
      .filter(
        (p) =>
          p &&
          typeof p._id === "string" &&
          /^[a-f0-9]{24}$/i.test(p._id) &&
          typeof p.slug === "string" &&
          typeof p.name === "string" &&
          Number.isFinite(Number(p.price)) &&
          Number(p.price) >= 0 &&
          Number.isSafeInteger(p.quantity) &&
          p.quantity > 0 &&
          !seen.has(p._id) &&
          seen.add(p._id),
      )
      .map((p) => ({ ...cleanProduct(p), quantity: p.quantity }));
  } catch {
    return [];
  }
}
function reconcile(items, products) {
  const byId = new Map(products.map((p) => [p._id, p]));
  return items.map((item) => {
    const current = byId.get(item._id);
    return current
      ? { ...cleanProduct(current), quantity: item.quantity }
      : { ...item, unavailable: true, stock: 0 };
  });
}
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readCart);
  const ref = useRef(cartItems);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    ref.current = cartItems;
    try {
      localStorage.setItem("rj-ac-cart", JSON.stringify(cartItems));
    } catch {
      /* Cart still works without storage. */
    }
  }, [cartItems]);
  const refreshCart = useCallback(async () => {
    setChecking(true);
    setCheckError("");
    try {
      const products = await getProducts();
      const fresh = reconcile(ref.current, products);
      setCartItems((current) => reconcile(current, products));
      setChecked(true);
      return fresh;
    } catch {
      setCheckError(
        "We could not check current availability. Please try again before checkout.",
      );
      return null;
    } finally {
      setChecking(false);
    }
  }, []);
  const addToCart = useCallback((product, quantity = 1) => {
    const clean = cleanProduct(product);
    if (
      clean.stock < 1 ||
      clean.unavailable ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    )
      return;
    setCartItems((current) => {
      const existing = current.find((p) => p._id === clean._id);
      return existing
        ? current.map((p) =>
            p._id === clean._id
              ? {
                  ...clean,
                  quantity: Math.min(clean.stock, p.quantity + quantity),
                }
              : p,
          )
        : [...current, { ...clean, quantity: Math.min(clean.stock, quantity) }];
    });
  }, []);
  const removeFromCart = useCallback(
    (id) => setCartItems((items) => items.filter((p) => p._id !== id)),
    [],
  );
  const updateQuantity = useCallback((id, quantity) => {
    if (!Number.isSafeInteger(quantity)) return;
    setCartItems((items) =>
      items.map((p) =>
        p._id === id
          ? { ...p, quantity: Math.max(1, Math.min(quantity, p.stock)) }
          : p,
      ),
    );
  }, []);
  const clearCart = useCallback(() => setCartItems([]), []);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, p) => sum + p.quantity, 0),
    [cartItems],
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [cartItems],
  );
  const invalid = cartItems.some(
    (p) => p.unavailable || p.quantity > p.stock || p.stock < 1,
  );
  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        checking,
        checkError,
        checked,
        invalid,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
