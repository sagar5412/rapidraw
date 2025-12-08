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

export type ResizeHandlePoint = { handle: string | null; x: number; y: number };

const HANDLE_SIZE = 8;

const drawResizeHandles = (
  ctx: CanvasRenderingContext2D,
  handles: ResizeHandlePoint[]
) => {
  ctx.save();

  // Draw selection bounding box connecting corner handles
  const cornerHandles = handles.filter(
    (h) =>
      h.handle === "nw" ||
      h.handle === "ne" ||
      h.handle === "sw" ||
      h.handle === "se"
  );

  if (cornerHandles.length >= 2) {
    const xs = cornerHandles.map((h) => h.x);
    const ys = cornerHandles.map((h) => h.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Draw solid selection rectangle
    ctx.strokeStyle = "#6366F1";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  } else if (handles.length === 2) {
    // For line/arrow, draw line between endpoints
    ctx.strokeStyle = "#6366F1";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(handles[0].x, handles[0].y);
    ctx.lineTo(handles[1].x, handles[1].y);
    ctx.stroke();
  }

  // Draw resize handles
  ctx.fillStyle = "white";
  ctx.strokeStyle = "#6366F1";
  ctx.lineWidth = 2;

  handles.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.rect(
      x - HANDLE_SIZE / 2,
      y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    );
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
};

export const RedrawCanvas = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  selectedShapeId: string | null,
  offset: { x: number; y: number },
  scale: number,
  editingTextId?: string | null,
  resizeHandles?: ResizeHandlePoint[]
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
    // All shapes use the same styling - selection shown via resize handles
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

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
          const fontSize = shape.fontSize || 16;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = "black";
          ctx.textBaseline = "top";
          ctx.setLineDash([]);

          // Split into lines and render with dynamic line height
          const lineHeight = fontSize * 1.3;
          const lines = plainText.split("\n");
          let y = shape.y;
          for (const line of lines) {
            ctx.fillText(line, shape.x, y);
            y += lineHeight;
          }
        }
      }
      // Selection is handled by resize handles - no separate border needed
    }
    ctx.restore();
  });

  // Draw resize handles for selected shape
  if (resizeHandles && resizeHandles.length > 0) {
    drawResizeHandles(ctx, resizeHandles);
  }

  ctx.restore();
};
