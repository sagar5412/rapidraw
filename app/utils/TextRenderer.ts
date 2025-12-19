import { textbox } from "@/app/types/Shapes";

interface TextSegment {
  text: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const extractSegments = (html: string, baseColor: string): TextSegment[] => {
  const segments: TextSegment[] = [];

  if (typeof document === "undefined") {
    // Fallback for SSR/non-browser env if strictly needed,
    // though this is canvas rendering which happens on client.
    return [
      {
        text: html.replace(/<[^>]*>/g, ""),
        color: baseColor,
        bold: false,
        italic: false,
        underline: false,
      },
    ];
  }

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
    color: baseColor,
    bold: false,
    italic: false,
    underline: false,
  });
  return segments;
};

export const renderTextOnCanvas = (
  ctx: CanvasRenderingContext2D,
  shape: textbox,
  strokeColor: string
) => {
  if (typeof document === "undefined" || !shape.htmlContent) return;

  const fontSize = shape.fontSize || 16;
  const fontFamily = shape.fontFamily || "sans-serif";
  const lineHeight = fontSize * 1.4;

  ctx.textBaseline = "top";
  ctx.setLineDash([]);

  const segments = extractSegments(shape.htmlContent, strokeColor);

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
};
