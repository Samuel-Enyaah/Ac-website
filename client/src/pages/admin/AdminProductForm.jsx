import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Package,
  Save,
} from "lucide-react";

import {
  createAdminProduct,
  getAdminProduct,
  updateAdminProduct,
} from "../../services/adminProductService";

const initialForm = {
  name: "",
  category:
    "Air Conditioners",
  brand: "",
  description: "",
  shortDescription: "",
  price: "",
  oldPrice: "",
  stock: "0",
  imageUrl: "",
  specifications: "",
  featured: false,
  active: true,
};

export default function AdminProductForm() {
  const {
    productId,
  } = useParams();

  const navigate =
    useNavigate();

  const editing =
    Boolean(productId);

  const [
    form,
    setForm,
  ] = useState(
    initialForm
  );

  const [
    loading,
    setLoading,
  ] = useState(
    editing
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!editing) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const product =
          await getAdminProduct(
            productId
          );

        if (!active) {
          return;
        }

        setForm({
          name:
            product.name ||
            "",

          category:
            product.category ||
            "Air Conditioners",

          brand:
            product.brand ||
            "",

          description:
            product.description ||
            "",

          shortDescription:
            product.shortDescription ||
            "",

          price: String(
            product.price ??
              ""
          ),

          oldPrice:
            product.oldPrice ==
            null
              ? ""
              : String(
                  product.oldPrice
                ),

          stock: String(
            product.stock ??
              0
          ),

          imageUrl:
            product.images?.[0]
              ?.url || "",

          specifications:
            (
              product.specifications ||
              []
            ).join("\n"),

          featured:
            Boolean(
              product.featured
            ),

          active:
            Boolean(
              product.active
            ),
        });
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to load product."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [
    editing,
    productId,
  ]);

  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );

      setError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");

        const payload = {
          name:
            form.name.trim(),

          category:
            form.category,

          brand:
            form.brand.trim(),

          description:
            form.description.trim(),

          shortDescription:
            form.shortDescription.trim(),

          price:
            Number(
              form.price
            ),

          oldPrice:
            form.oldPrice ===
            ""
              ? null
              : Number(
                  form.oldPrice
                ),

          imageUrl:
            form.imageUrl.trim(),

          specifications:
            form.specifications
              .split("\n")
              .map(
                (item) =>
                  item.trim()
              )
              .filter(Boolean),

          featured:
            form.featured,

          active:
            form.active,
        };

        if (!editing) {
          payload.stock =
            Number(
              form.stock
            );

          await createAdminProduct(
            payload
          );
        } else {
          await updateAdminProduct(
            productId,
            payload
          );
        }

        navigate(
          "/admin/products",
          {
            replace: true,
          }
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to save product."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-gray-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">

      <Link
        to="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#1687D9]"
      >
        <ArrowLeft
          size={17}
        />

        Back to Products
      </Link>

      <div className="mt-6">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
          Products
        </p>

        <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
          {editing
            ? "Edit Product"
            : "Add Product"}
        </h1>

      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-8 space-y-6"
      >

        <FormCard
          title="Product Information"
          icon={Package}
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field
              label="Product Name"
              required
            >
              <input
                name="name"
                value={form.name}
                onChange={
                  handleChange
                }
                required
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Category"
              required
            >
              <select
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleChange
                }
                className={
                  inputClass
                }
              >
                <option>
                  Air Conditioners
                </option>

                <option>
                  Spare Parts
                </option>

                <option>
                  Accessories
                </option>
              </select>
            </Field>

            <Field label="Brand">
              <input
                name="brand"
                value={
                  form.brand
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. LG"
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Price (GH₵)"
              required
            >
              <input
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={
                  form.price
                }
                onChange={
                  handleChange
                }
                required
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Old Price (GH₵)">
              <input
                type="number"
                min="0"
                step="0.01"
                name="oldPrice"
                value={
                  form.oldPrice
                }
                onChange={
                  handleChange
                }
                className={
                  inputClass
                }
              />
            </Field>

            {!editing && (
              <Field
                label="Opening Stock"
                required
              >
                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={
                    form.stock
                  }
                  onChange={
                    handleChange
                  }
                  className={
                    inputClass
                  }
                />
              </Field>
            )}

          </div>

          <div className="mt-5">

            <Field label="Short Description">
              <textarea
                name="shortDescription"
                value={
                  form.shortDescription
                }
                onChange={
                  handleChange
                }
                rows="2"
                className={
                  inputClass
                }
              />
            </Field>

          </div>

          <div className="mt-5">

            <Field
              label="Full Description"
              required
            >
              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                rows="5"
                required
                className={
                  inputClass
                }
              />
            </Field>

          </div>

        </FormCard>

        <FormCard title="Product Media & Specifications">

          <Field label="Image URL">

            <input
              name="imageUrl"
              value={
                form.imageUrl
              }
              onChange={
                handleChange
              }
              placeholder="https://..."
              className={
                inputClass
              }
            />

          </Field>

          {form.imageUrl && (
            <div className="mt-4 flex h-48 items-center justify-center rounded-2xl bg-[#F7FAFC] p-4">

              <img
                src={
                  form.imageUrl
                }
                alt="Product preview"
                className="max-h-full max-w-full object-contain"
              />

            </div>
          )}

          <div className="mt-5">

            <Field label="Specifications">

              <textarea
                name="specifications"
                value={
                  form.specifications
                }
                onChange={
                  handleChange
                }
                rows="7"
                placeholder={`1.5 HP\nInverter technology\nEnergy efficient\nLow noise`}
                className={
                  inputClass
                }
              />

            </Field>

            <p className="mt-2 text-xs text-gray-400">
              Enter one
              specification per line.
            </p>

          </div>

        </FormCard>

        <FormCard title="Visibility">

          <div className="grid gap-4 sm:grid-cols-2">

            <Toggle
              name="active"
              checked={
                form.active
              }
              onChange={
                handleChange
              }
              title="Active Product"
              description="Show this product on the public shop."
            />

            <Toggle
              name="featured"
              checked={
                form.featured
              }
              onChange={
                handleChange
              }
              title="Featured Product"
              description="Give this product featured visibility."
            />

          </div>

        </FormCard>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white disabled:opacity-60"
        >
          <Save size={18} />

          {saving
            ? "Saving..."
            : editing
              ? "Save Changes"
              : "Create Product"}
        </button>

      </form>

    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10";

function FormCard({
  title,
  icon: Icon,
  children,
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

      <div className="flex items-center gap-3 border-b border-gray-100 pb-5">

        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
            <Icon size={19} />
          </div>
        )}

        <h2 className="font-bold text-[#0B1F33]">
          {title}
        </h2>

      </div>

      <div className="pt-6">
        {children}
      </div>

    </section>
  );
}

function Field({
  label,
  required,
  children,
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}

    </label>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl border border-gray-200 p-5">

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-[#1687D9]"
      />

      <div>

        <p className="font-bold text-[#0B1F33]">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {description}
        </p>

      </div>

    </label>
  );
}