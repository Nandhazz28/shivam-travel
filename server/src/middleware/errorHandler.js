export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid identifier supplied." });
  }

  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "File is too large. Maximum size is 5MB.",
      LIMIT_FILE_COUNT: "Too many files uploaded at once.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field in upload.",
    };
    return res.status(400).json({ success: false, message: messages[err.code] || "File upload failed." });
  }

  if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ success: false, message: "Malformed JSON in request body." });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }

  if (statusCode >= 500) {
    console.error(err);
  } else if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  const isOperational = typeof err.statusCode === "number";
  const safeMessage =
    isOperational || process.env.NODE_ENV !== "production"
      ? err.message || "Something went wrong on the server."
      : "Something went wrong on the server. Please try again later.";

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    code: isOperational ? err.code : undefined,
  });
}
