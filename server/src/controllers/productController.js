import Product from "../models/Product.js";

export async function getProducts(req, res, next) {
  try {
    const {
      category,
      search,
      featured,
    } = req.query;

    const filter = {
      active: true,
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const products = await Product.find(filter)
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlug(
  req,
  res,
  next
) {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      active: true,
    });

    if (!product) {
      res.status(404);

      throw new Error("Product not found.");
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}