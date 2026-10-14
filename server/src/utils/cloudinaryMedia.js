
import {
  Readable,
} from "node:stream";

import {
  getCloudinary,
} from "../config/cloudinary.js";

/*
 * Upload the original image safely.
 *
 * We deliberately do not apply
 * f_auto / q_auto during upload.
 * Those optimizations belong on
 * delivery URLs later.
 */
export function uploadImageBuffer(
  buffer,
  options = {}
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      try {
        const cloudinary =
          getCloudinary();

        /*
         * Ignore incoming
         * transformation settings
         * passed by older controller
         * versions.
         */
        const {
          transformation,
          eager,
          ...safeOptions
        } = options;

        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              resource_type:
                "image",

              ...safeOptions,
            },

            (
              error,
              result
            ) => {
              if (error) {
                console.error(
                  "Cloudinary upload error:",
                  error
                );

                return reject(
                  error
                );
              }

              if (
                !result?.secure_url ||
                !result?.public_id
              ) {
                return reject(
                  new Error(
                    "Cloudinary did not return a valid uploaded image."
                  )
                );
              }

              resolve(result);
            }
          );

        const readable =
          Readable.from(
            buffer
          );

        readable.on(
          "error",
          reject
        );

        readable.pipe(
          uploadStream
        );
      } catch (error) {
        reject(error);
      }
    }
  );
}

export async function deleteCloudinaryImage(
  publicId
) {
  if (!publicId) {
    return null;
  }

  const cloudinary =
    getCloudinary();

  const result =
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          "image",

        invalidate: true,
      }
    );

  return result;
}