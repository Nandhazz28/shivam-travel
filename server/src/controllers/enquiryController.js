import Enquiry from "../models/Enquiry.js";
import Booking from "../models/Booking.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination } from "../utils/pagination.js";
import { toCsv, sendCsv, dateStampedFilename } from "../utils/csv.js";
import { getTrustedVehicleQuote } from "../utils/vehicleQuote.js";
import { sendEnquiryAdminNotification } from "../services/emailService.js";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const PUBLIC_ENQUIRY_FIELDS = [
  "name",
  "mobile",
  "email",
  "tripType",
  "pickupLocation",
  "dropLocation",
  "pickupDate",
  "pickupTime",
  "vehicle",
  "service",
  "passengers",
  "luggage",
  "message",
  "source",
];

function pickAllowed(body, fields) {
  const clean = {};
  fields.forEach((key) => {
    if (body[key] !== undefined) clean[key] = body[key];
  });
  return clean;
}

export const createEnquiry = asyncHandler(async (req, res) => {
  const { name, mobile } = req.body;
  if (!name || !mobile) {
    throw new ApiError(400, "Name and mobile number are required.");
  }
  if (!/^[\d+\-\s()]{7,15}$/.test(mobile)) {
    throw new ApiError(400, "Please enter a valid mobile number.");
  }
  if (req.body.pickupTime && !TIME_RE.test(req.body.pickupTime)) {
    throw new ApiError(400, "pickupTime must be in 24-hour HH:MM format.");
  }

  const payload = pickAllowed(req.body, PUBLIC_ENQUIRY_FIELDS);

  const { estimatedTotal } = await getTrustedVehicleQuote(payload.vehicle, {
    requireAvailable: true,
  });
  payload.estimatedTotal = estimatedTotal;

  const enquiry = await Enquiry.create(payload);

  notifyAdminOfEnquiry(enquiry);

  res.status(201).json({
    success: true,
    data: enquiry,
    message:
      "Thank you! We have received your enquiry and will contact you shortly.",
  });
});

function notifyAdminOfEnquiry(enquiry) {
  Enquiry.findById(enquiry._id)
    .populate("vehicle", "name")
    .populate("service", "name")
    .lean()
    .then((populated) => sendEnquiryAdminNotification(populated || enquiry))
    .catch((err) => {
      console.error(
        `[Email] Failed to send enquiry admin notification for ${enquiry._id}:`,
        err.message,
      );
    });
}

function buildEnquiryFilter({ status, source, search }) {
  const filter = {};
  if (status) filter.status = String(status);
  if (source) filter.source = String(source);
  if (search) filter.$text = { $search: String(search) };
  return filter;
}

export const listEnquiries = asyncHandler(async (req, res) => {
  const { status, source, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildEnquiryFilter({ status, source, search });

  const [enquiries, total] = await Promise.all([
    Enquiry.find(filter)
      .populate("vehicle", "name")
      .populate("service", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Enquiry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: enquiries,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

export const getEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id)
    .populate("vehicle")
    .populate("service");
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");
  res.json({ success: true, data: enquiry });
});

export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    "New",
    "Contacted",
    "Confirmed",
    "Completed",
    "Cancelled",
  ];
  if (!validStatuses.includes(status))
    throw new ApiError(400, "Invalid status value.");

  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");

  res.json({
    success: true,
    data: enquiry,
    message: "Enquiry status updated.",
  });
});

const ENQUIRY_CSV_COLUMNS = [
  { key: "id", label: "Enquiry ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Phone" },
  { key: "tripType", label: "Trip Type" },
  { key: "message", label: "Message" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" },
];

function formatCsvDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export const exportEnquiriesCsv = asyncHandler(async (req, res) => {
  const { status, source, search } = req.query;
  const filter = buildEnquiryFilter({ status, source, search });

  const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 }).lean();

  const rows = enquiries.map((e) => ({
    id: String(e._id),
    name: e.name || "",
    email: e.email || "",
    mobile: e.mobile || "",
    tripType: e.tripType || "",
    message: e.message || "",
    status: e.status || "",
    createdAt: formatCsvDateTime(e.createdAt),
    updatedAt: formatCsvDateTime(e.updatedAt),
  }));

  const csv = toCsv(ENQUIRY_CSV_COLUMNS, rows);
  sendCsv(res, dateStampedFilename("shivam-enquiries"), csv);
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");
  res.json({ success: true, message: "Enquiry deleted." });
});

export const convertEnquiryToBooking = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");

  const existingBooking = await Booking.findOne({ sourceEnquiry: enquiry._id });
  if (existingBooking) {
    return res.json({
      success: true,
      data: existingBooking,
      message: "This enquiry was already converted to a booking.",
      alreadyConverted: true,
    });
  }

  const allowUnavailableOverride = req.body?.allowUnavailableOverride === true;
  const { vehicle, estimatedTotal } = await getTrustedVehicleQuote(
    enquiry.vehicle,
    {
      requireAvailable: !allowUnavailableOverride,
    },
  );

  const booking = await Booking.create({
    sourceEnquiry: enquiry._id,
    customerName: enquiry.name,
    customerPhone: enquiry.mobile,
    customerEmail: enquiry.email,
    pickupLocation: enquiry.pickupLocation,
    dropLocation: enquiry.dropLocation,
    travelDate: enquiry.pickupDate,
    pickupTime: enquiry.pickupTime,
    passengers: enquiry.passengers,
    luggage: enquiry.luggage,
    vehicle: vehicle?._id || undefined,
    specialNotes: enquiry.message,
    status: "Pending",
    basePrice: estimatedTotal,
    totalAmount: estimatedTotal,
    originalTotalAmount: estimatedTotal,
    history: [
      {
        action: "Booking Created",
        performedBy: req.admin?.name || "Admin",
        remarks: `Converted from enquiry submitted ${new Date(enquiry.createdAt).toLocaleDateString()}.${
          allowUnavailableOverride && vehicle && vehicle.status !== "Available"
            ? " (Vehicle availability override applied by admin.)"
            : ""
        }`,
      },
    ],
  });

  if (enquiry.status === "New" || enquiry.status === "Contacted") {
    enquiry.status = "Confirmed";
    await enquiry.save();
  }

  res
    .status(201)
    .json({
      success: true,
      data: booking,
      message: "Booking created from enquiry.",
    });
});
