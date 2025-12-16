import { Shape } from "../app/types/Shapes";
import { CollaborationUser, RoomState } from "../app/types/WebSocket";

interface Room {
  id: string;
  users: Map<string, CollaborationUser>;
  shapes: Shape[];
  createdAt: Date;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  createRoom(roomId: string, hostUser: CollaborationUser): Room {
    // Cancel any pending cleanup timer
    this.cancelCleanupTimer(roomId);

    const room: Room = {
      id: roomId,
      users: new Map([[hostUser.id, hostUser]]),
      shapes: [],
      createdAt: new Date(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, user: CollaborationUser): Room | null {
    // Cancel any pending cleanup timer when someone joins
    this.cancelCleanupTimer(roomId);

    const room = this.rooms.get(roomId);
    if (!room) {
      // Create room if it doesn't exist
      return this.createRoom(roomId, user);
    }
    room.users.set(user.id, user);
    return room;
  }

  leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.users.delete(userId);

    // Schedule cleanup for empty rooms
    if (room.users.size === 0) {
      this.scheduleCleanup(roomId);
    }
  }

  private scheduleCleanup(roomId: string): void {
    // Cancel existing timer if any
    this.cancelCleanupTimer(roomId);

    // Schedule new cleanup
    const timer = setTimeout(() => {
      const currentRoom = this.rooms.get(roomId);
      if (currentRoom && currentRoom.users.size === 0) {
        this.rooms.delete(roomId);
        this.cleanupTimers.delete(roomId);
      }
    }, 60000); // Keep room for 1 minute after last user leaves

    this.cleanupTimers.set(roomId, timer);
  }

  private cancelCleanupTimer(roomId: string): void {
    const timer = this.cleanupTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(roomId);
    }
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  getRoomState(roomId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      roomId: room.id,
      users: Array.from(room.users.values()),
      shapes: room.shapes,
    };
  }

  updateUserCursor(
    roomId: string,
    userId: string,
    cursor: { x: number; y: number }
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(userId);
    if (user) {
      user.cursor = cursor;
    }
  }

  addShape(roomId: string, shape: Shape): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Check if shape already exists (prevent duplicates)
    const existingIndex = room.shapes.findIndex((s) => s.id === shape.id);
    if (existingIndex === -1) {
      room.shapes.push(shape);
    }
  }

  updateShape(roomId: string, shapeId: string, updates: Partial<Shape>): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const shapeIndex = room.shapes.findIndex((s) => s.id === shapeId);
    if (shapeIndex !== -1) {
      room.shapes[shapeIndex] = {
        ...room.shapes[shapeIndex],
        ...updates,
      } as Shape;
    }
  }

  deleteShape(roomId: string, shapeId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.shapes = room.shapes.filter((s) => s.id !== shapeId);
  }

  syncShapes(roomId: string, shapes: Shape[]): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.shapes = shapes;
  }

  getUser(roomId: string, userId: string): CollaborationUser | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.users.get(userId) || null;
  }
}

// Singleton instance
export const roomManager = new RoomManager();
