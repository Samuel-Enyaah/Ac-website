import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

function cleanProduct(product) {
  return {
    _id: product._id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    oldPrice:
      product.oldPrice != null
        ? Number(product.oldPrice)
        : null,
    stock: Number(product.stock || 0),
    shortDescription:
      product.shortDescription || "",
    images: Array.isArray(product.images)
      ? product.images
      : [],
  };
}

export function CartProvider({
  children,
}) {
  const [cartItems, setCartItems] =
    useState(() => {
      try {
        const savedCart =
          localStorage.getItem(
            "rj-ac-cart"
          );

        return savedCart
          ? JSON.parse(savedCart)
          : [];
      } catch {
        return [];
      }
    });

  useEffect(() => {
    localStorage.setItem(
      "rj-ac-cart",
      JSON.stringify(cartItems)
    );
  }, [cartItems]);

  const addToCart = (
    product,
    quantity = 1
  ) => {
    const clean = cleanProduct(product);

    setCartItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            item._id === clean._id
        );

      if (existingItem) {
        return currentItems.map(
          (item) =>
            item._id === clean._id
              ? {
                  ...item,
                  quantity: Math.min(
                    item.stock,
                    item.quantity +
                      quantity
                  ),
                }
              : item
        );
      }

      return [
        ...currentItems,
        {
          ...clean,
          quantity: Math.min(
            quantity,
            clean.stock
          ),
        },
      ];
    });
  };

  const removeFromCart = (
    productId
  ) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item._id !== productId
      )
    );
  };

  const updateQuantity = (
    productId,
    quantity
  ) => {
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (
          item._id !== productId
        ) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(
            1,
            Math.min(
              quantity,
              item.stock
            )
          ),
        };
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          Number(item.price) *
            item.quantity,
        0
      ),
    [cartItems]
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}