import { Shape } from "@/app/types/Shapes";

export const DrawShapes = (
  ctx: CanvasRenderingContext2D,
  currentShape: Shape
) => {
  if (currentShape) {
    if (currentShape.type === "rectangle") {
      ctx.strokeRect(
        currentShape.x,
        currentShape.y,
        currentShape.width,
        currentShape.height
      );
    } else if (currentShape.type === "circle") {
      ctx.beginPath();
      ctx.arc(
        currentShape.x + currentShape.radius,
        currentShape.y + currentShape.radius,
        currentShape.radius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.closePath();
    }
  }
};
