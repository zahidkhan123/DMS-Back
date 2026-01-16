import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import sequelize from "./config/database.js";
import { initializeSocket } from "./services/socketService.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { runMigrations } from "./utils/runMigrations.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware
// CORS configuration - allow frontend from Vercel and localhost
const allowedOrigins = [
  "https://dms-front-xi.vercel.app",
  "http://localhost:3001",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", ""),
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow all origins for easier testing
        if (process.env.NODE_ENV === "development") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware (must be after all routes)
app.use(errorMiddleware);

// Database connection
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    // Run migrations in production, sync models in development
    if (process.env.NODE_ENV === "production") {
      await runMigrations();
    } else {
      await sequelize.sync({ alter: false });
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;

