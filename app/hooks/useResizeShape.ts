import { useState, useCallback, RefObject } from "react";
import { Shape } from "@/app/types/Shapes";
import { screenToWorld } from "@/app/utils/coordinates";

export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "w"
  | "e"
  | "sw"
  | "s"
  | "se"
  | "start"
  | "end" // for line/arrow endpoints
  | null;

const HANDLE_SIZE = 8;

interface UseResizeShapeReturn {
  isResizing: boolean;
  activeHandle: ResizeHandle;
  handleResizeStart: (
    e: React.MouseEvent<HTMLCanvasElement>,
    shape: Shape
  ) => ResizeHandle;
  handleResizeMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleResizeEnd: () => void;
  getResizeHandles: (
    shape: Shape
  ) => { handle: ResizeHandle; x: number; y: number }[];
  getCursorForHandle: (handle: ResizeHandle) => string;
}

export function useResizeShape(
  shapes: Shape[],
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  selectedShapeId: string | null,
  offset: { x: number; y: number },
  scale: number
): UseResizeShapeReturn {
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [originalShape, setOriginalShape] = useState<Shape | null>(null);

  const getResizeHandles = useCallback(
    (shape: Shape): { handle: ResizeHandle; x: number; y: number }[] => {
      const handles: { handle: ResizeHandle; x: number; y: number }[] = [];
      const hs = HANDLE_SIZE / 2;

      if (
        shape.type === "rectangle" ||
        shape.type === "diamond" ||
        shape.type === "textbox"
      ) {
        const { x, y, width, height } = shape;
        handles.push(
          { handle: "nw", x: x, y: y },
          { handle: "n", x: x + width / 2, y: y },
          { handle: "ne", x: x + width, y: y },
          { handle: "w", x: x, y: y + height / 2 },
          { handle: "e", x: x + width, y: y + height / 2 },
          { handle: "sw", x: x, y: y + height },
          { handle: "s", x: x + width / 2, y: y + height },
          { handle: "se", x: x + width, y: y + height }
        );
      } else if (shape.type === "circle") {
        const { x, y, radius } = shape;
        const cx = x + radius;
        const cy = y + radius;
        handles.push(
          { handle: "nw", x: x, y: y },
          { handle: "ne", x: x + radius * 2, y: y },
          { handle: "sw", x: x, y: y + radius * 2 },
          { handle: "se", x: x + radius * 2, y: y + radius * 2 }
        );
      } else if (shape.type === "line" || shape.type === "arrow") {
        handles.push(
          { handle: "start", x: shape.x1, y: shape.y1 },
          { handle: "end", x: shape.x2, y: shape.y2 }
        );
      } else if (shape.type === "freehand" && shape.points.length > 0) {
        // Calculate bounding box for freehand
        const xs = shape.points.map((p) => p.x);
        const ys = shape.points.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const width = maxX - minX;
        const height = maxY - minY;

        handles.push(
          { handle: "nw", x: minX, y: minY },
          { handle: "ne", x: maxX, y: minY },
          { handle: "sw", x: minX, y: maxY },
          { handle: "se", x: maxX, y: maxY }
        );
      }

      return handles;
    },
    []
  );

  const hitTestHandle = useCallback(
    (worldX: number, worldY: number, shape: Shape): ResizeHandle => {
      const handles = getResizeHandles(shape);
      const hitRadius = HANDLE_SIZE / scale;

      for (const { handle, x, y } of handles) {
        if (
          Math.abs(worldX - x) <= hitRadius &&
          Math.abs(worldY - y) <= hitRadius
        ) {
          return handle;
        }
      }
      return null;
    },
    [getResizeHandles, scale]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>, shape: Shape): ResizeHandle => {
      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      const handle = hitTestHandle(worldPos.x, worldPos.y, shape);

      if (handle) {
        setIsResizing(true);
        setActiveHandle(handle);
        setResizeStart({ x: worldPos.x, y: worldPos.y });
        setOriginalShape({ ...shape });
        return handle;
      }
      return null;
    },
    [offset, scale, hitTestHandle]
  );

  const handleResizeMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isResizing || !activeHandle || !originalShape || !selectedShapeId)
        return;

      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      const dx = worldPos.x - resizeStart.x;
      const dy = worldPos.y - resizeStart.y;

      setShapes((prevShapes) =>
        prevShapes.map((shape) => {
          if (shape.id !== selectedShapeId) return shape;

          if (
            shape.type === "rectangle" ||
            shape.type === "diamond" ||
            shape.type === "textbox"
          ) {
            const orig = originalShape as typeof shape;
            let newX = orig.x;
            let newY = orig.y;
            let newWidth = orig.width;
            let newHeight = orig.height;

            switch (activeHandle) {
              case "nw":
                newX = orig.x + dx;
                newY = orig.y + dy;
                newWidth = orig.width - dx;
                newHeight = orig.height - dy;
                break;
              case "n":
                newY = orig.y + dy;
                newHeight = orig.height - dy;
                break;
              case "ne":
                newY = orig.y + dy;
                newWidth = orig.width + dx;
                newHeight = orig.height - dy;
                break;
              case "w":
                newX = orig.x + dx;
                newWidth = orig.width - dx;
                break;
              case "e":
                newWidth = orig.width + dx;
                break;
              case "sw":
                newX = orig.x + dx;
                newWidth = orig.width - dx;
                newHeight = orig.height + dy;
                break;
              case "s":
                newHeight = orig.height + dy;
                break;
              case "se":
                newWidth = orig.width + dx;
                newHeight = orig.height + dy;
                break;
            }

            // Ensure minimum size
            if (newWidth < 10) {
              newWidth = 10;
              if (activeHandle?.includes("w")) newX = orig.x + orig.width - 10;
            }
            if (newHeight < 10) {
              newHeight = 10;
              if (activeHandle?.includes("n")) newY = orig.y + orig.height - 10;
            }

            // Scale fontSize for textbox based on height ratio
            if (shape.type === "textbox" && originalShape.type === "textbox") {
              const heightRatio = newHeight / originalShape.height;
              const newFontSize = Math.max(
                8,
                Math.round(originalShape.fontSize * heightRatio)
              );
              return {
                ...shape,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
                fontSize: newFontSize,
              };
            }

            return {
              ...shape,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
            };
          }

          if (shape.type === "circle") {
            const orig = originalShape as typeof shape;
            let newX = orig.x;
            let newY = orig.y;
            let newRadius = orig.radius;

            const diagonal = Math.sqrt(dx * dx + dy * dy);
            const sign = dx + dy > 0 ? 1 : -1;

            switch (activeHandle) {
              case "se":
                newRadius = Math.max(10, orig.radius + (dx + dy) / 2);
                break;
              case "nw":
                newRadius = Math.max(10, orig.radius - (dx + dy) / 2);
                newX = orig.x + orig.radius - newRadius;
                newY = orig.y + orig.radius - newRadius;
                break;
              case "ne":
                newRadius = Math.max(10, orig.radius + (dx - dy) / 2);
                newY = orig.y + orig.radius - newRadius;
                break;
              case "sw":
                newRadius = Math.max(10, orig.radius + (-dx + dy) / 2);
                newX = orig.x + orig.radius - newRadius;
                break;
            }

            return { ...shape, x: newX, y: newY, radius: newRadius };
          }

          if (shape.type === "line" || shape.type === "arrow") {
            const orig = originalShape as typeof shape;
            if (activeHandle === "start") {
              return { ...shape, x1: orig.x1 + dx, y1: orig.y1 + dy };
            } else if (activeHandle === "end") {
              return { ...shape, x2: orig.x2 + dx, y2: orig.y2 + dy };
            }
          }

          if (shape.type === "freehand" && originalShape.type === "freehand") {
            const orig = originalShape;
            if (orig.points.length === 0) return shape;

            // Calculate original bounding box
            const xs = orig.points.map((p) => p.x);
            const ys = orig.points.map((p) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const origWidth = maxX - minX || 1;
            const origHeight = maxY - minY || 1;

            // Calculate new bounding box based on handle
            let newMinX = minX;
            let newMinY = minY;
            let newMaxX = maxX;
            let newMaxY = maxY;

            switch (activeHandle) {
              case "nw":
                newMinX = minX + dx;
                newMinY = minY + dy;
                break;
              case "ne":
                newMaxX = maxX + dx;
                newMinY = minY + dy;
                break;
              case "sw":
                newMinX = minX + dx;
                newMaxY = maxY + dy;
                break;
              case "se":
                newMaxX = maxX + dx;
                newMaxY = maxY + dy;
                break;
            }

            const newWidth = Math.max(10, newMaxX - newMinX);
            const newHeight = Math.max(10, newMaxY - newMinY);
            const scaleX = newWidth / origWidth;
            const scaleY = newHeight / origHeight;

            // Scale all points
            const newPoints = orig.points.map((p) => ({
              x: newMinX + (p.x - minX) * scaleX,
              y: newMinY + (p.y - minY) * scaleY,
            }));

            return { ...shape, points: newPoints };
          }

          return shape;
        })
      );
    },
    [
      isResizing,
      activeHandle,
      originalShape,
      selectedShapeId,
      offset,
      scale,
      resizeStart,
      setShapes,
    ]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setActiveHandle(null);
    setOriginalShape(null);
  }, []);

  const getCursorForHandle = useCallback((handle: ResizeHandle): string => {
    switch (handle) {
      case "nw":
      case "se":
        return "nwse-resize";
      case "ne":
      case "sw":
        return "nesw-resize";
      case "n":
      case "s":
        return "ns-resize";
      case "e":
      case "w":
        return "ew-resize";
      case "start":
      case "end":
        return "nwse-resize";
      default:
        return "default";
    }
  }, []);

  return {
    isResizing,
    activeHandle,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    getResizeHandles,
    getCursorForHandle,
  };
}
