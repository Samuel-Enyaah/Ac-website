import mongoose from "mongoose";
import { z } from "zod";

import Product from "../models/Product.js";

const categories = [
  "Air Conditioners",
  "Spare Parts",
  "Accessories",
];

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(name) {
  const base =
    slugify(name) || "product";

  let slug = base;
  let counter = 2;

  while (
    await Product.exists({
      slug,
    })
  ) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

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
      .optional(),

    description: z
      .string()
      .trim()
      .min(5),

    shortDescription: z
      .string()
      .trim()
      .optional(),

    price: z
      .number()
      .min(0),

    oldPrice: z
      .number()
      .min(0)
      .nullable()
      .optional(),

    stock: z
      .number()
      .int()
      .min(0),

    specifications: z
      .array(
        z.string().trim()
      )
      .optional(),

    featured: z
      .boolean()
      .optional(),

    active: z
      .boolean()
      .optional(),

    imageUrl: z
      .string()
      .trim()
      .optional(),
  });

const updateProductSchema =
  createProductSchema
    .omit({
      stock: true,
    })
    .partial();

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
        ) || 10,
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

    const active = String(
      req.query.active || ""
    ).trim();

    const stock = String(
      req.query.stock || ""
    ).trim();

    const query = {};

    if (
      category &&
      category !== "all" &&
      categories.includes(
        category
      )
    ) {
      query.category =
        category;
    }

    if (active === "active") {
      query.active = true;
    }

    if (
      active === "inactive"
    ) {
      query.active = false;
    }

    if (stock === "low") {
      query.stock = {
        $gt: 0,
        $lte: 5,
      };
    }

    if (
      stock === "out"
    ) {
      query.stock = 0;
    }

    if (search) {
      const regex =
        new RegExp(
          escapeRegex(
            search
          ),
          "i"
        );

      query.$or = [
        {
          name: regex,
        },
        {
          brand: regex,
        },
        {
          slug: regex,
        },
      ];
    }

    const [
      products,
      total,
    ] = await Promise.all([
      Product.find(query)
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
        query
      ),
    ]);

    const pages =
      Math.max(
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
    const { productId } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        productId
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
        productId
      ).lean();

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
        });
    }

    const data =
      parsed.data;

    const slug =
      await createUniqueSlug(
        data.name
      );

    const product =
      await Product.create({
        name: data.name,
        slug,

        category:
          data.category,

        brand:
          data.brand || "",

        description:
          data.description,

        shortDescription:
          data.shortDescription ||
          "",

        price: data.price,

        oldPrice:
          data.oldPrice ??
          null,

        stock:
          data.stock,

        images:
          data.imageUrl
            ? [
                {
                  url:
                    data.imageUrl,
                  publicId:
                    "",
                },
              ]
            : [],

        specifications:
          data.specifications ||
          [],

        featured:
          data.featured ||
          false,

        active:
          data.active ??
          true,
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
    const { productId } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        productId
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
        });
    }

    const product =
      await Product.findById(
        productId
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

    const normalFields = [
      "name",
      "category",
      "brand",
      "description",
      "shortDescription",
      "price",
      "oldPrice",
      "specifications",
      "featured",
      "active",
    ];

    for (
      const field of
      normalFields
    ) {
      if (
        data[field] !==
        undefined
      ) {
        product[field] =
          data[field];
      }
    }

    if (
      data.imageUrl !==
      undefined
    ) {
      product.images =
        data.imageUrl
          ? [
              {
                url:
                  data.imageUrl,
                publicId: "",
              },
            ]
          : [];
    }

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

const inventorySchema =
  z.object({
    operation: z.enum([
      "set",
      "increase",
      "decrease",
    ]),

    quantity: z
      .number()
      .int()
      .min(0),

    reason: z
      .string()
      .trim()
      .max(500)
      .optional(),
  });

export async function adjustProductInventory(
  req,
  res,
  next
) {
  try {
    const { productId } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        productId
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
            "Invalid inventory adjustment.",
        });
    }

    const {
      operation,
      quantity,
    } = parsed.data;

    if (
      operation !== "set" &&
      quantity < 1
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Quantity must be at least 1.",
        });
    }

    const product =
      await Product.findById(
        productId
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

    if (
      operation === "set"
    ) {
      product.stock =
        quantity;
    }

    if (
      operation ===
      "increase"
    ) {
      product.stock +=
        quantity;
    }

    if (
      operation ===
      "decrease"
    ) {
      if (
        quantity >
        product.stock
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `Only ${product.stock} unit(s) are currently available.`,
          });
      }

      product.stock -=
        quantity;
    }

    await product.save();

    res.status(200).json({
      success: true,

      message:
        "Inventory updated successfully.",

      product,
    });
  } catch (error) {
    next(error);
  }
}