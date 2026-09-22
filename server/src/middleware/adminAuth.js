import jwt from "jsonwebtoken";

import Admin from "../models/Admin.js";
import {
  ADMIN_COOKIE,
} from "../utils/adminAuth.js";

export async function requireAdmin(
  req,
  res,
  next
) {
  try {
    const token =
      req.cookies?.[
        ADMIN_COOKIE
      ];

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Admin authentication required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        success: false,
        message:
          "Admin session is invalid or expired.",
      });
    }

    const admin =
      await Admin.findById(
        decoded.sub
      );

    if (
      !admin ||
      !admin.active
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Admin account is unavailable.",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    next(error);
  }
}