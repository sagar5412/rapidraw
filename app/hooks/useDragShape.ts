import { useState, useCallback, RefObject } from "react";
import { Shape } from "@/app/types/Shapes";
import { screenToWorld } from "@/app/utils/coordinates";
import { isPointInShape } from "@/app/utils/checkPoint";
import { RedrawCanvas } from "@/app/components/canvas/RedrawCanvas";

interface UseDragShapeReturn {
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent<HTMLCanvasElement>) => boolean;
  handleDragMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleDragEnd: () => void;
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): boolean => {
      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);

      const clickedShape = shapes.find((shape) =>
        isPointInShape(shape, worldPos.x, worldPos.y)
      );

      if (clickedShape) {
        setIsDragging(true);
        setDragStart({ x: worldPos.x, y: worldPos.y });
        setDraggedShapeId(clickedShape.id);
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
      if (!isDragging || !draggedShapeId) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      const dx = worldPos.x - dragStart.x;
      const dy = worldPos.y - dragStart.y;

      setShapes((prevShapes) =>
        prevShapes.map((shape) => {
          if (shape.id !== draggedShapeId) return shape;

          if (shape.type === "line") {
            return {
              ...shape,
              x1: shape.x1 + dx,
              y1: shape.y1 + dy,
              x2: shape.x2 + dx,
              y2: shape.y2 + dy,
            };
          }

          return {
            ...shape,
            x: shape.x + dx,
            y: shape.y + dy,
          };
        })
      );

      setDragStart({ x: worldPos.x, y: worldPos.y });
    },
    [isDragging, draggedShapeId, canvasRef, offset, scale, dragStart, setShapes]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedShapeId(null);
  }, []);

  return {
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
