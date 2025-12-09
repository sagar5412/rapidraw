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

  // Draw selection bounding box connecting handles
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

    // Apply shape styles
    const strokeColor =
      shape.strokeColor ||
      ("color" in shape ? shape.color : "black") ||
      "black";
    const fillColor = shape.fillColor || "transparent";
    const strokeWidth = shape.strokeWidth || 1;
    const strokeStyle = shape.strokeStyle || "solid";
    const opacity = (shape.opacity ?? 100) / 100;

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;

    // Set stroke style
    if (strokeStyle === "dashed") {
      ctx.setLineDash([8, 4]);
    } else if (strokeStyle === "dotted") {
      ctx.setLineDash([2, 4]);
    } else {
      ctx.setLineDash([]);
    }

    if (shape.type === "rectangle") {
      const edges = shape.edges || "sharp";
      const radius =
        edges === "rounded"
          ? Math.min(10, shape.width / 4, shape.height / 4)
          : 0;

      if (radius > 0) {
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(shape.x + radius, shape.y);
        ctx.lineTo(shape.x + shape.width - radius, shape.y);
        ctx.arcTo(
          shape.x + shape.width,
          shape.y,
          shape.x + shape.width,
          shape.y + radius,
          radius
        );
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height - radius);
        ctx.arcTo(
          shape.x + shape.width,
          shape.y + shape.height,
          shape.x + shape.width - radius,
          shape.y + shape.height,
          radius
        );
        ctx.lineTo(shape.x + radius, shape.y + shape.height);
        ctx.arcTo(
          shape.x,
          shape.y + shape.height,
          shape.x,
          shape.y + shape.height - radius,
          radius
        );
        ctx.lineTo(shape.x, shape.y + radius);
        ctx.arcTo(shape.x, shape.y, shape.x + radius, shape.y, radius);
        ctx.closePath();
        if (fillColor !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
      } else {
        // Draw sharp rectangle
        if (fillColor !== "transparent") {
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        }
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(
        shape.x + shape.radius,
        shape.y + shape.radius,
        shape.radius,
        0,
        Math.PI * 2
      );
      if (fillColor !== "transparent") {
        ctx.fill();
      }
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
      if (fillColor !== "transparent") {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === "textbox") {
      // Render styled text content on canvas using segment-based approach
      if (typeof document !== "undefined" && shape.htmlContent) {
        const fontSize = shape.fontSize || 16;
        const fontFamily = shape.fontFamily || "sans-serif";
        const textAlign = shape.textAlign || "left";
        const lineHeight = fontSize * 1.4;

        ctx.textBaseline = "top";
        ctx.setLineDash([]);

        // Extract styled segments from HTML
        interface TextSegment {
          text: string;
          color: string;
          bold: boolean;
          italic: boolean;
          underline: boolean;
        }

        const extractSegments = (html: string): TextSegment[] => {
          const segments: TextSegment[] = [];
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = html;

          const walk = (
            node: Node,
            styles: {
              color: string;
              bold: boolean;
              italic: boolean;
              underline: boolean;
            }
          ) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent || "";
              if (text) {
                segments.push({ text, ...styles });
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const tag = el.tagName.toLowerCase();

              const newStyles = { ...styles };

              // Check for color
              if (tag === "font" && el.getAttribute("color")) {
                newStyles.color = el.getAttribute("color") || styles.color;
              }
              if (el.style.color) {
                newStyles.color = el.style.color;
              }

              // Check formatting
              if (tag === "b" || tag === "strong") newStyles.bold = true;
              if (tag === "i" || tag === "em") newStyles.italic = true;
              if (tag === "u") newStyles.underline = true;

              // Process children
              for (const child of Array.from(el.childNodes)) {
                walk(child, newStyles);
              }

              // Add newline for block elements
              if (
                (tag === "div" || tag === "p" || tag === "br") &&
                segments.length > 0
              ) {
                // Only add if not already ending with newline
                const lastSeg = segments[segments.length - 1];
                if (lastSeg && !lastSeg.text.endsWith("\n")) {
                  segments.push({ text: "\n", ...styles });
                }
              }
            }
          };

          walk(tempDiv, {
            color: strokeColor,
            bold: false,
            italic: false,
            underline: false,
          });
          return segments;
        };

        const segments = extractSegments(shape.htmlContent);

        // Render segments
        let x = shape.x;
        let y = shape.y;

        for (const seg of segments) {
          // Handle newline
          if (seg.text === "\n" || seg.text.includes("\n")) {
            const parts = seg.text.split("\n");
            for (let i = 0; i < parts.length; i++) {
              if (i > 0) {
                y += lineHeight;
                x = shape.x;
              }
              const part = parts[i];
              if (part) {
                // Build font
                let font = "";
                if (seg.italic) font += "italic ";
                if (seg.bold) font += "bold ";
                font += `${fontSize}px ${fontFamily}`;

                ctx.font = font;
                ctx.fillStyle = seg.color;
                ctx.fillText(part, x, y);

                // Underline
                if (seg.underline) {
                  const w = ctx.measureText(part).width;
                  ctx.beginPath();
                  ctx.moveTo(x, y + fontSize);
                  ctx.lineTo(x + w, y + fontSize);
                  ctx.strokeStyle = seg.color;
                  ctx.lineWidth = 1;
                  ctx.stroke();
                }

                x += ctx.measureText(part).width;
              }
            }
          } else {
            // Build font
            let font = "";
            if (seg.italic) font += "italic ";
            if (seg.bold) font += "bold ";
            font += `${fontSize}px ${fontFamily}`;

            ctx.font = font;
            ctx.fillStyle = seg.color;
            ctx.fillText(seg.text, x, y);

            // Underline
            if (seg.underline) {
              const w = ctx.measureText(seg.text).width;
              ctx.beginPath();
              ctx.moveTo(x, y + fontSize);
              ctx.lineTo(x + w, y + fontSize);
              ctx.strokeStyle = seg.color;
              ctx.lineWidth = 1;
              ctx.stroke();
            }

            x += ctx.measureText(seg.text).width;
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
