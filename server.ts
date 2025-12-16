import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./app/types/WebSocket";
import { roomManager } from "./lib/roomManager";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Configure CORS origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || "*";

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    {},
    SocketData
  >(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Initialize socket data
    socket.data.userId = socket.id;
    socket.data.roomId = null;
    socket.data.user = null;

    // Handle joining a room
    socket.on("join_room", ({ roomId, user }) => {
      console.log(`User ${user.name} joining room ${roomId}`);

      // Leave previous room if any
      if (socket.data.roomId) {
        socket.leave(socket.data.roomId);
        roomManager.leaveRoom(socket.data.roomId, socket.data.userId);
        io.to(socket.data.roomId).emit("user_left", socket.data.userId);
      }

      // Update socket data
      socket.data.roomId = roomId;
      socket.data.user = { ...user, id: socket.id };

      // Join the room
      const room = roomManager.joinRoom(roomId, socket.data.user);
      socket.join(roomId);

      // Send room state to the joining user
      const roomState = roomManager.getRoomState(roomId);
      if (roomState) {
        socket.emit("room_state", roomState);
      }

      // Notify others in the room
      socket.to(roomId).emit("user_joined", socket.data.user);
    });

    // Handle leaving a room
    socket.on("leave_room", ({ roomId }) => {
      if (socket.data.roomId === roomId) {
        socket.leave(roomId);
        roomManager.leaveRoom(roomId, socket.data.userId);
        socket.to(roomId).emit("user_left", socket.data.userId);
        socket.data.roomId = null;
        socket.data.user = null;
      }
    });

    // Handle cursor movement
    socket.on("cursor_move", ({ roomId, cursor }) => {
      if (socket.data.roomId === roomId) {
        roomManager.updateUserCursor(roomId, socket.data.userId, cursor);
        socket.to(roomId).emit("cursor_update", {
          userId: socket.data.userId,
          cursor,
        });
      }
    });

    // Handle shape addition
    socket.on("shape_add", ({ roomId, shape }) => {
      if (socket.data.roomId === roomId) {
        roomManager.addShape(roomId, shape);
        socket.to(roomId).emit("shape_added", shape);
      }
    });

    // Handle shape update
    socket.on("shape_update", ({ roomId, shapeId, updates }) => {
      if (socket.data.roomId === roomId) {
        roomManager.updateShape(roomId, shapeId, updates);
        socket.to(roomId).emit("shape_updated", { shapeId, updates });
      }
    });

    // Handle shape deletion
    socket.on("shape_delete", ({ roomId, shapeId }) => {
      if (socket.data.roomId === roomId) {
        roomManager.deleteShape(roomId, shapeId);
        socket.to(roomId).emit("shape_deleted", shapeId);
      }
    });

    // Handle full shapes sync
    socket.on("shapes_sync", ({ roomId, shapes }) => {
      if (socket.data.roomId === roomId) {
        roomManager.syncShapes(roomId, shapes);
        socket.to(roomId).emit("shapes_synced", shapes);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (socket.data.roomId) {
        roomManager.leaveRoom(socket.data.roomId, socket.data.userId);
        io.to(socket.data.roomId).emit("user_left", socket.data.userId);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(
      `> WebSocket server ready on ws://${hostname}:${port}/api/socket`
    );
  });
});
