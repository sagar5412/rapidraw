import { Shape } from "@/app/types/Shapes";

const drawArrowhead = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headLength: number = 10
) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
};

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
  } else if (currentShape.type === "arrow") {
    ctx.beginPath();
    ctx.moveTo(currentShape.x1, currentShape.y1);
    ctx.lineTo(currentShape.x2, currentShape.y2);
    ctx.stroke();
    ctx.closePath();
    drawArrowhead(
      ctx,
      currentShape.x1,
      currentShape.y1,
      currentShape.x2,
      currentShape.y2
    );
  }

  ctx.restore();
};
