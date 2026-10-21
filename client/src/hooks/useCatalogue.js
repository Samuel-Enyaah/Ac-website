import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
export default function useCatalogue() {
  const [state, setState] = useState({
    products: [],
    loading: true,
    error: "",
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getProducts()
      .then((products) => {
        if (active) setState({ products, loading: false, error: "" });
      })
      .catch(() => {
        if (active)
          setState({
            products: [],
            loading: false,
            error: "We could not load the catalogue. Please try again.",
          });
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return {
    ...state,
    retry: () => {
      setState((s) => ({ ...s, loading: true, error: "" }));
      setAttempt((n) => n + 1);
    },
  };
}
