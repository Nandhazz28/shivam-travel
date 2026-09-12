import { v2 as cloudinary } from "cloudinary";

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "[CONFIG WARNING] Cloudinary credentials are not set. Image upload endpoints " +
      "will respond with a clear configuration error until CLOUDINARY_CLOUD_NAME, " +
      "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set in server/.env"
  );
}

export function uploadBufferToCloudinary(buffer, folder = "shivam-travels") {
  if (!isCloudinaryConfigured) {
    const err = new Error(
      "Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY " +
        "and CLOUDINARY_API_SECRET in server/.env to enable image uploads."
    );
    err.statusCode = 503;
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured || !publicId) return Promise.resolve(null);

  return cloudinary.uploader.destroy(publicId).catch((err) => {
    console.error(`[Cloudinary] Failed to delete image (publicId: ${publicId}):`, err.message || err);
    return null;
  });
}

export default cloudinary;
