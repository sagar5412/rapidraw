import { selectedShapes, Shape } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { DrawShapes } from "./DrawShapes";

export const HandleMouseDown = (
  canvasRef: any,
  shapes: Shape[],
  selectedTool: selectedShapes,
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let currentShape: Shape | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const currentX = e.clientX;
      const currentY = e.clientY;
      const width = currentX - startX;
      const height = currentY - startY;

      switch (selectedTool) {
        case "rectangle":
          currentShape = {
            id: Date.now().toString(),
            type: "rectangle",
            x: startX,
            y: startY,
            width,
            height,
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
      RedrawCanvas(ctx, shapes);
      DrawShapes(ctx, currentShape!);
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
