
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
                console.error("Cloudinary upload failed:", { status: error.http_code, name: error.name });

                return reject(
                  Object.assign(new Error([401, 403].includes(error.http_code) ? "Media provider rejected the upload. Please check the configured media account permissions." : "Media upload failed. Please try again."), { statusCode: 502, expose: true })
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

        uploadStream.on("error", () => reject(Object.assign(new Error("Image upload is temporarily unavailable. Please try again."), { statusCode: 502, expose: true })));

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
        timeout: 30000,
      }
    );

  return result;
}
