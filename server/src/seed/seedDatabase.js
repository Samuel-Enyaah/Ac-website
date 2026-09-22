import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import Product from "../models/Product.js";
import { seedProducts } from "./products.js";

async function seedDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("MongoDB connected.");

    await Product.deleteMany({});

    console.log(
      "Existing products removed."
    );

    const products =
      await Product.insertMany(
        seedProducts
      );

    console.log(
      `${products.length} products added successfully.`
    );

    await mongoose.disconnect();

    console.log(
      "Database seeding complete."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Database seeding failed:",
      error
    );

    process.exit(1);
  }
}

seedDatabase();