import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, WEBP, or GIF images are allowed."), false);
  }
  const ext = (file.originalname || "").split(".").pop()?.toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new ApiError(400, "Only JPEG, PNG, WEBP, or GIF images are allowed."), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const verifyImageSignature = asyncHandler(async (req, res, next) => {
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : req.file ? [req.file] : [];

  for (const file of files) {
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      throw new ApiError(
        400,
        "The uploaded file does not appear to be a valid JPEG, PNG, WEBP, or GIF image."
      );
    }
  }

  next();
});
