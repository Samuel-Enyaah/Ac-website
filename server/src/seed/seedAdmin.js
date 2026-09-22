import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config();

import Admin from "../models/Admin.js";

async function seedAdmin() {
  try {
    const {
      MONGODB_URI,
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (
      !MONGODB_URI ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD
    ) {
      throw new Error(
        "MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD are required."
      );
    }

    if (
      ADMIN_PASSWORD.length <
      8
    ) {
      throw new Error(
        "ADMIN_PASSWORD must contain at least 8 characters."
      );
    }

    await mongoose.connect(
      MONGODB_URI
    );

    const email =
      ADMIN_EMAIL
        .trim()
        .toLowerCase();

    const existing =
      await Admin.findOne({
        email,
      });

    if (existing) {
      console.log(
        "Admin already exists."
      );

      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash =
      await bcrypt.hash(
        ADMIN_PASSWORD,
        12
      );

    await Admin.create({
      name:
        ADMIN_NAME ||
        "R&J Administrator",

      email,

      passwordHash,

      role:
        "super_admin",
    });

    console.log(
      `Admin created: ${email}`
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "Admin seed failed:",
      error.message
    );

    process.exit(1);
  }
}

seedAdmin();