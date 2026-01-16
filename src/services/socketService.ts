import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken } from "../utils/jwt.js";
import redis from "../config/redis.js";

let io: SocketIOServer;

export const initializeSocket = (httpServer: HTTPServer) => {
  // Socket.IO CORS configuration - match Express CORS
  const allowedOrigins = [
    "https://dms-front-xi.vercel.app",
    "http://localhost:3001",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", ""),
  ].filter(Boolean) as string[];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? allowedOrigins 
        : true, // Allow all in development
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Use default namespace with authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = verifyToken(token);
      (socket as any).userId = decoded.id;
      (socket as any).userType = decoded.user_type;

      // Store socket mapping in Redis
      try {
        await redis.setex(`socket:${socket.id}`, 7 * 24 * 60 * 60, decoded.id as string);
        await redis.sadd(`user:sockets:${decoded.id as string}`, socket.id as string);
        await redis.setex(`user:online:${decoded.id as string}`, 7 * 24 * 60 * 60, "true");
      } catch (error) {
        console.error("Redis socket mapping failed:", error);
      }

      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Emit connection status
    socket.emit("connection:status", { status: "connected", userId });

    // Emit user online event to all clients
    io.emit("user:online", { userId });

    // Handle reconnection
    socket.on("reconnect", () => {
      socket.emit("connection:status", { status: "reconnected", userId });
      console.log(`User ${userId} reconnected`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${userId}:`, error);
      socket.emit("connection:status", { status: "error", error: error.message });
    });

    socket.on("disconnect", async (reason) => {
      console.log(`User ${userId} disconnected: ${reason}`);
      try {
        await redis.del(`socket:${socket.id}`);
        await redis.srem(`user:sockets:${userId}`, socket.id);
        const remainingSockets = await redis.scard(`user:sockets:${userId}`);
        if (remainingSockets === 0) {
          await redis.del(`user:online:${userId}`);
          io.emit("user:offline", { userId });
        }
      } catch (error) {
        console.error("Redis cleanup failed:", error);
      }
    });
  });

  return io;
};

export const emitDocumentUploaded = async (document: any, userId: string) => {
  if (io) {
    // Emit to user-specific room only (no need to broadcast to all)
    io.to(`user:${userId}`).emit("document:uploaded", { document });
  }
};

export const emitDocumentUpdated = async (document: any, userId: string) => {
  if (io) {
    // Emit to user-specific room only (no need to broadcast to all)
    io.to(`user:${userId}`).emit("document:updated", { document });
  }
};

export const emitDocumentDeleted = async (documentId: string, userId: string) => {
  if (io) {
    // Emit to user-specific room only (no need to broadcast to all)
    io.to(`user:${userId}`).emit("document:deleted", { documentId });
  }
};

export const emitNotification = async (notification: any, userId: string) => {
  if (io) {
    io.to(`user:${userId}`).emit("notification:new", { notification });
  }
};

export const emitCategoryUpdated = async (category: any) => {
  if (io) {
    // Broadcast to all connected clients
    io.emit("category:updated", { category });
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

