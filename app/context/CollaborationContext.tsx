"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import {
  CollaborationUser,
  RoomState,
  generateRoomId,
  generateUserColor,
  generateAnonymousName,
} from "@/app/types/WebSocket";
import { Shape } from "@/app/types/Shapes";

interface CollaborationContextValue {
  // Connection state
  isConnected: boolean;
  isCollaborating: boolean;
  roomId: string | null;

  // Users
  users: CollaborationUser[];
  localUser: CollaborationUser | null;
  remoteCursors: Map<
    string,
    { x: number; y: number; color: string; name: string }
  >;

  // Room actions
  startSession: () => void;
  joinSession: (roomId: string) => void;
  leaveSession: () => void;

  // Shape sync
  emitShapeAdd: (shape: Shape) => void;
  emitShapeUpdate: (shapeId: string, updates: Partial<Shape>) => void;
  emitShapeDelete: (shapeId: string) => void;
  emitShapesSync: (shapes: Shape[]) => void;

  // Cursor sync
  emitCursorMove: (cursor: { x: number; y: number }) => void;

  // Shape sync handlers - to be set by Canvas
  setOnRemoteShapeAdd: (handler: ((shape: Shape) => void) | null) => void;
  setOnRemoteShapeUpdate: (
    handler: ((shapeId: string, updates: Partial<Shape>) => void) | null
  ) => void;
  setOnRemoteShapeDelete: (handler: ((shapeId: string) => void) | null) => void;
  setOnRemoteShapesSync: (handler: ((shapes: Shape[]) => void) | null) => void;
  setOnRoomState: (handler: ((state: RoomState) => void) | null) => void;
}

const CollaborationContext = createContext<CollaborationContextValue | null>(
  null
);

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      "useCollaboration must be used within CollaborationProvider"
    );
  }
  return context;
}

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export function CollaborationProvider({
  children,
}: CollaborationProviderProps) {
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<
    Map<string, { x: number; y: number; color: string; name: string }>
  >(new Map());

  // Refs for external handlers
  const onRemoteShapeAddRef = useRef<((shape: Shape) => void) | null>(null);
  const onRemoteShapeUpdateRef = useRef<
    ((shapeId: string, updates: Partial<Shape>) => void) | null
  >(null);
  const onRemoteShapeDeleteRef = useRef<((shapeId: string) => void) | null>(
    null
  );
  const onRemoteShapesSyncRef = useRef<((shapes: Shape[]) => void) | null>(
    null
  );
  const onRoomStateRef = useRef<((state: RoomState) => void) | null>(null);

  const {
    isConnected,
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
  } = useWebSocket({
    onRoomState: (state) => {
      setIsCollaborating(true);
      onRoomStateRef.current?.(state);
    },
    onUserJoined: (user) => {
      console.log(`${user.name} joined the session`);
    },
    onUserLeft: (userId) => {
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    },
    onCursorUpdate: ({ userId, cursor }) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setRemoteCursors((prev) => {
          const next = new Map(prev);
          next.set(userId, {
            x: cursor.x,
            y: cursor.y,
            color: user.color,
            name: user.name,
          });
          return next;
        });
      }
    },
    onShapeAdded: (shape) => {
      onRemoteShapeAddRef.current?.(shape);
    },
    onShapeUpdated: ({ shapeId, updates }) => {
      onRemoteShapeUpdateRef.current?.(shapeId, updates);
    },
    onShapeDeleted: (shapeId) => {
      onRemoteShapeDeleteRef.current?.(shapeId);
    },
    onShapesSynced: (shapes) => {
      onRemoteShapesSyncRef.current?.(shapes);
    },
  });

  const startSession = useCallback(() => {
    const newRoomId = generateRoomId();
    const user: CollaborationUser = {
      id: "", // Will be set by server
      name: generateAnonymousName(),
      color: generateUserColor(),
    };
    joinRoom(newRoomId, user);
  }, [joinRoom]);

  const joinSession = useCallback(
    (targetRoomId: string) => {
      const user: CollaborationUser = {
        id: "", // Will be set by server
        name: generateAnonymousName(),
        color: generateUserColor(),
      };
      joinRoom(targetRoomId.toUpperCase(), user);
    },
    [joinRoom]
  );

  const leaveSession = useCallback(() => {
    leaveRoom();
    setIsCollaborating(false);
    setRemoteCursors(new Map());
    // Remove room param from URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("room");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [leaveRoom]);

  // Auto-join room from URL parameter
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");

    if (roomParam && isConnected && !isCollaborating && !roomId) {
      // Auto-join the room from URL
      const user: CollaborationUser = {
        id: "",
        name: generateAnonymousName(),
        color: generateUserColor(),
      };
      joinRoom(roomParam.toUpperCase(), user);
    }
  }, [isConnected, isCollaborating, roomId, joinRoom]);

  // Handler setters
  const setOnRemoteShapeAdd = useCallback(
    (handler: ((shape: Shape) => void) | null) => {
      onRemoteShapeAddRef.current = handler;
    },
    []
  );

  const setOnRemoteShapeUpdate = useCallback(
    (handler: ((shapeId: string, updates: Partial<Shape>) => void) | null) => {
      onRemoteShapeUpdateRef.current = handler;
    },
    []
  );

  const setOnRemoteShapeDelete = useCallback(
    (handler: ((shapeId: string) => void) | null) => {
      onRemoteShapeDeleteRef.current = handler;
    },
    []
  );

  const setOnRemoteShapesSync = useCallback(
    (handler: ((shapes: Shape[]) => void) | null) => {
      onRemoteShapesSyncRef.current = handler;
    },
    []
  );

  const setOnRoomState = useCallback(
    (handler: ((state: RoomState) => void) | null) => {
      onRoomStateRef.current = handler;
    },
    []
  );

  const value: CollaborationContextValue = {
    isConnected,
    isCollaborating,
    roomId,
    users,
    localUser,
    remoteCursors,
    startSession,
    joinSession,
    leaveSession,
    emitShapeAdd,
    emitShapeUpdate,
    emitShapeDelete,
    emitShapesSync,
    emitCursorMove,
    setOnRemoteShapeAdd,
    setOnRemoteShapeUpdate,
    setOnRemoteShapeDelete,
    setOnRemoteShapesSync,
    setOnRoomState,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}
