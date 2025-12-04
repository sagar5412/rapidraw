import { Shape } from "@/app/types/Shapes";

export const RedrawCanvas = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  selectedShapeId: string | null
) => {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  shapes.forEach((shape) => {
    ctx.save();
    if (shape.id === selectedShapeId) {
      ctx.strokeStyle = "#3B82F6"; // Blue outline
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
};
