import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination } from "../utils/pagination.js";
import { toCsv, sendCsv, dateStampedFilename } from "../utils/csv.js";
import { getTrustedVehicleQuote } from "../utils/vehicleQuote.js";
import { sendBookingAdminNotification } from "../services/emailService.js";
import {
  assertValidTimeFields,
  assertValidMobile,
  assertValidEmailIfProvided,
  assertValidBookingDates,
  assertValidPassengers,
  parseCalendarDate,
} from "../utils/bookingValidation.js";

function assertValidTimes(body) {
  assertValidTimeFields(body, ["pickupTime", "returnTime"]);
}

const PRICING_FIELDS = [
  "basePrice",
  "driverCharges",
  "extraCharges",
  "discount",
  "tax",
  "totalAmount",
  "originalTotalAmount",
  "totalOverridden",
  "pricingSnapshot",
];

function stripPricingFields(body) {
  const clean = { ...body };
  PRICING_FIELDS.forEach((key) => delete clean[key]);
  return clean;
}

function assertValidPricingInputs(body) {
  [
    "basePrice",
    "driverCharges",
    "extraCharges",
    "discount",
    "tax",
    "totalAmount",
  ].forEach((key) => {
    if (body[key] === undefined) return;
    const value = Number(body[key]);
    if (!Number.isFinite(value) || value < 0) {
      throw new ApiError(400, `${key} must be a valid non-negative number.`);
    }
  });
}

function buildBookingFilter({ status, search }) {
  const filter = {};
  if (status) filter.status = String(status);
  if (search) {
    const term = String(search).trim();
    if (term) {
      const regex = new RegExp(
        term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [
        { customerName: regex },
        { customerPhone: regex },
        { customerEmail: regex },
        { bookingCode: regex },
      ];
    }
  }
  return filter;
}

export const listBookings = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildBookingFilter({ status, search });
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("vehicle", "name")
      .populate("driver", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: bookings,
    pagination: { total, page, limit },
  });
});

const BOOKING_CSV_COLUMNS = [
  { key: "bookingCode", label: "Booking ID" },
  { key: "customerName", label: "Customer Name" },
  { key: "customerEmail", label: "Customer Email" },
  { key: "customerPhone", label: "Customer Phone" },
  { key: "vehicleName", label: "Vehicle" },
  { key: "pickupLocation", label: "Pickup Location" },
  { key: "dropLocation", label: "Drop Location" },
  { key: "bookingType", label: "Booking Type" },
  { key: "pickupDate", label: "Pickup Date" },
  { key: "pickupTime", label: "Pickup Time" },
  { key: "returnDate", label: "Return Date" },
  { key: "returnTime", label: "Return Time" },
  { key: "status", label: "Booking Status" },
  { key: "basePrice", label: "Price" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "createdAt", label: "Created At" },
];

function formatCsvDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatCsvDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export const exportBookingsCsv = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = buildBookingFilter({ status, search });

  const bookings = await Booking.find(filter)
    .populate("vehicle", "name")
    .sort({ createdAt: -1 })
    .lean();

  const rows = bookings.map((b) => ({
    bookingCode: b.bookingCode || "",
    customerName: b.customerName || "",
    customerEmail: b.customerEmail || "",
    customerPhone: b.customerPhone || "",
    vehicleName: b.vehicle?.name?.en || "",
    pickupLocation: b.pickupLocation || "",
    dropLocation: b.dropLocation || "",
    bookingType: b.bookingType || "",
    pickupDate: formatCsvDate(b.travelDate),
    pickupTime: b.pickupTime || "",
    returnDate: formatCsvDate(b.returnDate),
    returnTime: b.returnTime || "",
    status: b.status || "",
    basePrice: b.basePrice ?? 0,
    totalAmount: b.totalAmount ?? 0,
    paymentStatus: b.paymentStatus || "",
    createdAt: formatCsvDateTime(b.createdAt),
  }));

  const csv = toCsv(BOOKING_CSV_COLUMNS, rows);
  sendCsv(res, dateStampedFilename("shivam-bookings"), csv);
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("vehicle")
    .populate("driver");
  if (!booking) throw new ApiError(404, "Booking not found.");
  res.json({ success: true, data: booking });
});

export const createBooking = asyncHandler(async (req, res) => {
  assertValidTimes(req.body);

  if (req.body.vehicle) {
    await getTrustedVehicleQuote(req.body.vehicle, { requireAvailable: false });
  }

  const booking = await Booking.create({
    ...req.body,
    source: "admin",
    history: [
      {
        action: "Booking Created",
        performedBy: req.admin?.name || "Admin",
        remarks: "Booking created by admin.",
      },
    ],
  });
  res
    .status(201)
    .json({ success: true, data: booking, message: "Booking created." });
});

