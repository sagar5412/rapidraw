// WebSocket types and message protocols for real-time collaboration

import { Shape } from "./Shapes";

// User representation for collaboration
export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

// Room state shared between all clients
export interface RoomState {
  roomId: string;
  users: CollaborationUser[];
  shapes: Shape[];
}

// Client -> Server Events
export interface ClientToServerEvents {
  join_room: (data: { roomId: string; user: CollaborationUser }) => void;
  leave_room: (data: { roomId: string }) => void;
  cursor_move: (data: {
    roomId: string;
    cursor: { x: number; y: number };
  }) => void;
  shape_add: (data: { roomId: string; shape: Shape }) => void;
  shape_update: (data: {
    roomId: string;
    shapeId: string;
    updates: Partial<Shape>;
  }) => void;
  shape_delete: (data: { roomId: string; shapeId: string }) => void;
  shapes_sync: (data: { roomId: string; shapes: Shape[] }) => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  room_state: (state: RoomState) => void;
  user_joined: (user: CollaborationUser) => void;
  user_left: (userId: string) => void;
  cursor_update: (data: {
    userId: string;
    cursor: { x: number; y: number };
  }) => void;
  shape_added: (shape: Shape) => void;
  shape_updated: (data: { shapeId: string; updates: Partial<Shape> }) => void;
  shape_deleted: (shapeId: string) => void;
  shapes_synced: (shapes: Shape[]) => void;
  error: (message: string) => void;
}

// Socket data stored on server
export interface SocketData {
  userId: string;
  roomId: string | null;
  user: CollaborationUser | null;
}

// Generate a random room ID
export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate a random user color
export function generateUserColor(): string {
  const colors = [
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#14B8A6", // teal
    "#3B82F6", // blue
    "#8B5CF6", // violet
    "#EC4899", // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Generate a random anonymous name
export function generateAnonymousName(): string {
  const adjectives = [
    "Swift",
    "Bright",
    "Clever",
    "Bold",
    "Quick",
    "Sharp",
    "Calm",
    "Wise",
  ];
  const nouns = [
    "Fox",
    "Eagle",
    "Wolf",
    "Bear",
    "Hawk",
    "Lion",
    "Tiger",
    "Owl",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}
