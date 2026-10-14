import mongoose from "mongoose";
import { z } from "zod";

import Product from "../models/Product.js";

import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "../utils/cloudinaryMedia.js";

const categories = [
  "Air Conditioners",
  "Spare Parts",
  "Accessories",
];

const optionalNumber = z
  .union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return undefined;
    }

    return Number(value);
  });

const optionalBoolean = z
  .union([
    z.boolean(),
    z.string(),
    z.undefined(),
  ])
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return value === "true";
  });

const createProductSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2),

    category: z.enum(
      categories
    ),

    brand: z
      .string()
      .trim()
      .optional()
      .default(""),

    shortDescription: z
      .string()
      .trim()
      .optional()
      .default(""),

    description: z
      .string()
      .trim()
      .optional()
      .default(""),

    price: optionalNumber,

    oldPrice: optionalNumber,

    stock: optionalNumber,

    featured:
      optionalBoolean,

    active:
      optionalBoolean,

    /*
     * Temporary compatibility
     * with the old URL-based form.
     * Direct upload replaces this
     * in Phase 6.7B.
     */
    imageUrl: z
      .string()
      .trim()
      .optional()
      .default(""),

    specifications:
      z.any().optional(),
  });

const updateProductSchema =
  createProductSchema
    .partial()
    .omit({
      stock: true,
    });

const inventorySchema =
  z.object({
    operation: z.enum([
      "set",
      "increase",
      "decrease",
    ]),

    quantity: z.coerce
      .number()
      .int()
      .min(0),

    reason: z
      .string()
      .trim()
      .max(300)
      .optional()
      .default(""),
  });