const PUBLIC_BOOKING_FIELDS = [
  "customerName",
  "customerPhone",
  "customerEmail",
  "pickupLocation",
  "dropLocation",
  "tripType",
  "bookingType",
  "pickupDate",
  "pickupTime",
  "returnDate",
  "returnTime",
  "passengers",
  "luggage",
  "vehicle",
  "specialNotes",
];

function pickAllowed(body, fields) {
  const clean = {};
  fields.forEach((key) => {
    if (body[key] !== undefined) clean[key] = body[key];
  });
  return clean;
}

export const createPublicBooking = asyncHandler(async (req, res) => {
  const payload = pickAllowed(req.body, PUBLIC_BOOKING_FIELDS);

  if (!payload.customerName || !String(payload.customerName).trim()) {
    throw new ApiError(400, "Name is required.");
  }
  assertValidMobile(payload.customerPhone);
  assertValidEmailIfProvided(payload.customerEmail);
  assertValidTimeFields(payload, ["pickupTime", "returnTime"]);

  const bookingType =
    payload.bookingType === "Round Trip" ? "Round Trip" : "One Way";
  const pickupDate = parseCalendarDate(payload.pickupDate);
  const returnDate =
    bookingType === "Round Trip" ? parseCalendarDate(payload.returnDate) : null;

  assertValidBookingDates({
    pickupDate,
    pickupTime: payload.pickupTime,
    bookingType,
    returnDate,
    returnTime: payload.returnTime,
  });

  const passengers = assertValidPassengers(payload.passengers);

  const { vehicle, pricing, breakdown } = await getTrustedVehicleQuote(
    payload.vehicle,
    {
      requireAvailable: true,
      tripType: payload.tripType,
    },
  );

  const booking = await Booking.create({
    customerName: String(payload.customerName).trim(),
    customerPhone: String(payload.customerPhone).trim(),
    customerEmail: payload.customerEmail
      ? String(payload.customerEmail).trim()
      : "",
    pickupLocation: payload.pickupLocation
      ? String(payload.pickupLocation).trim()
      : "",
    dropLocation: payload.dropLocation
      ? String(payload.dropLocation).trim()
      : "",
    tripType: payload.tripType || "Other",
    bookingType,
    travelDate: pickupDate,
    pickupTime: payload.pickupTime || "",
    returnDate,
    returnTime: bookingType === "Round Trip" ? payload.returnTime || "" : "",
    passengers,
    luggage: payload.luggage ? String(payload.luggage).trim() : "",
    vehicle: vehicle?._id || undefined,
    specialNotes: payload.specialNotes
      ? String(payload.specialNotes).trim()
      : "",
    status: "Pending",
    paymentStatus: "Pending",
    source: "public_booking_form",
    basePrice: breakdown?.basePrice || 0,
    driverCharges: breakdown?.driverCharges || 0,
    extraCharges: breakdown?.extraCharges || 0,
    discount: breakdown?.discount || 0,
    tax: breakdown?.tax || 0,
    totalAmount: breakdown?.totalAmount || 0,
    originalTotalAmount: breakdown?.totalAmount || 0,
    pricingSnapshot: breakdown?.calculationDetails || null,
    history: [
      {
        action: "Booking Created",
        performedBy: "Customer",
        remarks: `Submitted via public booking form.${
          !pricing
            ? " (No active pricing configured for this vehicle yet — total is an estimate.)"
            : ""
        }`,
      },
    ],
  });

  notifyAdminOfBooking(booking, vehicle);

  res.status(201).json({
    success: true,
    data: booking,
    message:
      "Thank you! Your booking request has been received. Our team will contact you shortly to confirm.",
  });
});

function notifyAdminOfBooking(booking, vehicle) {
  const payload = vehicle ? { ...booking.toObject(), vehicle } : booking;
  sendBookingAdminNotification(payload).catch((err) => {
    console.error(
      `[Email] Failed to send booking admin notification for ${booking.bookingCode || booking._id}:`,
      err.message,
    );
  });
}

export const getBookingQuote = asyncHandler(async (req, res) => {
  const { vehicle, tripType, distanceKm, durationHours } = req.query;

  if (!vehicle) {
    return res.json({ success: true, data: null });
  }

  const { pricing, breakdown } = await getTrustedVehicleQuote(vehicle, {
    requireAvailable: false,
    tripType: tripType || undefined,
    distanceKm: distanceKm !== undefined ? Number(distanceKm) : undefined,
    durationHours:
      durationHours !== undefined ? Number(durationHours) : undefined,
  });

  res.json({
    success: true,
    data: {
      chargeType: pricing?.chargeType || breakdown?.chargeType || null,
      rate: pricing?.rate ?? null,
      hasPricing: Boolean(pricing),
      ...breakdown,
    },
  });
});

