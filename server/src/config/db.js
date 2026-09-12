import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "[CONFIG ERROR] MONGO_URI is not set. Copy server/.env.example to server/.env and set MONGO_URI.",
    );

    throw new Error("MONGO_URI is not configured");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,

      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 2,

      socketTimeoutMS: 45000,
    });

    console.log(`[MongoDB] Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err.message);
    throw err;
  }

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected");
  });
}
