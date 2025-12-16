import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RoomManager } from "../lib/roomManager";
import { CollaborationUser } from "../app/types/WebSocket";

describe("RoomManager", () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createTestUser = (id: string): CollaborationUser => ({
    id,
    name: `User ${id}`,
    color: "#FF0000",
  });

  describe("createRoom", () => {
    it("should create a new room with the host user", () => {
      const user = createTestUser("user-1");
      const room = roomManager.createRoom("room-1", user);

      expect(room).not.toBeNull();
      expect(room.id).toBe("room-1");
      expect(room.users.size).toBe(1);
      expect(room.users.get("user-1")).toEqual(user);
      expect(room.shapes).toEqual([]);
    });
  });

  describe("joinRoom", () => {
    it("should create room if it does not exist", () => {
      const user = createTestUser("user-1");
      const room = roomManager.joinRoom("room-1", user);

      expect(room).not.toBeNull();
      expect(room?.id).toBe("room-1");
      expect(room?.users.size).toBe(1);
    });

    it("should add user to existing room", () => {
      const user1 = createTestUser("user-1");
      const user2 = createTestUser("user-2");

      roomManager.createRoom("room-1", user1);
      const room = roomManager.joinRoom("room-1", user2);

      expect(room?.users.size).toBe(2);
      expect(room?.users.get("user-1")).toBeDefined();
      expect(room?.users.get("user-2")).toBeDefined();
    });
  });

  describe("leaveRoom", () => {
    it("should remove user from room", () => {
      const user = createTestUser("user-1");
      roomManager.createRoom("room-1", user);
      roomManager.leaveRoom("room-1", "user-1");

      const state = roomManager.getRoomState("room-1");
      expect(state?.users.length).toBe(0);
    });

    it("should schedule cleanup when room becomes empty", () => {
      const user = createTestUser("user-1");
      roomManager.createRoom("room-1", user);
      roomManager.leaveRoom("room-1", "user-1");

      // Room should still exist before timeout
      expect(roomManager.getRoom("room-1")).not.toBeNull();

      // Advance timer past cleanup delay
      vi.advanceTimersByTime(61000);

      // Room should be deleted
      expect(roomManager.getRoom("room-1")).toBeNull();
    });

    it("should cancel cleanup when user rejoins", () => {
      const user1 = createTestUser("user-1");
      const user2 = createTestUser("user-2");

      roomManager.createRoom("room-1", user1);
      roomManager.leaveRoom("room-1", "user-1");

      // Advance timer partially
      vi.advanceTimersByTime(30000);

      // User 2 joins before cleanup
      roomManager.joinRoom("room-1", user2);

      // Advance timer past original cleanup time
      vi.advanceTimersByTime(31000);

      // Room should still exist because user rejoined
      expect(roomManager.getRoom("room-1")).not.toBeNull();
      expect(roomManager.getRoomState("room-1")?.users.length).toBe(1);
    });
  });

  describe("getRoomState", () => {
    it("should return null for non-existent room", () => {
      expect(roomManager.getRoomState("non-existent")).toBeNull();
    });

    it("should return room state", () => {
      const user = createTestUser("user-1");
      roomManager.createRoom("room-1", user);

      const state = roomManager.getRoomState("room-1");
      expect(state).toEqual({
        roomId: "room-1",
        users: [user],
        shapes: [],
      });
    });
  });

  describe("shape operations", () => {
    beforeEach(() => {
      const user = createTestUser("user-1");
      roomManager.createRoom("room-1", user);
    });

    it("should add shape", () => {
      const shape = {
        id: "shape-1",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: "#000",
      };
      roomManager.addShape("room-1", shape as any);

      const state = roomManager.getRoomState("room-1");
      expect(state?.shapes.length).toBe(1);
      expect(state?.shapes[0].id).toBe("shape-1");
    });

    it("should not add duplicate shapes", () => {
      const shape = {
        id: "shape-1",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: "#000",
      };
      roomManager.addShape("room-1", shape as any);
      roomManager.addShape("room-1", shape as any);

      const state = roomManager.getRoomState("room-1");
      expect(state?.shapes.length).toBe(1);
    });

    it("should update shape", () => {
      const shape = {
        id: "shape-1",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: "#000",
      };
      roomManager.addShape("room-1", shape as any);
      roomManager.updateShape("room-1", "shape-1", { x: 50, y: 50 });

      const state = roomManager.getRoomState("room-1");
      expect(state?.shapes[0]).toMatchObject({ x: 50, y: 50 });
    });

    it("should delete shape", () => {
      const shape = {
        id: "shape-1",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: "#000",
      };
      roomManager.addShape("room-1", shape as any);
      roomManager.deleteShape("room-1", "shape-1");

      const state = roomManager.getRoomState("room-1");
      expect(state?.shapes.length).toBe(0);
    });
  });
});