const FIELD_LABELS = {
  status: "Booking status",
  paymentStatus: "Payment status",
  paymentMethod: "Payment method",
  vehicle: "Vehicle",
  driver: "Driver",
  travelDate: "Pickup date",
  pickupTime: "Pickup time",
  returnDate: "Return date",
  returnTime: "Return time",
  bookingType: "Booking type",
  tripType: "Trip type",
  pickupLocation: "Pickup location",
  dropLocation: "Drop location",
  passengers: "Passengers",
  luggage: "Luggage",
  customerName: "Customer name",
  customerPhone: "Customer phone",
  customerEmail: "Customer email",
  specialNotes: "Special notes",
};

const DATE_FIELDS = new Set(["travelDate", "returnDate"]);
const REF_FIELDS = new Set(["vehicle", "driver"]);

function formatDateForHistory(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
}

function normalizeForCompare(field, value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (DATE_FIELDS.has(field)) {
    const parsed = value instanceof Date ? value : parseCalendarDate(value);
    return parsed ? parsed.getTime() : null;
  }
  if (REF_FIELDS.has(field)) {
    return String(value);
  }
  return typeof value === "string" ? value.trim() : value;
}

async function buildChangeHistory(
  oldBooking,
  updates,
  performedBy,
  displayResolvers = {},
) {
  const entries = [];

  for (const field of Object.keys(FIELD_LABELS)) {
    if (!(field in updates)) continue;

    const before = normalizeForCompare(field, oldBooking[field]);
    const after = normalizeForCompare(field, updates[field]);
    if (before === after) continue;
    if (
      (before === null || before === undefined) &&
      (after === null || after === undefined)
    )
      continue;

    const label = FIELD_LABELS[field];
    let fromDisplay;
    let toDisplay;

    if (DATE_FIELDS.has(field)) {
      fromDisplay = formatDateForHistory(oldBooking[field]);
      toDisplay = formatDateForHistory(updates[field]);
    } else if (REF_FIELDS.has(field) && displayResolvers[field]) {
      fromDisplay = await displayResolvers[field](oldBooking[field]);
      toDisplay = await displayResolvers[field](updates[field]);
    } else {
      fromDisplay =
        oldBooking[field] === undefined ||
        oldBooking[field] === null ||
        oldBooking[field] === ""
          ? "—"
          : String(oldBooking[field]);
      toDisplay =
        updates[field] === undefined ||
        updates[field] === null ||
        updates[field] === ""
          ? "—"
          : String(updates[field]);
    }

    if (field === "status") {
      entries.push({
        action: `Status changed to ${updates[field]}`,
        performedBy,
        remarks: `From: ${fromDisplay} → To: ${toDisplay}`,
      });
    } else if (field === "paymentStatus") {
      entries.push({
        action: `Payment status changed to ${updates[field]}`,
        performedBy,
        remarks: `From: ${fromDisplay} → To: ${toDisplay}`,
      });
    } else if (field === "vehicle") {
      entries.push({
        action: "Vehicle assigned",
        performedBy,
        remarks: `From: ${fromDisplay} → To: ${toDisplay}`,
      });
    } else if (field === "driver") {
      entries.push({
        action: "Driver assigned",
        performedBy,
        remarks: `From: ${fromDisplay} → To: ${toDisplay}`,
      });
    } else {
      entries.push({
        action: `${label} updated`,
        performedBy,
        remarks: `From: ${fromDisplay} → To: ${toDisplay}`,
      });
    }
  }

  return entries;
}

async function resolveVehicleName(id) {
  if (!id) return "Unassigned";
  if (!mongoose.isValidObjectId(id)) return "Unassigned";
  const vehicle = await Vehicle.findById(id).select("name").lean();
  return vehicle?.name?.en || vehicle?.name || "Unknown vehicle";
}

async function resolveDriverName(id) {
  if (!id) return "Unassigned";
  if (!mongoose.isValidObjectId(id)) return "Unassigned";
  const driver = await Driver.findById(id).select("name").lean();
  return driver?.name || "Unknown driver";
}

