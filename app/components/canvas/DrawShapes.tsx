import { Shape } from "@/app/types/Shapes";

export const DrawShapes = (
  ctx: CanvasRenderingContext2D,
  currentShape: Shape,
  offset: { x: number; y: number },
  scale: number
) => {
  if (!currentShape) return;

  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;

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
  } else if (currentShape.type === "line") {
    ctx.beginPath();
    ctx.moveTo(currentShape.x1, currentShape.y1);
    ctx.lineTo(currentShape.x2, currentShape.y2);
    ctx.stroke();
    ctx.closePath();
  }

  ctx.restore();
};
