import multer from "multer";

export function errorHandler(
  error,
  req,
  res,
  next
) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(
    "Request error:",
    error
  );

  // Multer upload errors
  if (
    error instanceof
    multer.MulterError
  ) {
    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Image must be 5 MB or smaller.",
        });
    }

    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Too many images were selected or the upload field is invalid.",
        });
    }

    return res
      .status(400)
      .json({
        success: false,

        message:
          error.message ||
          "Image upload failed.",
      });
  }

  // Custom application errors
  if (error.statusCode) {
    return res
      .status(
        error.statusCode
      )
      .json({
        success: false,

        message:
          error.message ||
          "Request failed.",
      });
  }

  // Invalid MongoDB ObjectId
  if (
    error.name ===
    "CastError"
  ) {
    return res
      .status(400)
      .json({
        success: false,

        message:
          "Invalid record identifier.",
      });
  }

  // Mongoose validation errors
  if (
    error.name ===
    "ValidationError"
  ) {
    const errors =
      Object.values(
        error.errors || {}
      ).map(
        (item) =>
          item.message
      );

    return res
      .status(400)
      .json({
        success: false,

        message:
          errors[0] ||
          "Validation failed.",

        errors,
      });
  }

  // MongoDB duplicate-key errors
  if (
    error.code === 11000
  ) {
    const field =
      Object.keys(
        error.keyPattern ||
          error.keyValue ||
          {}
      )[0];

    return res
      .status(409)
      .json({
        success: false,

        message: field
          ? `${field} already exists.`
          : "A record with these details already exists.",
      });
  }

  const possibleStatus =
    Number(
      error.http_code ||
        error.status
    );

  const statusCode =
    possibleStatus >= 400 &&
    possibleStatus < 600
      ? possibleStatus
      : 500;

  return res
    .status(statusCode)
    .json({
      success: false,

      message:
        statusCode === 500
          ? "Something went wrong on the server."
          : error.message ||
            "Request failed.",

      ...(process.env.NODE_ENV !==
      "production"
        ? {
            error:
              error.message,
          }
        : {}),
    });
}