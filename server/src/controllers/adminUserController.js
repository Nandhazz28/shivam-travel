import Admin from "../models/Admin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_ROLES = ["Administrator", "Manager", "Booking Staff", "Driver", "Customer Support"];

export const listAdminUsers = asyncHandler(async (req, res) => {
  const admins = await Admin.find().sort({ createdAt: -1 }).lean();
  const totalUsers = admins.length;
  const activeUsers = admins.filter((a) => a.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminRoleUsers = admins.filter((a) => a.role === "Administrator").length;

  res.json({
    success: true,
    data: admins,
    stats: { totalUsers, activeUsers, inactiveUsers, adminRoleUsers },
  });
});

export const getAdminUser = asyncHandler(async (req, res) => {
  const user = await Admin.findById(req.params.id);
  if (!user) throw new ApiError(404, "Staff user not found.");
  res.json({ success: true, data: user });
});

export const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }
  if (role && !ALLOWED_ROLES.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${ALLOWED_ROLES.join(", ")}.`);
  }

  const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, "A staff account with this email already exists.");

  const user = await Admin.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role || "Booking Staff",
  });

  const safeUser = await Admin.findById(user._id);
  res.status(201).json({ success: true, data: safeUser, message: "Staff account created." });
});

export const updateAdminUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  const user = await Admin.findById(req.params.id);
  if (!user) throw new ApiError(404, "Staff user not found.");

  if (role && !ALLOWED_ROLES.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${ALLOWED_ROLES.join(", ")}.`);
  }
  if (email && email.toLowerCase().trim() !== user.email) {
    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) throw new ApiError(409, "A staff account with this email already exists.");
    user.email = email.toLowerCase().trim();
  }
  if (name) user.name = name.trim();
  if (role) user.role = role;

  await user.save();
  res.json({ success: true, data: user, message: "Staff account updated." });
});

export const toggleAdminUserActive = asyncHandler(async (req, res) => {
  const user = await Admin.findById(req.params.id);
  if (!user) throw new ApiError(404, "Staff user not found.");
  if (String(user._id) === String(req.admin._id)) {
    throw new ApiError(400, "You cannot deactivate your own account.");
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: user, message: user.isActive ? "Account activated." : "Account deactivated." });
});

export const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await Admin.findById(req.params.id);
  if (!user) throw new ApiError(404, "Staff user not found.");
  if (String(user._id) === String(req.admin._id)) {
    throw new ApiError(400, "You cannot delete your own account.");
  }
  if (user.role === "Administrator") {
    const adminCount = await Admin.countDocuments({ role: "Administrator" });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot delete the last remaining Administrator account.");
    }
  }
  await user.deleteOne();
  res.json({ success: true, message: "Staff account deleted." });
});
