import React, { useState } from "react";
import { Shape, selectedShapes } from "@/app/types/Shapes";
import { screenToWorld } from "@/app/utils/coordinates";
import { isPointInShape } from "@/app/utils/checkPoint";

export function useEraser(
  shapes: Shape[],
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  offset: { x: number; y: number },
  scale: number,
  isCollaborating: boolean,
  emitShapeDelete: (id: string) => void
) {
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPath, setEraserPath] = useState<{ x: number; y: number }[]>([]);
  const [eraserHoverPos, setEraserHoverPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleEraserStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsErasing(true);
    setEraserPath([{ x: e.clientX, y: e.clientY }]);
  };

  const handleEraserMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isErasing) {
      setEraserPath((prev) => [...prev, { x: e.clientX, y: e.clientY }]);
      return;
    }
    setEraserHoverPos({ x: e.clientX, y: e.clientY });
  };

  const handleEraserEnd = () => {
    if (isErasing && eraserPath.length > 0) {
      const shapesToDelete = new Set<string>();

      // Check each point in the eraser path
      for (const point of eraserPath) {
        const worldPos = screenToWorld(point.x, point.y, offset, scale);
        for (const shape of shapes) {
          if (isPointInShape(shape, worldPos.x, worldPos.y)) {
            shapesToDelete.add(shape.id);
          }
        }
      }

      if (shapesToDelete.size > 0) {
        // Emit deletions for collaboration
        if (isCollaborating) {
          shapesToDelete.forEach((id) => emitShapeDelete(id));
        }
        setShapes((prevShapes) =>
          prevShapes.filter((s) => !shapesToDelete.has(s.id))
        );
      }
    }

    setIsErasing(false);
    setEraserPath([]);
  };

  return {
    isErasing,
    eraserPath,
    eraserHoverPos,
    setEraserHoverPos,
    handleEraserStart,
    handleEraserMove,
    handleEraserEnd,
  };
}
