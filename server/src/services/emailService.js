import nodemailer from "nodemailer";

export const isEmailConfigured = Boolean(
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.SMTP_HOST,
);

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    family: 4,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Fail fast with a clear, categorized error instead of hanging until nodemailer's
    // much longer internal default — this is what turns an opaque "ETIMEDOUT command:
    // CONN" in the logs into something verifyEmailConnection() below can report cleanly.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
  return transporter;
}

/**
 * Startup-only diagnostic: logs safe (non-secret) SMTP configuration presence and, in the
 * background, verifies connectivity once. This is what turns a silent "Connection timeout"
 * buried in a later booking notification into something visible in the Render boot logs.
 * Never blocks server startup and never logs credential values.
 */
export function logEmailStartupDiagnostics() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";

  console.log(
    `[Email] SMTP_HOST: ${host ? "configured" : "missing"}, ` +
      `SMTP_PORT: ${process.env.SMTP_PORT ? `configured (${port})` : `not set, defaulting to ${port}`}, ` +
      `SMTP_USER: ${process.env.SMTP_USER ? "configured" : "missing"}, ` +
      `SMTP_PASS: ${process.env.SMTP_PASS ? "configured" : "missing"}, ` +
      `secure(TLS): ${secure}`,
  );

  if (!isEmailConfigured) {
    console.warn(
      "[Email] SMTP is not fully configured — booking/enquiry admin notifications and " +
        "OTP emails will not be sent until SMTP_HOST, SMTP_USER and SMTP_PASS are set.",
    );
    return;
  }

  console.log("[Email] Testing SMTP connectivity...");
  verifyEmailConnection()
    .then((result) => {
      if (result.result === "OK") {
        console.log("[Email] SMTP connection verified successfully");
      } else {
        console.error(
          `[Email] SMTP verification failed: ${result.message}`,
        );
      }
    })
    .catch((err) => {
      console.error(
        `[Email] SMTP verification failed: ${err.message}`,
      );
    });
}

/**
 * Admin-only diagnostic: checks the SMTP connection without sending an email. Never
 * returns the password — only configuration presence, host/port/secure mode, and a
 * categorized result so an ETIMEDOUT/EAUTH/self-signed-cert failure in production can be
 * told apart from "not configured at all" without needing raw Render logs.
 */
export async function verifyEmailConnection() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";
  const adminEmailConfigured = Boolean(process.env.ADMIN_EMAIL);

  if (!isEmailConfigured) {
    return {
      configured: false,
      adminEmailConfigured,
      host,
      port,
      secure,
      result: "NOT_CONFIGURED",
      message: "SMTP_HOST, SMTP_USER or SMTP_PASS is missing.",
    };
  }

  try {
    await getTransporter().verify();
    return {
      configured: true,
      adminEmailConfigured,
      host,
      port,
      secure,
      result: "OK",
      message: "SMTP connection and authentication verified successfully.",
    };
  } catch (err) {
    // Categorize the common cases so the report is actionable rather than a raw stack.
    const code = err?.code || "UNKNOWN";
    let message = err?.message || "SMTP verification failed.";
    if (code === "ETIMEDOUT" || code === "ESOCKET") {
      message =
        "Connection to the SMTP host timed out. This usually means the host/port is " +
        "unreachable from the server's network (e.g. the hosting provider blocks the " +
        "outbound port, or the host/port value is wrong) — not an application bug.";
    } else if (code === "EAUTH") {
      message =
        "SMTP authentication failed. Check SMTP_USER/SMTP_PASS (make sure the Brevo SMTP key, not your account password, is used).";
    } else if (code === "ECONNECTION" || code === "ECONNREFUSED") {
      message =
        "Could not connect to the SMTP host/port. Check SMTP_HOST and SMTP_PORT.";
    }
    return {
      configured: true,
      adminEmailConfigured,
      host,
      port,
      secure,
      result: code,
      message,
    };
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Only retry failures that happened while establishing the connection (before any message
// data was sent to the server) — nodemailer/smtp-connection tags these with command "CONN".
// Retrying here can't create a duplicate send, since the server never received anything.
const RETRYABLE_CODES = new Set([
  "ETIMEDOUT",
  "ESOCKET",
  "ECONNECTION",
  "ECONNREFUSED",
  "EDNS",
]);
const MAX_SEND_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1_500;

function isRetryableConnectionError(err) {
  return err?.command === "CONN" && RETRYABLE_CODES.has(err?.code);
}

export async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured) {
    const err = new Error(
      "Email sending is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS " +
        "in server/.env to enable password-reset and notification emails.",
    );
    err.statusCode = 503;
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const fromAddress = `"Shivam Travels" <${process.env.MAIL_FROM}>`;

  let lastError;
  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    try {
      return await getTransporter().sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });
    } catch (err) {
      lastError = err;
      const willRetry =
        attempt < MAX_SEND_ATTEMPTS && isRetryableConnectionError(err);
      if (!willRetry) break;
      console.warn(
        `[Email] SMTP connection attempt ${attempt} failed (${err.code}); retrying in ${RETRY_DELAY_MS}ms...`,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderInfoRows(rows) {
  return rows
    .filter(
      (row) =>
        row.value !== undefined && row.value !== null && row.value !== "",
    )
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 12px; border-bottom:1px solid #F3F4F6; color:#6B7280; font-size:13px; white-space:nowrap; vertical-align:top;">${escapeHtml(
            row.label,
          )}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #F3F4F6; color:#111827; font-size:13px; vertical-align:top;">${escapeHtml(
            row.value,
          )}</td>
        </tr>`,
    )
    .join("");
}

function adminNotificationTemplate({ heading, intro, rows }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto;">
      <h2 style="color:#DC2626; margin-bottom:4px;">${escapeHtml(heading)}</h2>
      <p style="color:#374151; margin-top:0;">${escapeHtml(intro)}</p>
      <table style="width:100%; border-collapse:collapse; margin-top:12px;">
        <tbody>
          ${renderInfoRows(rows)}
        </tbody>
      </table>
      <p style="color:#9CA3AF; font-size:12px; margin-top:24px;">This is an automated notification from the Shivam Travels website.</p>
    </div>
  `;
}