function escapeRegex(
  value = ""
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function slugify(
  value = ""
) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

async function createUniqueSlug(
  name,
  excludeId = null
) {
  const base =
    slugify(name) ||
    "product";

  let slug = base;
  let suffix = 2;

  while (true) {
    const filter = {
      slug,
    };

    if (excludeId) {
      filter._id = {
        $ne: excludeId,
      };
    }

    const exists =
      await Product.exists(
        filter
      );

    if (!exists) {
      return slug;
    }

    slug =
      `${base}-${suffix}`;

    suffix += 1;
  }
}

function parseBooleanQuery(
  value
) {
  if (
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  if (
    value === "true" ||
    value === true
  ) {
    return true;
  }

  if (
    value === "false" ||
    value === false
  ) {
    return false;
  }

  return undefined;
}

export async function getAdminProducts(
  req,
  res,
  next
) {
  try {
    const page = Math.max(
      Number.parseInt(
        req.query.page,
        10
      ) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(
          req.query.limit,
          10
        ) || 20,
        1
      ),
      100
    );

    const search = String(
      req.query.search || ""
    ).trim();

    const category = String(
      req.query.category || ""
    ).trim();

    const active =
      parseBooleanQuery(
        req.query.active
      );

    const stockFilter =
      String(
        req.query.stock || ""
      ).trim();

    const filter = {};

    if (search) {
      const regex = new RegExp(
        escapeRegex(search),
        "i"
      );

      filter.$or = [
        {
          name: regex,
        },
        {
          brand: regex,
        },
        {
          category: regex,
        },
        {
          slug: regex,
        },
      ];
    }

    if (
      category &&
      categories.includes(
        category
      )
    ) {
      filter.category =
        category;
    }

    if (
      active !==
      undefined
    ) {
      filter.active =
        active;
    }

    if (
      stockFilter ===
      "out"
    ) {
      filter.stock = 0;
    }

    if (
      stockFilter ===
      "low"
    ) {
      filter.stock = {
        $gt: 0,
        $lte: 5,
      };
    }

    if (
      stockFilter ===
      "available"
    ) {
      filter.stock = {
        $gt: 0,
      };
    }

    const [
      products,
      total,
    ] =
      await Promise.all([
        Product.find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) *
              limit
          )
          .limit(limit)
          .lean(),

        Product.countDocuments(
          filter
        ),
      ]);

    const pages = Math.max(
      Math.ceil(
        total / limit
      ),
      1
    );

    res.status(200).json({
      success: true,

      products,

      pagination: {
        page,
        limit,
        total,
        pages,

        hasNextPage:
          page < pages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminProductById(
  req,
  res,
  next
) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.productId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid product ID.",
        });
    }

    const product =
      await Product.findById(
        req.params.productId
      );

    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Product not found.",
        });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminProduct(
  req,
  res,
  next
) {
  try {
    const parsed =
      createProductSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Please check the product information.",

          errors:
            parsed.error
              .flatten()
              .fieldErrors,
        });
    }

    const data =
      parsed.data;

    const price =
      Number(data.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "A valid product price is required.",
        });
    }

    const stock =
      data.stock ===
      undefined
        ? 0
        : Number(
            data.stock
          );

    if (
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Opening stock must be a whole number of 0 or greater.",
        });
    }

    const slug =
      await createUniqueSlug(
        data.name
      );

    const images = [];

    /*
     * Keeps the previous URL-based
     * workflow working until the
     * new upload UI is connected.
     */
    if (data.imageUrl) {
      images.push({
        url:
          data.imageUrl,
        publicId: "",
      });
    }

    const product =
      await Product.create({
        name: data.name,
        slug,

        category:
          data.category,

        brand:
          data.brand || "",

        shortDescription:
          data.shortDescription ||
          "",

        description:
          data.description ||
          "",

        price,

        oldPrice:
          data.oldPrice ===
          undefined
            ? undefined
            : Number(
                data.oldPrice
              ),

        stock,

        featured:
          data.featured ??
          false,

        active:
          data.active ??
          true,

        specifications:
          data.specifications,

        images,
      });

    res.status(201).json({
      success: true,

      message:
        "Product created successfully.",

      product,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminProduct(
  req,
  res,
  next
) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.productId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid product ID.",
        });
    }

    const parsed =
      updateProductSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Please check the product information.",

          errors:
            parsed.error
              .flatten()
              .fieldErrors,
        });
    }

    const product =
      await Product.findById(
        req.params.productId
      );

    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Product not found.",
        });
    }

    const data =
      parsed.data;

    if (
      data.name !==
      undefined
    ) {
      product.name =
        data.name;

      product.slug =
        await createUniqueSlug(
          data.name,
          product._id
        );
    }

    if (
      data.category !==
      undefined
    ) {
      product.category =
        data.category;
    }

    if (
      data.brand !==
      undefined
    ) {
      product.brand =
        data.brand;
    }

    if (
      data.shortDescription !==
      undefined
    ) {
      product.shortDescription =
        data.shortDescription;
    }

    if (
      data.description !==
      undefined
    ) {
      product.description =
        data.description;
    }

    if (
      data.price !==
      undefined
    ) {
      const price =
        Number(
          data.price
        );

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Product price must be 0 or greater.",
          });
      }

      product.price =
        price;
    }

    if (
      data.oldPrice !==
      undefined
    ) {
      product.oldPrice =
        Number(
          data.oldPrice
        );
    }

    if (
      data.featured !==
      undefined
    ) {
      product.featured =
        data.featured;
    }

    if (
      data.active !==
      undefined
    ) {
      product.active =
        data.active;
    }

    if (
      data.specifications !==
      undefined
    ) {
      product.specifications =
        data.specifications;
    }

    /*
     * Stock is intentionally NOT
     * editable here. Inventory has
     * its own protected endpoint.
     *
     * Images are also managed by
     * dedicated media endpoints.
     */
    await product.save();

    res.status(200).json({
      success: true,

      message:
        "Product updated successfully.",

      product,
    });
  } catch (error) {
    next(error);
  }
}

