import { Shape } from "@/app/types/Shapes";

export const RedrawCanvas = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[]
) => {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shapes.forEach((shape) => {
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
  });
};
