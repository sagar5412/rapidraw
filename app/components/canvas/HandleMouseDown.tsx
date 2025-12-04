import { selectedShapes, Shape } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { DrawShapes } from "./DrawShapes";
import { RefObject } from "react";
import { handleSelectionMode } from "@/app/utils/handleSelectionMode";

export const HandleMouseDown = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  shapes: Shape[],
  selectedTool: selectedShapes,
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  selectedShapeId: string | null,
  setSelectedShapeId: (id: string | null) => void
) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let currentShape: Shape | null = null;

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (selectedTool === "select") {
      handleSelectionMode(e, canvas, shapes, setSelectedShapeId);
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

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const currentX = Math.max(Math.min(e.clientX, canvasWidth), 0);
      const currentY = Math.max(Math.min(e.clientY, canvasHeight), 0);

      const width = currentX - startX;
      const height = currentY - startY;

      switch (selectedTool) {
        case "rectangle":
          let rectX = width < 0 ? currentX : startX;
          let rectY = height < 0 ? currentY : startY;
          let rectWidth = Math.abs(width);
          let rectHeight = Math.abs(height);

          rectX = Math.max(0, rectX);
          rectY = Math.max(0, rectY);
          rectWidth = Math.min(rectWidth, canvasWidth - rectX);
          rectHeight = Math.min(rectHeight, canvasHeight - rectY);

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

          let circleX = startX + width / 2 - radius;
          let circleY = startY + height / 2 - radius;

          circleX = Math.max(0, Math.min(circleX, canvasWidth - radius * 2));
          circleY = Math.max(0, Math.min(circleY, canvasHeight - radius * 2));

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
      RedrawCanvas(ctx, shapes, selectedShapeId);
      if (currentShape) {
        DrawShapes(ctx, currentShape);
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
