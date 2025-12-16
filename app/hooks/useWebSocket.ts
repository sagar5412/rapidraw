"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CollaborationUser,
  RoomState,
} from "@/app/types/WebSocket";
import { Shape } from "@/app/types/Shapes";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseWebSocketReturn {
  socket: TypedSocket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  roomId: string | null;
  users: CollaborationUser[];
  localUser: CollaborationUser | null;
  joinRoom: (roomId: string, user: CollaborationUser) => void;
  leaveRoom: () => void;
  emitCursorMove: (cursor: { x: number; y: number }) => void;
  emitShapeAdd: (shape: Shape) => void;
  emitShapeUpdate: (shapeId: string, updates: Partial<Shape>) => void;
  emitShapeDelete: (shapeId: string) => void;
  emitShapesSync: (shapes: Shape[]) => void;
}

interface UseWebSocketOptions {
  onRoomState?: (state: RoomState) => void;
  onUserJoined?: (user: CollaborationUser) => void;
  onUserLeft?: (userId: string) => void;
  onCursorUpdate?: (data: {
    userId: string;
    cursor: { x: number; y: number };
  }) => void;
  onShapeAdded?: (shape: Shape) => void;
  onShapeUpdated?: (data: { shapeId: string; updates: Partial<Shape> }) => void;
  onShapeDeleted?: (shapeId: string) => void;
  onShapesSynced?: (shapes: Shape[]) => void;
  onConnectionError?: (error: string) => void;
}

export function useWebSocket(
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [localUser, setLocalUser] = useState<CollaborationUser | null>(null);

  // Store options in refs to avoid effect dependencies
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Get WebSocket server URL from environment or use relative path for local dev
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "";
    const wsPath = wsUrl ? "/socket.io" : "/api/socket";

    console.log("Connecting to WebSocket:", wsUrl || "local", "path:", wsPath);

    // Initialize socket connection
    const socket: TypedSocket = io(wsUrl, {
      path: wsPath,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setIsConnected(false);
      setRoomId(null);
      setUsers([]);
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
      setConnectionError(error.message);
      setIsConnected(false);
      optionsRef.current.onConnectionError?.(error.message);
    });

    // Handle server-sent errors
    socket.on("error", (message: string) => {
      console.error("WebSocket server error:", message);
      setConnectionError(message);
      optionsRef.current.onConnectionError?.(message);
    });

    // Handle reconnection attempts
    socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`WebSocket reconnection attempt ${attempt}`);
      setIsReconnecting(true);
      setConnectionError(`Reconnecting... (attempt ${attempt})`);
    });

    socket.io.on("reconnect", () => {
      console.log("WebSocket reconnected");
      setIsReconnecting(false);
      setConnectionError(null);
    });

    socket.io.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed after all attempts");
      setIsReconnecting(false);
      setConnectionError(
        "Connection failed. Please check your network and try again."
      );
    });

    socket.on("room_state", (state: RoomState) => {
      console.log("Received room state:", state);
      setRoomId(state.roomId);
      setUsers(state.users);
      optionsRef.current.onRoomState?.(state);
    });

    socket.on("user_joined", (user: CollaborationUser) => {
      console.log("User joined:", user);
      setUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
      optionsRef.current.onUserJoined?.(user);
    });

    socket.on("user_left", (userId: string) => {
      console.log("User left:", userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      optionsRef.current.onUserLeft?.(userId);
    });

    socket.on("cursor_update", (data) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, cursor: data.cursor } : u
        )
      );
      optionsRef.current.onCursorUpdate?.(data);
    });

    socket.on("shape_added", (shape: Shape) => {
      optionsRef.current.onShapeAdded?.(shape);
    });

    socket.on("shape_updated", (data) => {
      optionsRef.current.onShapeUpdated?.(data);
    });

    socket.on("shape_deleted", (shapeId: string) => {
      optionsRef.current.onShapeDeleted?.(shapeId);
    });

    socket.on("shapes_synced", (shapes: Shape[]) => {
      optionsRef.current.onShapesSynced?.(shapes);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinRoom = useCallback((newRoomId: string, user: CollaborationUser) => {
    if (socketRef.current && socketRef.current.connected) {
      setLocalUser(user);
      socketRef.current.emit("join_room", { roomId: newRoomId, user });
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (socketRef.current && roomId) {
      socketRef.current.emit("leave_room", { roomId });
      setRoomId(null);
      setUsers([]);
      setLocalUser(null);
    }
  }, [roomId]);

  const emitCursorMove = useCallback(
    (cursor: { x: number; y: number }) => {
      if (socketRef.current && roomId) {
        socketRef.current.emit("cursor_move", { roomId, cursor });
      }
    },
    [roomId]
  );

  const emitShapeAdd = useCallback(
    (shape: Shape) => {
      if (socketRef.current && roomId) {
        socketRef.current.emit("shape_add", { roomId, shape });
      }
    },
    [roomId]
  );

  const emitShapeUpdate = useCallback(
    (shapeId: string, updates: Partial<Shape>) => {
      if (socketRef.current && roomId) {
        socketRef.current.emit("shape_update", { roomId, shapeId, updates });
      }
    },
    [roomId]
  );

  const emitShapeDelete = useCallback(
    (shapeId: string) => {
      if (socketRef.current && roomId) {
        socketRef.current.emit("shape_delete", { roomId, shapeId });
      }
    },
    [roomId]
  );

  const emitShapesSync = useCallback(
    (shapes: Shape[]) => {
      if (socketRef.current && roomId) {
        socketRef.current.emit("shapes_sync", { roomId, shapes });
      }
    },
    [roomId]
  );

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    connectionError,
    roomId,
    users,
    localUser,
    joinRoom,
    leaveRoom,
    emitCursorMove,
    emitShapeAdd,
    emitShapeUpdate,
    emitShapeDelete,
    emitShapesSync,
  };
}
