import { selectedShapes, Shape } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { DrawShapes } from "./DrawShapes";
import { RefObject } from "react";
import { handleSelectionMode } from "@/app/utils/handleSelectionMode";
import { screenToWorld } from "@/app/utils/coordinates";

export const HandleMouseDown = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  shapes: Shape[],
  selectedTool: selectedShapes,
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  selectedShapeId: string | null,
  setSelectedShapeId: (id: string | null) => void,
  offset: { x: number; y: number },
  scale: number
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
            color: "black",
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
            color: "black",
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
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return handleMouseDown;
};
