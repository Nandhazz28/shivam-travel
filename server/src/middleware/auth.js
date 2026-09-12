import { verifyToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiError.js";
import Admin from "../models/Admin.js";

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export async function requireAdmin(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, "Not authenticated. No token provided.");

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new ApiError(401, "Session expired or invalid token. Please log in again.");
    }

    if (decoded.type !== "admin") throw new ApiError(403, "Admin access required.");

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      throw new ApiError(401, "Account not found or deactivated.");
    }

    if (typeof decoded.tv !== "number" || decoded.tv !== admin.tokenVersion) {
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}
