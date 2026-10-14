import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Images,
  Loader2,
  Package,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  createAdminProduct,
  deleteAdminProductImage,
  getAdminProduct,
  updateAdminProduct,
  uploadAdminProductImages,
} from "../../services/adminProductService";

const categories = [
  "Air Conditioners",
  "Spare Parts",
  "Accessories",
];

const MAX_IMAGES = 6;

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const initialForm = {
  name: "",
  category:
    "Air Conditioners",
  brand: "",

  shortDescription: "",
  description: "",

  price: "",
  oldPrice: "",

  stock: "0",

  featured: false,
  active: true,
};

export default function AdminProductForm() {
  const {
    productId,
  } = useParams();

  const navigate =
    useNavigate();

  const fileInputRef =
    useRef(null);

  const isEditing =
    Boolean(productId);

  const [
    form,
    setForm,
  ] = useState(
    initialForm
  );

  const [
    product,
    setProduct,
  ] = useState(null);

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  const [
    previewUrls,
    setPreviewUrls,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(
    isEditing
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingImage,
    setDeletingImage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const existingImages =
    product?.images || [];

  const totalImages =
    existingImages.length +
    selectedFiles.length;

  const remainingSlots =
    Math.max(
      MAX_IMAGES -
        totalImages,
      0
    );

  const loadProduct =
    async () => {
      if (!productId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getAdminProduct(
            productId
          );

        setProduct(data);

        setForm({
          name:
            data.name || "",

          category:
            data.category ||
            "Air Conditioners",

          brand:
            data.brand || "",

          shortDescription:
            data.shortDescription ||
            "",

          description:
            data.description ||
            "",

          price:
            data.price ??
            "",

          oldPrice:
            data.oldPrice ??
            "",

          stock:
            data.stock ??
            0,

          featured:
            Boolean(
              data.featured
            ),

          active:
            data.active !==
            false,
        });
      } catch (error) {
        console.error(
          "Unable to load product:",
          {
            status:
              error.response?.status,

            data:
              error.response?.data,

            message:
              error.message,
          }
        );

        setError(
          error.response?.data
            ?.message ||
            "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    const urls =
      selectedFiles.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      );

    setPreviewUrls(urls);

    return () => {
      urls.forEach(
        (url) =>
          URL.revokeObjectURL(
            url
          )
      );
    };
  }, [selectedFiles]);

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
      setSuccess("");
    };

  const handleFiles =
    (event) => {
      const files =
        Array.from(
          event.target.files ||
            []
        );

      event.target.value =
        "";

      if (
        files.length === 0
      ) {
        return;
      }

      const invalidType =
        files.find(
          (file) =>
            !allowedTypes.includes(
              file.type
            )
        );

      if (invalidType) {
        setError(
          "Only JPG, PNG and WEBP images are allowed."
        );

        return;
      }

      const oversized =
        files.find(
          (file) =>
            file.size >
            MAX_FILE_SIZE
        );

      if (oversized) {
        setError(
          "Each image must be 5 MB or smaller."
        );

        return;
      }

      if (
        totalImages +
          files.length >
        MAX_IMAGES
      ) {
        setError(
          `A product can have a maximum of ${MAX_IMAGES} images.`
        );

        return;
      }

      setSelectedFiles(
        (current) => [
          ...current,
          ...files,
        ]
      );

      setError("");
      setSuccess("");
    };

  const removeSelectedFile =
    (index) => {
      setSelectedFiles(
        (current) =>
          current.filter(
            (_, fileIndex) =>
              fileIndex !==
              index
          )
      );
    };

  const handleDeleteExistingImage =
    async (image) => {
      if (
        !productId ||
        !image?.publicId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Remove this product image?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingImage(
          image.publicId
        );

        setError("");
        setSuccess("");

        const result =
          await deleteAdminProductImage(
            productId,
            image.publicId
          );

        setProduct(
          (current) => ({
            ...current,

            images:
              result.images ||
              [],
          })
        );

        setSuccess(
          "Product image removed successfully."
        );
      } catch (error) {
        console.error(
          "Product image delete failed:",
          {
            status:
              error.response?.status,

            data:
              error.response?.data,

            message:
              error.message,
          }
        );

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to remove product image."
        );
      } finally {
        setDeletingImage("");
      }
    };

  const payload =
    useMemo(
      () => ({
        name:
          form.name.trim(),

        category:
          form.category,

        brand:
          form.brand.trim(),

        shortDescription:
          form.shortDescription.trim(),

        description:
          form.description.trim(),

        price:
          Number(
            form.price
          ),

        oldPrice:
          form.oldPrice ===
          ""
            ? undefined
            : Number(
                form.oldPrice
              ),

        featured:
          form.featured,

        active:
          form.active,
      }),
      [form]
    );

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !form.name.trim()
      ) {
        setError(
          "Product name is required."
        );

        return;
      }

      const parsedPrice =
        Number(
          form.price
        );

      if (
        !Number.isFinite(
          parsedPrice
        ) ||
        parsedPrice < 0
      ) {
        setError(
          "Enter a valid product price."
        );

        return;
      }

      if (
        !isEditing
      ) {
        const parsedStock =
          Number(
            form.stock
          );

        if (
          !Number.isInteger(
            parsedStock
          ) ||
          parsedStock < 0
        ) {
          setError(
            "Opening stock must be a whole number of 0 or greater."
          );

          return;
        }
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        let savedProduct;

        /*
         * 1. Save the actual
         * product information first.
         */
        if (isEditing) {
          savedProduct =
            await updateAdminProduct(
              productId,
              payload
            );
        } else {
          savedProduct =
            await createAdminProduct(
              {
                ...payload,

                stock:
                  Number(
                    form.stock
                  ),
              }
            );
        }

        const savedId =
          savedProduct?._id;

        if (!savedId) {
          throw new Error(
            "The product was saved but no product ID was returned."
          );
        }

        /*
         * 2. Upload selected images
         * only after MongoDB has a
         * valid product record.
         */
        if (
          selectedFiles.length >
          0
        ) {
          try {
            const imageResult =
              await uploadAdminProductImages(
                savedId,
                selectedFiles
              );

            savedProduct =
              imageResult.product ||
              savedProduct;
          } catch (
            uploadError
          ) {
            console.error(
              "Product image upload failed:",
              {
                status:
                  uploadError
                    .response
                    ?.status,

                data:
                  uploadError
                    .response
                    ?.data,

                message:
                  uploadError.message,
              }
            );

            /*
             * Important:
             * the product may already
             * have been created even
             * though image upload
             * failed.
             */
            if (!isEditing) {
              navigate(
                `/admin/products/${savedId}/edit`,
                {
                  replace: true,
                }
              );
            }

            setProduct(
              savedProduct
            );

            setError(
              uploadError.response
                ?.data?.message ||
                uploadError.message ||
                "The product was saved, but the images could not be uploaded."
            );

            setSuccess(
              "Product information was saved. Image upload still needs attention."
            );

            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });

            return;
          }
        }

        setSelectedFiles(
          []
        );

        setProduct(
          savedProduct
        );

        if (
          isEditing
        ) {
          setSuccess(
            selectedFiles.length >
            0
              ? "Product and images saved successfully."
              : "Product saved successfully."
          );

          /*
           * Refresh from backend so
           * the page shows exactly
           * what MongoDB currently
           * contains.
           */
          await loadProduct();

          window.scrollTo({
            top: 0,
            behavior:
              "smooth",
          });
        } else {
          navigate(
            `/admin/products/${savedId}/edit`,
            {
              replace: true,
            }
          );
        }
      } catch (error) {
        console.error(
          "Product save/upload failed:",
          {
            status:
              error.response?.status,

            data:
              error.response?.data,

            message:
              error.message,
          }
        );

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to save product."
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">

        <Loader2
          size={30}
          className="mx-auto animate-spin text-[#1687D9]"
        />

        <p className="mt-4 text-sm text-gray-500">
          Loading product...
        </p>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">

      <Link
        to="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#1687D9]"
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
          {isEditing
            ? "Edit Product"
            : "Add Product"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Manage product
          information, availability
          and product photography.
        </p>

      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-8 space-y-6"
      >

        <FormCard
          icon={Package}
          title="Product Information"
          description="Basic details customers will see."
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field
              label="Product Name"
              required
            >
              <input
                name="name"
                value={
                  form.name
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
                {categories.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  )
                )}
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
                placeholder="e.g. Midea"
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
                placeholder="Optional"
                className={
                  inputClass
                }
              />

            </Field>

            {!isEditing && (
              <Field label="Opening Stock">

                <input
                  type="number"
                  min="0"
                  step="1"
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

            <Field label="Full Description">

              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                rows="6"
                className={
                  inputClass
                }
              />

            </Field>

          </div>

        </FormCard>

        <FormCard
          icon={Images}
          title="Product Images"
          description="Upload clear product photographs. The first image is used as the primary image."
        >

          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-[#FAFCFD] p-6">

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={
                handleFiles
              }
              className="hidden"
            />

            <div className="text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF6FF] text-[#1687D9]">
                <UploadCloud
                  size={23}
                />
              </div>

              <h3 className="mt-4 font-bold text-[#0B1F33]">
                Choose Product
                Images
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                JPG, PNG or WEBP.
                Maximum 5 MB each.
                Up to 6 images per
                product.
              </p>

              <button
                type="button"
                disabled={
                  remainingSlots ===
                  0 ||
                  saving
                }
                onClick={() =>
                  fileInputRef
                    .current
                    ?.click()
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1687D9] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImagePlus
                  size={18}
                />

                Choose Images
              </button>

              <p className="mt-3 text-xs text-gray-400">
                {remainingSlots}{" "}
                image slot
                {remainingSlots ===
                1
                  ? ""
                  : "s"}{" "}
                remaining
              </p>

            </div>

          </div>

          {existingImages.length >
            0 && (
            <div className="mt-7">

              <div className="flex items-center justify-between">

                <h3 className="font-bold text-[#0B1F33]">
                  Current Images
                </h3>

                <span className="text-xs text-gray-400">
                  {
                    existingImages.length
                  }
                  /{MAX_IMAGES}
                </span>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">

                {existingImages.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={
                        image.publicId ||
                        image.url ||
                        index
                      }
                      className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white"
                    >

                      <div className="aspect-square bg-[#F4F7F9]">

                        <img
                          src={
                            image.url
                          }
                          alt={`${form.name || "Product"} ${index + 1}`}
                          className="h-full w-full object-contain p-2"
                        />

                      </div>

                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#0B1F33] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Primary
                        </span>
                      )}

                      {image.publicId ? (
                        <button
                          type="button"
                          disabled={
                            deletingImage ===
                            image.publicId ||
                            saving
                          }
                          onClick={() =>
                            handleDeleteExistingImage(
                              image
                            )
                          }
                          aria-label="Remove product image"
                          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-md transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingImage ===
                          image.publicId ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={16}
                            />
                          )}
                        </button>
                      ) : (
                        <span className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-gray-500 shadow">
                          Legacy image
                        </span>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>
          )}

          {selectedFiles.length >
            0 && (
            <div className="mt-7">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-[#0B1F33]">
                    Ready to Upload
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    These images
                    upload when you
                    save the product.
                  </p>

                </div>

                <span className="text-xs font-semibold text-[#1687D9]">
                  {
                    selectedFiles.length
                  }{" "}
                  selected
                </span>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">

                {selectedFiles.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-[#B9DEF7] bg-[#EAF6FF]"
                    >

                      <div className="aspect-square">

                        <img
                          src={
                            previewUrls[
                              index
                            ]
                          }
                          alt={
                            file.name
                          }
                          className="h-full w-full object-contain p-2"
                        />

                      </div>

                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          removeSelectedFile(
                            index
                          )
                        }
                        aria-label="Remove selected image"
                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-md disabled:opacity-50"
                      >
                        <X
                          size={17}
                        />
                      </button>

                      <div className="border-t border-[#CBE6F8] bg-white/80 px-3 py-2">

                        <p className="truncate text-xs font-semibold text-[#0B1F33]">
                          {
                            file.name
                          }
                        </p>

                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {formatFileSize(
                            file.size
                          )}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>
          )}

        </FormCard>

        <FormCard
          title="Store Visibility"
          description="Control where this product appears."
        >

          <div className="grid gap-4 sm:grid-cols-2">

            <ToggleCard
              name="featured"
              checked={
                form.featured
              }
              onChange={
                handleChange
              }
              title="Featured Product"
              description="Show this product in featured areas of the store."
            />

            <ToggleCard
              name="active"
              checked={
                form.active
              }
              onChange={
                handleChange
              }
              title="Active Product"
              description="Allow customers to see and order this product."
            />

          </div>

        </FormCard>

        {isEditing && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm leading-6 text-orange-800">
            Stock cannot be changed
            from this page. Use the{" "}
            <Link
              to="/admin/inventory"
              className="font-bold underline"
            >
              Inventory
            </Link>{" "}
            section so stock
            movements remain
            controlled.
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <Link
            to="/admin/products"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-[#0B1F33]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1176BF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Save
                size={18}
              />
            )}

            {saving
              ? selectedFiles.length >
                0
                ? "Saving & Uploading..."
                : "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Product"}
          </button>

        </div>

      </form>

    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#17212B] outline-none transition placeholder:text-gray-400 focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10";

function FormCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

      <div className="flex items-start gap-3 border-b border-gray-100 pb-5">

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
            <Icon
              size={19}
            />
          </div>
        )}

        <div>

          <h2 className="font-bold text-[#0B1F33]">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}

        </div>

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

function ToggleCard({
  name,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 p-5">

      <input
        type="checkbox"
        name={name}
        checked={
          checked
        }
        onChange={
          onChange
        }
        className="mt-1 h-4 w-4"
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

function formatFileSize(
  bytes
) {
  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.round(
      bytes / 1024
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}