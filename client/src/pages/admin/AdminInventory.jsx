import {
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  adjustAdminInventory,
  getAdminProducts,
} from "../../services/adminProductService";

export default function AdminInventory() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedId,
    setSelectedId,
  ] = useState(null);

  const [
    operation,
    setOperation,
  ] = useState(
    "increase"
  );

  const [
    quantity,
    setQuantity,
  ] = useState("1");

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const loadProducts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAdminProducts({
            limit: 100,
          });

        setProducts(
          result.products || []
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to load inventory."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadProducts();
  }, []);

  const adjustStock =
    async (
      productId
    ) => {
      try {
        setSaving(true);
        setError("");

        const updated =
          await adjustAdminInventory(
            productId,
            {
              operation,

              quantity:
                Number(
                  quantity
                ),

              reason:
                reason.trim(),
            }
          );

        setProducts(
          (current) =>
            current.map(
              (product) =>
                product._id ===
                updated._id
                  ? updated
                  : product
            )
        );

        setSelectedId(null);
        setQuantity("1");
        setReason("");
        setOperation(
          "increase"
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to update stock."
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="space-y-7">

      <section className="flex items-end justify-between gap-5">

        <div>

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
            Inventory
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
            Stock Management
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Monitor and adjust
            product quantities.
          </p>

        </div>

        <button
          type="button"
          onClick={
            loadProducts
          }
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold"
        >
          <RefreshCw
            size={17}
          />

          Refresh
        </button>

      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          Loading inventory...
        </div>
      ) : (
        <section className="space-y-4">

          {products.map(
            (product) => (
              <div
                key={
                  product._id
                }
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                  <div className="flex items-center gap-4">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        product.stock ===
                        0
                          ? "bg-red-50 text-red-500"
                          : product.stock <=
                              5
                            ? "bg-orange-50 text-orange-500"
                            : "bg-[#EAF6FF] text-[#1687D9]"
                      }`}
                    >
                      {product.stock <=
                      5 ? (
                        <AlertTriangle
                          size={21}
                        />
                      ) : (
                        <Boxes
                          size={21}
                        />
                      )}
                    </div>

                    <div>

                      <p className="font-bold text-[#0B1F33]">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {
                          product.category
                        }
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-4">

                    <div className="text-right">

                      <p className="text-xs text-gray-400">
                        Current Stock
                      </p>

                      <p className="text-2xl font-black text-[#0B1F33]">
                        {
                          product.stock
                        }
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedId(
                          selectedId ===
                            product._id
                            ? null
                            : product._id
                        )
                      }
                      className="rounded-xl bg-[#1687D9] px-4 py-3 text-sm font-bold text-white"
                    >
                      Adjust
                    </button>

                  </div>

                </div>

                {selectedId ===
                  product._id && (
                  <div className="mt-5 border-t border-gray-100 pt-5">

                    <div className="grid gap-4 lg:grid-cols-[180px_150px_1fr_auto]">

                      <select
                        value={
                          operation
                        }
                        onChange={(
                          event
                        ) =>
                          setOperation(
                            event
                              .target
                              .value
                          )
                        }
                        className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      >
                        <option value="increase">
                          Add Stock
                        </option>

                        <option value="decrease">
                          Remove Stock
                        </option>

                        <option value="set">
                          Set Exact Stock
                        </option>
                      </select>

                      <input
                        type="number"
                        min="0"
                        value={
                          quantity
                        }
                        onChange={(
                          event
                        ) =>
                          setQuantity(
                            event
                              .target
                              .value
                          )
                        }
                        className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        placeholder="Quantity"
                      />

                      <input
                        value={
                          reason
                        }
                        onChange={(
                          event
                        ) =>
                          setReason(
                            event
                              .target
                              .value
                          )
                        }
                        className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        placeholder="Reason, e.g. new delivery"
                      />

                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          adjustStock(
                            product._id
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {operation ===
                        "decrease" ? (
                          <Minus
                            size={
                              16
                            }
                          />
                        ) : (
                          <Plus
                            size={
                              16
                            }
                          />
                        )}

                        {saving
                          ? "Saving..."
                          : "Update"}
                      </button>

                    </div>

                  </div>
                )}

              </div>
            )
          )}

        </section>
      )}

    </div>
  );
}