export async function adjustProductInventory(
  req,
  res,
  next
) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.productId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid product ID.",
        });
    }

    const parsed =
      inventorySchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Please check the inventory adjustment.",

          errors:
            parsed.error
              .flatten()
              .fieldErrors,
        });
    }

    const {
      operation,
      quantity,
    } = parsed.data;

    const product =
      await Product.findById(
        req.params.productId
      );

    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Product not found.",
        });
    }

    let nextStock =
      Number(
        product.stock || 0
      );

    if (
      operation === "set"
    ) {
      nextStock =
        quantity;
    }

    if (
      operation ===
      "increase"
    ) {
      nextStock +=
        quantity;
    }

    if (
      operation ===
      "decrease"
    ) {
      nextStock -=
        quantity;
    }

    if (nextStock < 0) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Inventory cannot be reduced below zero.",
        });
    }

    product.stock =
      nextStock;

    await product.save();

    res.status(200).json({
      success: true,

      message:
        "Inventory updated successfully.",

      product,

      inventory: {
        stock:
          product.stock,

        operation,

        quantity,

        reason:
          parsed.data.reason,
      },
    });
  } catch (error) {
    next(error);
  }
}

/*
 * CLOUDINARY PRODUCT MEDIA
 */

export async function uploadAdminProductImages(
  req,
  res,
  next
) {
  const uploadedAssets = [];

  try {
    if (
      !mongoose.isValidObjectId(
        req.params.productId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid product ID.",
        });
    }

    const product =
      await Product.findById(
        req.params.productId
      );

    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Product not found.",
        });
    }

    const files =
      req.files || [];

    if (
      files.length === 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Please select at least one image.",
        });
    }

    const currentImages =
      product.images || [];

    if (
      currentImages.length +
        files.length >
      6
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A product can have a maximum of 6 images.",
        });
    }

    for (
      const file of files
    ) {
      const result =
        await uploadImageBuffer(
          file.buffer,
          {
            folder:
              "rj-ac/products",

            transformation: [
              {
                width: 1600,
                height: 1600,
                crop: "limit",
              },
              {
                quality: "auto",
              },
              {
                fetch_format:
                  "auto",
              },
            ],
          }
        );

      const asset = {
        url:
          result.secure_url,

        publicId:
          result.public_id,
      };

      uploadedAssets.push(
        asset
      );
    }

    product.images.push(
      ...uploadedAssets
    );

    await product.save();

    res.status(200).json({
      success: true,

      message:
        "Product images uploaded successfully.",

      product,

      images:
        product.images,
    });
  } catch (error) {
    /*
     * If Cloudinary succeeded
     * but MongoDB failed, clean up
     * the newly uploaded files.
     */
    for (
      const asset of
      uploadedAssets
    ) {
      try {
        await deleteCloudinaryImage(
          asset.publicId
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "Cloudinary cleanup failed:",
          cleanupError
        );
      }
    }

    next(error);
  }
}

export async function deleteAdminProductImage(
  req,
  res,
  next
) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.productId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid product ID.",
        });
    }

    const {
      publicId,
    } = req.body;

    if (!publicId) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Image publicId is required.",
        });
    }

    const product =
      await Product.findById(
        req.params.productId
      );

    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Product not found.",
        });
    }

    const imageExists =
      product.images.some(
        (image) =>
          image.publicId ===
          publicId
      );

    if (!imageExists) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Image does not belong to this product.",
        });
    }

    product.images =
      product.images.filter(
        (image) =>
          image.publicId !==
          publicId
      );

    /*
     * Save MongoDB first.
     * This avoids a product
     * referencing an image that
     * Cloudinary has already
     * deleted.
     */
    await product.save();

    try {
      await deleteCloudinaryImage(
        publicId
      );
    } catch (error) {
      console.error(
        "Cloudinary image deletion failed:",
        error
      );
    }

    res.status(200).json({
      success: true,

      message:
        "Product image removed successfully.",

      product,

      images:
        product.images,
    });
  } catch (error) {
    next(error);
  }
}