export async function sendBookingAdminNotification(booking) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    const err = new Error(
      "ADMIN_EMAIL is not configured; booking notification email was not sent.",
    );
    err.code = "ADMIN_EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const vehicleName =
    (booking.vehicle && (booking.vehicle.name?.en || booking.vehicle.name)) ||
    undefined;

  const html = adminNotificationTemplate({
    heading: "New Booking Received — Shivam Travels",
    intro: "A new booking has been submitted on the website.",
    rows: [
      { label: "Booking ID", value: String(booking._id || "") },
      { label: "Booking code", value: booking.bookingCode },
      { label: "Customer name", value: booking.customerName },
      { label: "Customer phone", value: booking.customerPhone },
      { label: "Customer email", value: booking.customerEmail },
      { label: "Trip type", value: booking.tripType },
      { label: "Booking type", value: booking.bookingType },
      { label: "Pickup date", value: formatDate(booking.travelDate) },
      { label: "Pickup time", value: booking.pickupTime },
      {
        label: "Return date",
        value: booking.returnDate ? formatDate(booking.returnDate) : undefined,
      },
      { label: "Return time", value: booking.returnTime },
      { label: "Pickup location", value: booking.pickupLocation },
      { label: "Drop location", value: booking.dropLocation },
      { label: "Passengers", value: booking.passengers },
      { label: "Luggage", value: booking.luggage },
      { label: "Vehicle", value: vehicleName },
      { label: "Special requirements", value: booking.specialNotes },
      { label: "Estimated amount", value: formatCurrency(booking.basePrice) },
      { label: "Total amount", value: formatCurrency(booking.totalAmount) },
      { label: "Booking status", value: booking.status },
      { label: "Created at", value: formatDateTime(booking.createdAt) },
    ],
  });

  return sendEmail({
    to: adminEmail,
    subject: `New Booking Received — Shivam Travels${booking.bookingCode ? ` (${booking.bookingCode})` : ""}`,
    html,
  });
}

export async function sendEnquiryAdminNotification(enquiry) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    const err = new Error(
      "ADMIN_EMAIL is not configured; enquiry notification email was not sent.",
    );
    err.code = "ADMIN_EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const vehicleName =
    (enquiry.vehicle && (enquiry.vehicle.name?.en || enquiry.vehicle.name)) ||
    undefined;
  const serviceName =
    (enquiry.service && (enquiry.service.name?.en || enquiry.service.name)) ||
    undefined;

  const html = adminNotificationTemplate({
    heading: "New Enquiry Received — Shivam Travels",
    intro: "A new enquiry has been submitted on the website.",
    rows: [
      { label: "Enquiry ID", value: String(enquiry._id || "") },
      { label: "Customer name", value: enquiry.name },
      { label: "Phone", value: enquiry.mobile },
      { label: "Email", value: enquiry.email },
      { label: "Trip type", value: enquiry.tripType },
      { label: "Pickup location", value: enquiry.pickupLocation },
      { label: "Drop location", value: enquiry.dropLocation },
      {
        label: "Pickup date",
        value: enquiry.pickupDate ? formatDate(enquiry.pickupDate) : undefined,
      },
      { label: "Pickup time", value: enquiry.pickupTime },
      { label: "Vehicle", value: vehicleName },
      { label: "Service", value: serviceName },
      { label: "Passengers", value: enquiry.passengers },
      { label: "Luggage", value: enquiry.luggage },
      { label: "Message", value: enquiry.message },
      {
        label: "Estimated amount",
        value: enquiry.estimatedTotal
          ? formatCurrency(enquiry.estimatedTotal)
          : undefined,
      },
      { label: "Enquiry status", value: enquiry.status },
      { label: "Submitted at", value: formatDateTime(enquiry.createdAt) },
    ],
  });

  return sendEmail({
    to: adminEmail,
    subject: "New Enquiry Received — Shivam Travels",
    html,
  });
}

export function otpEmailTemplate({ name, otp }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#DC2626;">Shivam Travels — Admin Panel</h2>
      <p>Hi ${name || "there"},</p>
      <p>Use the verification code below to reset your admin password. This code expires in 10 minutes and can only be used once.</p>
      <div style="text-align:center; margin: 28px 0;">
        <span style="display:inline-block; font-size:32px; letter-spacing:8px; font-weight:bold; background:#FEF2F2; color:#DC2626; padding:16px 24px; border-radius:10px;">
          ${otp}
        </span>
      </div>
      <p>If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
      <p style="color:#9CA3AF; font-size:12px;">Never share this code with anyone, including Shivam Travels staff.</p>
    </div>
  `;
}
