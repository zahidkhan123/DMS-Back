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

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware
app.use(cors());
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

    // Sync models (use migrations in production)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: false });
    }

    httpServer.listen(PORT, () => {
      // Server started
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();

export default app;

