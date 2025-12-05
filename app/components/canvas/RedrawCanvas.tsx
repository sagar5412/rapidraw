import { Shape } from "@/app/types/Shapes";

export const RedrawCanvas = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  selectedShapeId: string | null,
  offset: { x: number; y: number },
  scale: number
) => {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);

  shapes.forEach((shape) => {
    ctx.save();
    if (shape.id === selectedShapeId) {
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
    } else {
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    }

    if (shape.type === "rectangle") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(
        shape.x + shape.radius,
        shape.y + shape.radius,
        shape.radius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  });

  ctx.restore();
};
