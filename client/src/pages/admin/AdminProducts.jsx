import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Edit3,
  Package,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  getAdminProducts,
} from "../../services/adminProductService";

export default function AdminProducts() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("all");

  const [
    active,
    setActive,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadProducts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAdminProducts({
            search,
            category,
            active,
            limit: 50,
          });

        setProducts(
          result.products || []
        );

        setPagination(
          result.pagination
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadProducts();
  }, [
    search,
    category,
    active,
  ]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      setSearch(
        searchInput.trim()
      );
    };

  return (
    <div className="space-y-7">

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
            Products
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
            Product Management
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage products sold
            through the R&J AC shop.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={
              loadProducts
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B1F33]"
          >
            <RefreshCw
              size={17}
            />

            Refresh
          </button>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1687D9] px-5 py-3 text-sm font-bold text-white"
          >
            <Plus size={18} />

            Add Product
          </Link>

        </div>

      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

        <form
          onSubmit={
            handleSearch
          }
          className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto]"
        >

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={
                searchInput
              }
              onChange={(
                event
              ) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search product or brand..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#1687D9]"
            />

          </div>

          <select
            value={category}
            onChange={(
              event
            ) =>
              setCategory(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
          >
            <option value="all">
              All Categories
            </option>

            <option value="Air Conditioners">
              Air Conditioners
            </option>

            <option value="Spare Parts">
              Spare Parts
            </option>

            <option value="Accessories">
              Accessories
            </option>
          </select>

          <select
            value={active}
            onChange={(
              event
            ) =>
              setActive(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
          >
            <option value="all">
              All Products
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-[#0B1F33] px-6 py-3 text-sm font-bold text-white"
          >
            Search
          </button>

        </form>

      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-6 py-5">

          <h2 className="font-bold text-[#0B1F33]">
            Products
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {pagination.total}{" "}
            product
            {pagination.total === 1
              ? ""
              : "s"}
          </p>

        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading products...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            {error}
          </div>
        ) : products.length ===
          0 ? (
          <div className="p-16 text-center">

            <Package
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 font-bold text-[#0B1F33]">
              No products found
            </h3>

          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">

              <table className="min-w-full">

                <thead className="bg-[#F8FAFC]">

                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-400">

                    <th className="px-6 py-4">
                      Product
                    </th>

                    <th className="px-6 py-4">
                      Category
                    </th>

                    <th className="px-6 py-4">
                      Price
                    </th>

                    <th className="px-6 py-4">
                      Stock
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Featured
                    </th>

                    <th className="px-6 py-4" />

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {products.map(
                    (product) => (
                      <ProductRow
                        key={
                          product._id
                        }
                        product={
                          product
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="divide-y divide-gray-100 lg:hidden">

              {products.map(
                (product) => (
                  <ProductMobile
                    key={
                      product._id
                    }
                    product={
                      product
                    }
                  />
                )
              )}

            </div>
          </>
        )}

      </section>

    </div>
  );
}

function ProductRow({
  product,
}) {
  return (
    <tr className="text-sm">

      <td className="px-6 py-5">

        <div className="flex items-center gap-4">

          <ProductImage
            product={product}
          />

          <div>

            <p className="font-bold text-[#0B1F33]">
              {product.name}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {product.brand ||
                product.slug}
            </p>

          </div>

        </div>

      </td>

      <td className="px-6 py-5 text-gray-600">
        {product.category}
      </td>

      <td className="px-6 py-5 font-bold text-[#0B1F33]">
        GH₵{" "}
        {Number(
          product.price
        ).toLocaleString()}
      </td>

      <td className="px-6 py-5">
        <StockBadge
          stock={
            product.stock
          }
        />
      </td>

      <td className="px-6 py-5">

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            product.active
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {product.active
            ? "Active"
            : "Inactive"}
        </span>

      </td>

      <td className="px-6 py-5">

        {product.featured
          ? "Yes"
          : "No"}

      </td>

      <td className="px-6 py-5">

        <Link
          to={`/admin/products/${product._id}/edit`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-[#1687D9] hover:text-[#1687D9]"
        >
          <Edit3
            size={16}
          />
        </Link>

      </td>

    </tr>
  );
}

function ProductMobile({
  product,
}) {
  return (
    <div className="p-5">

      <div className="flex gap-4">

        <ProductImage
          product={product}
        />

        <div className="min-w-0 flex-1">

          <p className="font-bold text-[#0B1F33]">
            {product.name}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {product.category}
          </p>

          <p className="mt-2 font-bold text-[#0B1F33]">
            GH₵{" "}
            {Number(
              product.price
            ).toLocaleString()}
          </p>

        </div>

        <Link
          to={`/admin/products/${product._id}/edit`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]"
        >
          <Edit3 size={17} />
        </Link>

      </div>

      <div className="mt-4">
        <StockBadge
          stock={
            product.stock
          }
        />
      </div>

    </div>
  );
}

function ProductImage({
  product,
}) {
  const image =
    product.images?.find(
      (item) => item?.url
    );

  if (image?.url) {
    return (
      <img
        src={image.url}
        alt={product.name}
        className="h-12 w-12 rounded-xl bg-[#EAF6FF] object-contain p-1"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
      <Package
        size={21}
      />
    </div>
  );
}

function StockBadge({
  stock,
}) {
  let classes =
    "bg-green-50 text-green-700";

  if (stock === 0) {
    classes =
      "bg-red-50 text-red-700";
  } else if (stock <= 5) {
    classes =
      "bg-orange-50 text-orange-700";
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {stock} in stock
    </span>
  );
}