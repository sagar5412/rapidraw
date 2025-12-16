import { describe, it, expect } from "vitest";
import {
  generateRoomId,
  generateUserColor,
  generateAnonymousName,
} from "../app/types/WebSocket";

describe("WebSocket Utilities", () => {
  describe("generateRoomId", () => {
    it("should generate a 6-character uppercase room ID", () => {
      const roomId = generateRoomId();
      expect(roomId).toHaveLength(6);
      expect(roomId).toMatch(/^[A-Z0-9]+$/);
    });

    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRoomId());
      }
      // Most should be unique (allowing for some collision in random)
      expect(ids.size).toBeGreaterThan(90);
    });
  });

  describe("generateUserColor", () => {
    it("should return a valid hex color", () => {
      const color = generateUserColor();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should return one of the predefined colors", () => {
      const validColors = [
        "#EF4444",
        "#F97316",
        "#EAB308",
        "#22C55E",
        "#14B8A6",
        "#3B82F6",
        "#8B5CF6",
        "#EC4899",
      ];
      const color = generateUserColor();
      expect(validColors).toContain(color);
    });
  });

  describe("generateAnonymousName", () => {
    it("should return a two-word name", () => {
      const name = generateAnonymousName();
      const words = name.split(" ");
      expect(words).toHaveLength(2);
    });

    it("should return a name with adjective and noun", () => {
      const name = generateAnonymousName();
      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    });
  });
});
