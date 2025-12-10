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

  createRoom(roomId: string, hostUser: CollaborationUser): Room {
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

    // Clean up empty rooms after a delay
    if (room.users.size === 0) {
      setTimeout(() => {
        const currentRoom = this.rooms.get(roomId);
        if (currentRoom && currentRoom.users.size === 0) {
          this.rooms.delete(roomId);
        }
      }, 60000); // Keep room for 1 minute after last user leaves
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
