import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import { initRedis, closeRedisClient } from "./config/redis.js";
import { logEmailStartupDiagnostics } from "./services/emailService.js";
import { globalSafetyLimiter } from "./middleware/rateLimiters.js";
import { clientIdentityMiddleware } from "./middleware/clientIdentity.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import pricingRoutes from "./routes/pricingRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import diagnosticsRoutes from "./routes/diagnosticsRoutes.js";

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `[CONFIG ERROR] Missing required environment variable(s): ${missingEnv.join(", ")}. ` +
      "Copy server/.env.example to server/.env and fill these in before starting the server.",
  );
  process.exit(1);
}

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);

  process.exit(1);
});

const app = express();

const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS);
app.set(
  "trust proxy",
  Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1,
);


const normalizeOrigin = (origin) =>
  origin ? origin.trim().replace(/\/+$/, "") : null;

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.ALLOWED_ORIGINS || "").split(","),
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173"]
    : []),
]
  .map(normalizeOrigin)
  .filter(Boolean)
  .filter((origin, index, self) => self.indexOf(origin) === index);

if (allowedOrigins.length === 0) {
  console.error(
    "[CONFIG ERROR] No CORS origins configured. Set CLIENT_URL or ALLOWED_ORIGINS.",
  );
  process.exit(1);
}

console.log(
  `[CORS Config] ${process.env.NODE_ENV === "production" ? "Production" : "Development"} mode: allowed origins = ${allowedOrigins.join(", ")}`,
);


const resolveBackendOrigin = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.BACKEND_URL || "https://shivam-travels.onrender.com";
  }
  return process.env.BACKEND_URL || "http://localhost:5000";
};

const backendOrigin = resolveBackendOrigin();

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: [
                "'self'",
                "data:",
                "https://res.cloudinary.com",
                "https://images.unsplash.com",
              ],
              scriptSrc: ["'self'"],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
              ],
              fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
              connectSrc: ["'self'", backendOrigin].filter(Boolean),
            },
          }
        : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);


app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedIncoming = normalizeOrigin(origin);

      if (allowedOrigins.includes(normalizedIncoming)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(clientIdentityMiddleware);
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use((req, res, next) => {
  req.setTimeout(30_000, () => {
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: "Request timed out. Please try again.",
      });
    }
  });
  next();
});

app.use("/api", globalSafetyLimiter);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Shivam Travels API is running." });
});

app.use("/api/auth/admin", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/diagnostics", diagnosticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    if (process.env.REDIS_URL) {
      await initRedis();
    } else {
      console.warn(
        "[Server] REDIS_URL is not set. Rate limiting will use a per-instance " +
          "in-memory fallback. Set REDIS_URL before running multiple backend " +
          "instances in production.",
      );
    }

    const server = app.listen(PORT, () => {
      console.log(`[Server] Shivam Travels API running on port ${PORT}`);
      console.log(
        `[Server] Allowed CORS origins: ${allowedOrigins.join(", ")}`,
      );
      console.log(`[Server] Helmet CSP connect-src includes: ${backendOrigin}`);
      // Non-blocking: logs safe SMTP config presence and verifies connectivity once so a
      // Connection timeout shows up in boot logs instead of only surfacing later on a
      // real booking/enquiry notification.
      logEmailStartupDiagnostics();
    });

    const shutdown = (signal) => {
      console.log(`[Server] ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        try {
          const mongoose = (await import("mongoose")).default;
          await mongoose.connection.close();
        } catch (err) {
          console.error(
            "[Server] Error closing MongoDB connection:",
            err.message,
          );
        }
        try {
          await closeRedisClient();
        } catch (err) {
          console.error(
            "[Server] Error closing Redis connection:",
            err.message,
          );
        } finally {
          process.exit(0);
        }
      });

      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("[Server] Failed to start:", err.message);
    console.error("Make sure MONGO_URI is set correctly in server/.env ");
    process.exit(1);
  }
}

start();

export default app;
