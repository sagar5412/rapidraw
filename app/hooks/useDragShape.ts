import { useState, useCallback, RefObject, useRef } from "react";
import { Shape } from "@/app/types/Shapes";
import { screenToWorld } from "@/app/utils/coordinates";
import { isPointInShape } from "@/app/utils/checkPoint";
import { RedrawCanvas } from "@/app/components/canvas/RedrawCanvas";

interface UseDragShapeReturn {
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent<HTMLCanvasElement>) => boolean;
  handleDragMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleDragEnd: () => void;
  getDraggedShape: () => Shape | null;
}

export function useDragShape(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  shapes: Shape[],
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  selectedShapeId: string | null,
  setSelectedShapeId: (id: string | null) => void,
  offset: { x: number; y: number },
  scale: number
): UseDragShapeReturn {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const originalShapeRef = useRef<Shape | null>(null);
  const draggedShapeIdRef = useRef<string | null>(null);
  const currentOffsetRef = useRef({ dx: 0, dy: 0 });

  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): boolean => {
      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);

      const clickedShape = shapes.find((shape) =>
        isPointInShape(shape, worldPos.x, worldPos.y)
      );

      if (clickedShape) {
        setIsDragging(true);
        dragStartRef.current = { x: worldPos.x, y: worldPos.y };
        draggedShapeIdRef.current = clickedShape.id;
        originalShapeRef.current = { ...clickedShape }; // Store original position
        currentOffsetRef.current = { dx: 0, dy: 0 };
        setSelectedShapeId(clickedShape.id);
        return true;
      }

      setSelectedShapeId(null);
      return false;
    },
    [shapes, offset, scale, setSelectedShapeId]
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !draggedShapeIdRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      const dx = worldPos.x - dragStartRef.current.x;
      const dy = worldPos.y - dragStartRef.current.y;

      // Store current offset for later use
      currentOffsetRef.current = { dx, dy };

      // Update shapes locally (this triggers re-render but doesn't add to history)
      // We need to update the shapes array directly for visual feedback
      setShapes((prevShapes) =>
        prevShapes.map((shape) => {
          if (
            shape.id !== draggedShapeIdRef.current ||
            !originalShapeRef.current
          )
            return shape;

          const original = originalShapeRef.current;

          if (shape.type === "line" || shape.type === "arrow") {
            const origLine = original as typeof shape;
            return {
              ...shape,
              x1: origLine.x1 + dx,
              y1: origLine.y1 + dy,
              x2: origLine.x2 + dx,
              y2: origLine.y2 + dy,
            };
          }

          if (shape.type === "freehand") {
            const origFreehand = original as typeof shape;
            return {
              ...shape,
              points: origFreehand.points.map((p) => ({
                x: p.x + dx,
                y: p.y + dy,
              })),
            };
          }

          const origShape = original as { x: number; y: number };
          return {
            ...shape,
            x: origShape.x + dx,
            y: origShape.y + dy,
          };
        })
      );
    },
    [isDragging, canvasRef, offset, scale, setShapes]
  );

  const handleDragEnd = useCallback(() => {
    // Only record to history if there was actual movement
    if (
      isDragging &&
      originalShapeRef.current &&
      (currentOffsetRef.current.dx !== 0 || currentOffsetRef.current.dy !== 0)
    ) {
      // The final position is already set in setShapes during handleDragMove
      // Since we used the original position as reference, the history will have
      // the correct start and end states
    }

    setIsDragging(false);
    draggedShapeIdRef.current = null;
    originalShapeRef.current = null;
    currentOffsetRef.current = { dx: 0, dy: 0 };
  }, [isDragging]);

  // Helper to get current dragged shape for rendering
  const getDraggedShape = useCallback((): Shape | null => {
    if (!isDragging || !draggedShapeIdRef.current) return null;
    return shapes.find((s) => s.id === draggedShapeIdRef.current) || null;
  }, [isDragging, shapes]);

  return {
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    getDraggedShape,
  };
}
