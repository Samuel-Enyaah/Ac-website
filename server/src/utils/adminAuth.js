import jwt from "jsonwebtoken";

export const ADMIN_COOKIE =
  "rj_admin";

export function createAdminToken(
  admin
) {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      sub: admin._id.toString(),
      role: admin.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );
}

export function getAdminCookieOptions() {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction
      ? "none"
      : "lax",
    maxAge:
      8 * 60 * 60 * 1000,
    path: "/",
  };
}