export const updateBooking = asyncHandler(async (req, res) => {
  assertValidTimeFields(req.body, ["pickupTime", "returnTime"]);

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found.");

  const updates = stripPricingFields(req.body);

  delete updates.history;
  delete updates.performedBy;
  delete updates.bookingCode;
  delete updates.createdAt;
  delete updates.updatedAt;
  delete updates._id;

  if ("pickupDate" in updates || "travelDate" in updates) {
    const raw =
      updates.travelDate !== undefined
        ? updates.travelDate
        : updates.pickupDate;
    updates.travelDate = parseCalendarDate(raw);
    delete updates.pickupDate;
  }
  if ("returnDate" in updates) {
    updates.returnDate = parseCalendarDate(updates.returnDate);
  }

  if (updates.passengers !== undefined) {
    updates.passengers = assertValidPassengers(updates.passengers, { max: 50 });
  }

  const effectiveBookingType =
    updates.bookingType || booking.bookingType || "One Way";
  const effectivePickupDate =
    "travelDate" in updates ? updates.travelDate : booking.travelDate;
  const effectivePickupTime =
    "pickupTime" in updates ? updates.pickupTime : booking.pickupTime;
  const effectiveReturnDate =
    "returnDate" in updates ? updates.returnDate : booking.returnDate;
  const effectiveReturnTime =
    "returnTime" in updates ? updates.returnTime : booking.returnTime;

  if (effectivePickupDate) {
    assertValidBookingDates({
      pickupDate: effectivePickupDate,
      pickupTime: effectivePickupTime,
      bookingType: effectiveBookingType,
      returnDate: effectiveReturnDate,
      returnTime: effectiveReturnTime,
      allowPastForAdminEdit: true,
    });
  }

  if (updates.vehicle) {
    if (!mongoose.isValidObjectId(updates.vehicle))
      throw new ApiError(400, "Invalid vehicle selected.");
    const vehicleExists = await Vehicle.exists({ _id: updates.vehicle });
    if (!vehicleExists)
      throw new ApiError(400, "Selected vehicle could not be found.");
  }
  if (updates.driver) {
    if (!mongoose.isValidObjectId(updates.driver))
      throw new ApiError(400, "Invalid driver selected.");
    const driverExists = await Driver.exists({ _id: updates.driver });
    if (!driverExists)
      throw new ApiError(400, "Selected driver could not be found.");
  }

  const performedBy = req.admin?.name || "Admin";
  const historyEntries = await buildChangeHistory(
    booking.toObject(),
    updates,
    performedBy,
    {
      vehicle: resolveVehicleName,
      driver: resolveDriverName,
    },
  );

  Object.assign(booking, updates);
  if (historyEntries.length > 0) {
    booking.history.push(...historyEntries);
  }

  await booking.save();
  const populated = await Booking.findById(booking._id)
    .populate("vehicle")
    .populate("driver");
  res.json({ success: true, data: populated, message: "Booking updated." });
});

export const updateBookingPricing = asyncHandler(async (req, res) => {
  assertValidPricingInputs(req.body);

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found.");

  const next = {
    basePrice:
      req.body.basePrice !== undefined
        ? Number(req.body.basePrice)
        : booking.basePrice,
    driverCharges:
      req.body.driverCharges !== undefined
        ? Number(req.body.driverCharges)
        : booking.driverCharges,
    extraCharges:
      req.body.extraCharges !== undefined
        ? Number(req.body.extraCharges)
        : booking.extraCharges,
    discount:
      req.body.discount !== undefined
        ? Number(req.body.discount)
        : booking.discount,
    tax: req.body.tax !== undefined ? Number(req.body.tax) : booking.tax,
  };

  const computedTotal = Math.max(
    0,
    next.basePrice +
      next.driverCharges +
      next.extraCharges +
      next.tax -
      next.discount,
  );

  const manualOverride = req.body.manualTotal === true;
  if (
    manualOverride &&
    (req.body.totalAmount === undefined || req.body.totalAmount === null)
  ) {
    throw new ApiError(
      400,
      "totalAmount is required when manualTotal is true.",
    );
  }
  const finalTotal = manualOverride
    ? Number(req.body.totalAmount)
    : computedTotal;

  const nothingChanged =
    next.basePrice === booking.basePrice &&
    next.driverCharges === booking.driverCharges &&
    next.extraCharges === booking.extraCharges &&
    next.discount === booking.discount &&
    next.tax === booking.tax &&
    finalTotal === booking.totalAmount &&
    manualOverride === booking.totalOverridden;

  if (
    booking.originalTotalAmount === null ||
    booking.originalTotalAmount === undefined
  ) {
    booking.originalTotalAmount = booking.totalAmount || 0;
  }

  const previousTotal = booking.totalAmount || 0;

  booking.basePrice = next.basePrice;
  booking.driverCharges = next.driverCharges;
  booking.extraCharges = next.extraCharges;
  booking.discount = next.discount;
  booking.tax = next.tax;
  booking.totalAmount = finalTotal;
  booking.totalOverridden = manualOverride;

  if (!nothingChanged) {
    booking.history.push({
      action: "Pricing updated",
      performedBy: req.admin?.name || "Admin",
      remarks: manualOverride
        ? `Total manually set to ₹${finalTotal} (was ₹${previousTotal}).`
        : `Total recalculated to ₹${finalTotal} (was ₹${previousTotal}).`,
    });
  }

  await booking.save();
  res.json({
    success: true,
    data: booking,
    message: "Booking pricing updated.",
  });
});
