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

export const RedrawCanvas = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  selectedShapeId: string | null,
  offset: { x: number; y: number },
  scale: number,
  editingTextId?: string | null
) => {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);

  shapes.forEach((shape) => {
    // Skip rendering textbox that is being edited (handled by TextEditor overlay)
    if (shape.type === "textbox" && shape.id === editingTextId) {
      return;
    }

    ctx.save();
    if (shape.id === selectedShapeId) {
      ctx.strokeStyle = "black";
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
    } else if (shape.type === "line") {
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      ctx.closePath();
    } else if (shape.type === "arrow") {
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      ctx.closePath();
      drawArrowhead(ctx, shape.x1, shape.y1, shape.x2, shape.y2);
    } else if (shape.type === "freehand") {
      const { points } = shape;
      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      }
    } else if (shape.type === "diamond") {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx, shape.y);
      ctx.lineTo(shape.x + shape.width, cy);
      ctx.lineTo(cx, shape.y + shape.height);
      ctx.lineTo(shape.x, cy);
      ctx.closePath();
      ctx.stroke();
    } else if (shape.type === "textbox") {
      // Extract plain text from HTML content (only works in browser)
      if (typeof document !== "undefined") {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = shape.htmlContent || "";
        const plainText = tempDiv.textContent || tempDiv.innerText || "";

        if (plainText) {
          ctx.font = "16px sans-serif";
          ctx.fillStyle = "black";
          ctx.textBaseline = "top";
          ctx.setLineDash([]);

          // Split into lines and render
          const lines = plainText.split("\n");
          let y = shape.y;
          for (const line of lines) {
            ctx.fillText(line, shape.x, y);
            y += 20;
          }
        }
      }

      // Draw selection border if selected
      if (shape.id === selectedShapeId) {
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(
          shape.x - 2,
          shape.y - 2,
          shape.width + 4,
          shape.height + 4
        );
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  });

  ctx.restore();
};
