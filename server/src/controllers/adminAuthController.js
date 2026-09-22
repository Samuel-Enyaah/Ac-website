import bcrypt from "bcryptjs";
import { z } from "zod";

import Admin from "../models/Admin.js";

import {
  ADMIN_COOKIE,
  createAdminToken,
  getAdminCookieOptions,
} from "../utils/adminAuth.js";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email(),

  password: z
    .string()
    .min(8),
});

function presentAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export async function adminLogin(
  req,
  res,
  next
) {
  try {
    const parsed =
      loginSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid email and password.",
      });
    }

    const email =
      parsed.data.email
        .toLowerCase();

    const admin =
      await Admin.findOne({
        email,
        active: true,
      }).select(
        "+passwordHash"
      );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        parsed.data.password,
        admin.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const token =
      createAdminToken(admin);

    res.cookie(
      ADMIN_COOKIE,
      token,
      getAdminCookieOptions()
    );

    admin.lastLoginAt =
      new Date();

    await admin.save();

    res.status(200).json({
      success: true,
      admin:
        presentAdmin(admin),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentAdmin(
  req,
  res
) {
  res.status(200).json({
    success: true,
    admin:
      presentAdmin(
        req.admin
      ),
  });
}

export async function adminLogout(
  req,
  res
) {
  res.clearCookie(
    ADMIN_COOKIE,
    {
      ...getAdminCookieOptions(),
      maxAge: undefined,
    }
  );

  res.status(200).json({
    success: true,
    message:
      "Admin signed out.",
  });
}