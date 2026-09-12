import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Enquiry from "../models/Enquiry.js";
import Service from "../models/Service.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import Booking from "../models/Booking.js";

const router = Router();

router.get(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [
      totalEnquiries,
      newEnquiries,
      activeServices,
      activeVehicles,
      totalVehicles,
      totalDrivers,
      recentEnquiries,
      todaysBookings,
      totalBookings,
      pendingBookings,
      completedBookings,
    ] =
      await Promise.all([
        Enquiry.countDocuments(),
        Enquiry.countDocuments({ status: "New" }),
        Service.countDocuments({ isActive: true }),
        Vehicle.countDocuments({ isActive: true }),
        Vehicle.countDocuments(),
        Driver.countDocuments(),
        Enquiry.find().sort({ createdAt: -1 }).limit(5),
        Booking.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
        Booking.countDocuments(),
        Booking.countDocuments({ status: "Pending" }),
        Booking.countDocuments({ status: "Completed" }),
      ]);

    res.json({
      success: true,
      data: {
        totalEnquiries,
        newEnquiries,
        activeServices,
        activeVehicles,
        totalVehicles,
        totalDrivers,
        todaysBookings,
        totalBookings,
        pendingBookings,
        completedBookings,
        recentEnquiries,
      },
    });
  })
);
export default router;
