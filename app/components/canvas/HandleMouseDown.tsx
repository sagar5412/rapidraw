import { selectedShapes, Shape, freehand } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { DrawShapes } from "./DrawShapes";
import { RefObject } from "react";
import { handleSelectionMode } from "@/app/utils/handleSelectionMode";
import { screenToWorld } from "@/app/utils/coordinates";
import { isPointInShape } from "@/app/utils/checkPoint";

export const HandleMouseDown = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  shapes: Shape[],
  selectedTool: selectedShapes,
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  selectedShapeId: string | null,
  setSelectedShapeId: (id: string | null) => void,
  offset: { x: number; y: number },
  scale: number,
  defaultColor: string = "#000000", // Default color based on background
  onDrawComplete?: () => void, // Callback after drawing completes
  onShapeCreated?: (shape: Shape) => void // Callback for collaboration
) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const startWorld = screenToWorld(e.clientX, e.clientY, offset, scale);
    const startX = startWorld.x;
    const startY = startWorld.y;
    let currentShape: Shape | null = null;

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (selectedTool === "select") {
      handleSelectionMode(e, canvas, shapes, setSelectedShapeId, offset, scale);
      return;
    }

    // Eraser is handled in Canvas.tsx for drag support

    // Initialize freehand shape with first point
    if (selectedTool === "freehand") {
      currentShape = {
        id: Date.now().toString(),
        type: "freehand",
        points: [{ x: startX, y: startY }],
        color: defaultColor,
        strokeColor: defaultColor,
      };
    }

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const currentWorld = screenToWorld(e.clientX, e.clientY, offset, scale);
      const currentX = currentWorld.x;
      const currentY = currentWorld.y;

      const width = currentX - startX;
      const height = currentY - startY;

      switch (selectedTool) {
        case "rectangle":
          const rectX = width < 0 ? currentX : startX;
          const rectY = height < 0 ? currentY : startY;
          const rectWidth = Math.abs(width);
          const rectHeight = Math.abs(height);

          currentShape = {
            id: Date.now().toString(),
            type: "rectangle",
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            color: defaultColor,
            strokeColor: defaultColor,
          };
          break;
        case "circle":
          const radiusX = Math.abs(width) / 2;
          const radiusY = Math.abs(height) / 2;
          const radius = Math.max(radiusX, radiusY);

          const circleX = startX + width / 2 - radius;
          const circleY = startY + height / 2 - radius;

          currentShape = {
            id: Date.now().toString(),
            type: "circle",
            x: circleX,
            y: circleY,
            radius,
            color: defaultColor,
            strokeColor: defaultColor,
          };
          break;
        case "line":
          currentShape = {
            id: Date.now().toString(),
            type: "line",
            x1: startX,
            y1: startY,
            x2: currentX,
            y2: currentY,
            color: defaultColor,
            strokeColor: defaultColor,
          };
          break;
        case "arrow":
          currentShape = {
            id: Date.now().toString(),
            type: "arrow",
            x1: startX,
            y1: startY,
            x2: currentX,
            y2: currentY,
            color: defaultColor,
            strokeColor: defaultColor,
          };
          break;
        case "freehand":
          if (currentShape && currentShape.type === "freehand") {
            currentShape = {
              ...currentShape,
              points: [...currentShape.points, { x: currentX, y: currentY }],
            };
          }
          break;
        case "diamond":
          const diamondX = width < 0 ? currentX : startX;
          const diamondY = height < 0 ? currentY : startY;
          const diamondWidth = Math.abs(width);
          const diamondHeight = Math.abs(height);

          currentShape = {
            id: Date.now().toString(),
            type: "diamond",
            x: diamondX,
            y: diamondY,
            width: diamondWidth,
            height: diamondHeight,
            color: defaultColor,
            strokeColor: defaultColor,
          };
          break;
        default:
          break;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      RedrawCanvas(ctx, shapes, selectedShapeId, offset, scale);
      if (currentShape) {
        DrawShapes(ctx, currentShape, offset, scale);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (currentShape) {
        setShapes((prevShapes) => [...prevShapes, currentShape!]);
        // Emit for collaboration
        onShapeCreated?.(currentShape);
        // Switch back to select tool after drawing (except for freehand which allows continuous drawing)
        if (selectedTool !== "freehand") {
          onDrawComplete?.();
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return handleMouseDown;
};
