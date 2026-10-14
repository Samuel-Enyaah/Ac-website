import multer from "multer";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const storage =
  multer.memoryStorage();

function fileFilter(
  req,
  file,
  callback
) {
  if (
    !allowedTypes.has(
      file.mimetype
    )
  ) {
    const error =
      new Error(
        "Only JPG, PNG and WEBP images are allowed."
      );

    error.statusCode = 400;

    return callback(
      error,
      false
    );
  }

  callback(null, true);
}

const upload = multer({
  storage,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

  fileFilter,
});

export const uploadSingleImage =
  upload.single("image");

export const uploadProductImages =
  upload.array(
    "images",
    6
  );