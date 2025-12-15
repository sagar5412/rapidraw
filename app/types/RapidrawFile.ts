import { Shape } from "./Shapes";

// Rapidraw File Format
export interface RapidrawFile {
  // File metadata
  version: string;
  createdAt: string;
  modifiedAt: string;

  // Canvas data
  canvas: {
    background: string;
    theme: "system" | "light" | "dark";
  };

  // All shapes on the canvas
  shapes: Shape[];
}

// File state for tracking current file
export interface FileState {
  handle: FileSystemFileHandle | null;
  name: string;
  hasUnsavedChanges: boolean;
}

// Current file format version
export const RAPIDRAW_VERSION = "1.0.0";

// File extension
export const RAPIDRAW_EXTENSION = ".rapidraw";

// MIME type for .rapidraw files
export const RAPIDRAW_MIME_TYPE = "application/json";

/**
 * Create a Rapidraw file object from canvas state
 */
export function createRapidrawFile(
  shapes: Shape[],
  background: string,
  theme: "system" | "light" | "dark",
  existingCreatedAt?: string
): RapidrawFile {
  const now = new Date().toISOString();
  return {
    version: RAPIDRAW_VERSION,
    createdAt: existingCreatedAt || now,
    modifiedAt: now,
    canvas: {
      background,
      theme,
    },
    shapes,
  };
}

/**
 * Serialize a Rapidraw file to JSON string
 */
export function serializeRapidrawFile(file: RapidrawFile): string {
  return JSON.stringify(file, null, 2);
}

/**
 * Parse a Rapidraw file from JSON string
 */
export function parseRapidrawFile(content: string): RapidrawFile | null {
  try {
    const parsed = JSON.parse(content);

    // Validate required fields
    if (!parsed.version || !parsed.shapes || !parsed.canvas) {
      console.error("Invalid Rapidraw file: missing required fields");
      return null;
    }

    // Version compatibility check
    const [major] = parsed.version.split(".");
    const [currentMajor] = RAPIDRAW_VERSION.split(".");
    if (major !== currentMajor) {
      console.warn(
        `Rapidraw file version ${parsed.version} may not be fully compatible with ${RAPIDRAW_VERSION}`
      );
    }

    return parsed as RapidrawFile;
  } catch (error) {
    console.error("Failed to parse Rapidraw file:", error);
    return null;
  }
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return "showSaveFilePicker" in window && "showOpenFilePicker" in window;
}

/**
 * Save to an existing file handle (for Ctrl+S "save" behavior)
 */
export async function saveToFileHandle(
  handle: FileSystemFileHandle,
  shapes: Shape[],
  background: string,
  theme: "system" | "light" | "dark"
): Promise<boolean> {
  try {
    const file = createRapidrawFile(shapes, background, theme);
    const content = serializeRapidrawFile(file);

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (error) {
    console.error("Failed to save to file:", error);
    return false;
  }
}

/**
 * Save As - show file picker and save (for new files or "save as")
 */
export async function saveAsRapidrawFile(
  shapes: Shape[],
  background: string,
  theme: "system" | "light" | "dark",
  suggestedName: string = "untitled"
): Promise<{ handle: FileSystemFileHandle; name: string } | null> {
  if (!isFileSystemAccessSupported()) {
    // Fallback to download
    downloadRapidrawFile(shapes, background, theme, suggestedName);
    return null;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: `${suggestedName}${RAPIDRAW_EXTENSION}`,
      types: [
        {
          description: "Rapidraw Files",
          accept: { "application/json": [RAPIDRAW_EXTENSION as `.${string}`] },
        },
      ],
    });

    const success = await saveToFileHandle(handle, shapes, background, theme);
    if (success) {
      return { handle, name: handle.name };
    }
    return null;
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Failed to save file:", error);
    }
    return null;
  }
}

/**
 * Open file with File System Access API
 */
export async function openRapidrawFileWithHandle(): Promise<{
  file: RapidrawFile;
  handle: FileSystemFileHandle;
  name: string;
} | null> {
  if (!isFileSystemAccessSupported()) {
    // Fallback to old method
    const file = await openRapidrawFile();
    return file
      ? {
          file,
          handle: null as unknown as FileSystemFileHandle,
          name: "Untitled",
        }
      : null;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Rapidraw Files",
          accept: { "application/json": [RAPIDRAW_EXTENSION as `.${string}`] },
        },
      ],
    });

    const file = await handle.getFile();
    const content = await file.text();
    const rapidrawFile = parseRapidrawFile(content);

    if (rapidrawFile) {
      return { file: rapidrawFile, handle, name: handle.name };
    }
    return null;
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Failed to open file:", error);
    }
    return null;
  }
}

/**
 * Download a Rapidraw file to the user's computer (fallback method)
 */
export function downloadRapidrawFile(
  shapes: Shape[],
  background: string,
  theme: "system" | "light" | "dark",
  filename: string = "untitled"
): void {
  const file = createRapidrawFile(shapes, background, theme);
  const content = serializeRapidrawFile(file);
  const blob = new Blob([content], { type: RAPIDRAW_MIME_TYPE });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(RAPIDRAW_EXTENSION)
    ? filename
    : `${filename}${RAPIDRAW_EXTENSION}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open a file picker and load a Rapidraw file (fallback method)
 */
export function openRapidrawFile(): Promise<RapidrawFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = RAPIDRAW_EXTENSION;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const content = await file.text();
        const rapidrawFile = parseRapidrawFile(content);
        resolve(rapidrawFile);
      } catch (error) {
        console.error("Failed to read file:", error);
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Export canvas as PNG image
 */
export function exportCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string = "rapidraw-export"
): void {
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export shapes as SVG
 */
export function exportShapesAsSvg(
  shapes: Shape[],
  background: string,
  filename: string = "rapidraw-export"
): void {
  if (shapes.length === 0) {
    console.warn("No shapes to export");
    return;
  }

  // Calculate bounding box with padding
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const shape of shapes) {
    if (
      shape.type === "rectangle" ||
      shape.type === "diamond" ||
      shape.type === "textbox"
    ) {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    } else if (shape.type === "circle") {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.radius * 2);
      maxY = Math.max(maxY, shape.y + shape.radius * 2);
    } else if (shape.type === "line" || shape.type === "arrow") {
      minX = Math.min(minX, shape.x1, shape.x2);
      minY = Math.min(minY, shape.y1, shape.y2);
      maxX = Math.max(maxX, shape.x1, shape.x2);
      maxY = Math.max(maxY, shape.y1, shape.y2);
    } else if (shape.type === "freehand" && shape.points.length > 0) {
      for (const p of shape.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }
  }

  const padding = 20;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  // Build SVG content
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${background}"/>
  <g transform="translate(${offsetX}, ${offsetY})">
`;

  for (const shape of shapes) {
    // Access color using 'in' operator to handle textbox which doesn't have color
    const stroke =
      "color" in shape ? shape.color : shape.strokeColor || "#000000";
    const strokeWidth = shape.strokeWidth || 2;
    const fill = shape.fillColor || "none";

    if (shape.type === "rectangle") {
      svgContent += `    <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    } else if (shape.type === "circle") {
      const cx = shape.x + shape.radius;
      const cy = shape.y + shape.radius;
      svgContent += `    <circle cx="${cx}" cy="${cy}" r="${shape.radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    } else if (shape.type === "diamond") {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const points = `${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${
        shape.y + shape.height
      } ${shape.x},${cy}`;
      svgContent += `    <polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    } else if (shape.type === "line") {
      svgContent += `    <line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    } else if (shape.type === "arrow") {
      const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
      const arrowLength = 12;
      const arrowAngle = Math.PI / 6;
      const x3 = shape.x2 - arrowLength * Math.cos(angle - arrowAngle);
      const y3 = shape.y2 - arrowLength * Math.sin(angle - arrowAngle);
      const x4 = shape.x2 - arrowLength * Math.cos(angle + arrowAngle);
      const y4 = shape.y2 - arrowLength * Math.sin(angle + arrowAngle);
      svgContent += `    <line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
      svgContent += `    <polygon points="${shape.x2},${shape.y2} ${x3},${y3} ${x4},${y4}" fill="${stroke}"/>\n`;
    } else if (shape.type === "freehand" && shape.points.length > 1) {
      const pathData = shape.points
        .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
        .join(" ");
      svgContent += `    <path d="${pathData}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
    } else if (shape.type === "textbox") {
      const fontSize = shape.fontSize || 16;
      const fontFamily = shape.fontFamily || "Arial";
      // Extract plain text from HTML content
      const plainText = shape.htmlContent?.replace(/<[^>]*>/g, "") || "";
      svgContent += `    <text x="${shape.x}" y="${
        shape.y + fontSize
      }" font-family="${fontFamily}" font-size="${fontSize}" fill="${stroke}">${escapeXml(
        plainText
      )}</text>\n`;
    }
  }

  svgContent += `  </g>
</svg>`;

  // Download SVG
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${filename}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a unique ID for shapes
 */
function generateId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse color from SVG attributes (handles hex, rgb, named colors)
 */
function parseColor(
  color: string | null,
  defaultColor: string = "#000000"
): string {
  if (!color || color === "none" || color === "transparent")
    return defaultColor;
  return color;
}

/**
 * Import an SVG file and convert to shapes
 */
export function importSvgFile(): Promise<Shape[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const content = await file.text();
        const shapes = parseSvgContent(content);
        resolve(shapes);
      } catch (error) {
        console.error("Failed to parse SVG:", error);
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Parse SVG content string and convert to shapes
 */
export function parseSvgContent(svgContent: string): Shape[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const shapes: Shape[] = [];

  // Check for parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.error("SVG parse error:", parseError.textContent);
    return shapes;
  }

  // Get the SVG element
  const svgElement = doc.querySelector("svg");
  if (!svgElement) {
    console.error("No SVG element found");
    return shapes;
  }

  // Recursively collect all shape elements from within groups
  function collectElements(parent: Element): Element[] {
    const elements: Element[] = [];
    parent.childNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Element node
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        // If it's a group, recurse into it
        if (tagName === "g" || tagName === "svg") {
          elements.push(...collectElements(el));
        } else if (
          [
            "rect",
            "circle",
            "ellipse",
            "line",
            "polyline",
            "polygon",
            "path",
            "text",
          ].includes(tagName)
        ) {
          // Skip the background rect (usually full-size with fill)
          if (tagName === "rect") {
            const width = el.getAttribute("width");
            const height = el.getAttribute("height");
            // Skip if it looks like a background rect (100% or very large)
            if (width === "100%" || height === "100%") {
              return;
            }
          }
          elements.push(el);
        }
      }
    });
    return elements;
  }

  const elements = collectElements(svgElement);
  console.log("Found SVG elements:", elements.length);

  elements.forEach((element) => {
    const shape = parseElement(element);
    if (shape) {
      shapes.push(shape);
    }
  });

  // If shapes were found, offset them to be visible (center around 100,100)
  if (shapes.length > 0) {
    // Find the bounding box of all shapes
    let minX = Infinity,
      minY = Infinity;
    for (const shape of shapes) {
      if ("x" in shape && typeof shape.x === "number") {
        minX = Math.min(minX, shape.x);
      }
      if ("y" in shape && typeof shape.y === "number") {
        minY = Math.min(minY, shape.y);
      }
      if ("x1" in shape && typeof shape.x1 === "number") {
        minX = Math.min(minX, shape.x1);
      }
      if ("y1" in shape && typeof shape.y1 === "number") {
        minY = Math.min(minY, shape.y1);
      }
      if ("points" in shape && Array.isArray(shape.points)) {
        for (const p of shape.points) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
        }
      }
    }

    // Offset shapes to start near 100,100
    const offsetX = 100 - (isFinite(minX) ? minX : 0);
    const offsetY = 100 - (isFinite(minY) ? minY : 0);

    for (const shape of shapes) {
      if ("x" in shape && typeof shape.x === "number") {
        (shape as any).x += offsetX;
      }
      if ("y" in shape && typeof shape.y === "number") {
        (shape as any).y += offsetY;
      }
      if ("x1" in shape && typeof shape.x1 === "number") {
        (shape as any).x1 += offsetX;
        (shape as any).x2 += offsetX;
      }
      if ("y1" in shape && typeof shape.y1 === "number") {
        (shape as any).y1 += offsetY;
        (shape as any).y2 += offsetY;
      }
      if ("points" in shape && Array.isArray(shape.points)) {
        for (const p of shape.points) {
          p.x += offsetX;
          p.y += offsetY;
        }
      }
    }
  }

  console.log("Parsed shapes:", shapes.length);
  return shapes;
}

/**
 * Parse a single SVG element into a Shape
 */
function parseElement(element: Element): Shape | null {
  const tagName = element.tagName.toLowerCase();
  const stroke = parseColor(element.getAttribute("stroke"), "#000000");
  const fill = element.getAttribute("fill");
  const strokeWidth = parseFloat(element.getAttribute("stroke-width") || "2");

  switch (tagName) {
    case "rect": {
      const x = parseFloat(element.getAttribute("x") || "0");
      const y = parseFloat(element.getAttribute("y") || "0");
      const width = parseFloat(element.getAttribute("width") || "0");
      const height = parseFloat(element.getAttribute("height") || "0");

      if (width > 0 && height > 0) {
        return {
          id: generateId(),
          type: "rectangle",
          x,
          y,
          width,
          height,
          color: stroke,
          strokeWidth,
          fillColor: fill && fill !== "none" ? fill : undefined,
        } as Shape;
      }
      break;
    }

    case "circle": {
      const cx = parseFloat(element.getAttribute("cx") || "0");
      const cy = parseFloat(element.getAttribute("cy") || "0");
      const r = parseFloat(element.getAttribute("r") || "0");

      if (r > 0) {
        return {
          id: generateId(),
          type: "circle",
          x: cx - r,
          y: cy - r,
          radius: r,
          color: stroke,
          strokeWidth,
          fillColor: fill && fill !== "none" ? fill : undefined,
        } as Shape;
      }
      break;
    }

    case "ellipse": {
      const cx = parseFloat(element.getAttribute("cx") || "0");
      const cy = parseFloat(element.getAttribute("cy") || "0");
      const rx = parseFloat(element.getAttribute("rx") || "0");
      const ry = parseFloat(element.getAttribute("ry") || "0");
      // Approximate ellipse as circle using average radius
      const r = (rx + ry) / 2;

      if (r > 0) {
        return {
          id: generateId(),
          type: "circle",
          x: cx - r,
          y: cy - r,
          radius: r,
          color: stroke,
          strokeWidth,
          fillColor: fill && fill !== "none" ? fill : undefined,
        } as Shape;
      }
      break;
    }

    case "line": {
      const x1 = parseFloat(element.getAttribute("x1") || "0");
      const y1 = parseFloat(element.getAttribute("y1") || "0");
      const x2 = parseFloat(element.getAttribute("x2") || "0");
      const y2 = parseFloat(element.getAttribute("y2") || "0");

      return {
        id: generateId(),
        type: "line",
        x1,
        y1,
        x2,
        y2,
        color: stroke,
        strokeWidth,
      } as Shape;
    }

    case "polyline":
    case "polygon": {
      const pointsAttr = element.getAttribute("points");
      if (pointsAttr) {
        const points = parsePoints(pointsAttr);
        if (points.length > 1) {
          return {
            id: generateId(),
            type: "freehand",
            points,
            color: stroke,
            strokeWidth,
          } as Shape;
        }
      }
      break;
    }

    case "path": {
      const d = element.getAttribute("d");
      if (d) {
        const points = parsePathData(d);
        if (points.length > 1) {
          return {
            id: generateId(),
            type: "freehand",
            points,
            color: stroke,
            strokeWidth,
          } as Shape;
        }
      }
      break;
    }

    case "text": {
      const x = parseFloat(element.getAttribute("x") || "0");
      const y = parseFloat(element.getAttribute("y") || "0");
      const fontSize = parseFloat(element.getAttribute("font-size") || "16");
      const textContent = element.textContent || "";

      if (textContent.trim()) {
        return {
          id: generateId(),
          type: "textbox",
          x,
          y: y - fontSize, // Adjust for baseline
          width: textContent.length * fontSize * 0.6,
          height: fontSize * 1.5,
          fontSize,
          fontFamily: element.getAttribute("font-family") || "Arial",
          htmlContent: `<p>${escapeXml(textContent)}</p>`,
          strokeColor: parseColor(element.getAttribute("fill"), stroke),
        } as Shape;
      }
      break;
    }
  }

  return null;
}

/**
 * Parse SVG points attribute (for polyline/polygon)
 */
function parsePoints(pointsStr: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const pairs = pointsStr.trim().split(/[\s,]+/);

  for (let i = 0; i < pairs.length - 1; i += 2) {
    const x = parseFloat(pairs[i]);
    const y = parseFloat(pairs[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }

  return points;
}

/**
 * Parse SVG path data (basic M, L, H, V commands)
 */
function parsePathData(d: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let currentX = 0;
  let currentY = 0;

  // Match path commands with their parameters
  const commands = d.match(/[MLHVCQSAZmlhvcqsaz][^MLHVCQSAZmlhvcqsaz]*/g);

  if (!commands) return points;

  for (const cmd of commands) {
    const type = cmd[0];
    const args = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)
      .filter((n) => !isNaN(n));

    switch (type) {
      case "M": // Move to (absolute)
        if (args.length >= 2) {
          currentX = args[0];
          currentY = args[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "m": // Move to (relative)
        if (args.length >= 2) {
          currentX += args[0];
          currentY += args[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "L": // Line to (absolute)
        for (let i = 0; i < args.length - 1; i += 2) {
          currentX = args[i];
          currentY = args[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "l": // Line to (relative)
        for (let i = 0; i < args.length - 1; i += 2) {
          currentX += args[i];
          currentY += args[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "H": // Horizontal line (absolute)
        for (const x of args) {
          currentX = x;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "h": // Horizontal line (relative)
        for (const dx of args) {
          currentX += dx;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "V": // Vertical line (absolute)
        for (const y of args) {
          currentY = y;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "v": // Vertical line (relative)
        for (const dy of args) {
          currentY += dy;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "Z":
      case "z":
        // Close path - could connect back to start, but skip for now
        break;
      // For curves (C, Q, S, etc.), just add the end point
      case "C":
      case "c":
      case "S":
      case "s":
      case "Q":
      case "q":
      case "T":
      case "t":
        // These are curve commands - extract just the last point
        if (args.length >= 2) {
          if (type === type.toUpperCase()) {
            currentX = args[args.length - 2];
            currentY = args[args.length - 1];
          } else {
            currentX += args[args.length - 2];
            currentY += args[args.length - 1];
          }
          points.push({ x: currentX, y: currentY });
        }
        break;
    }
  }

  return points;
}
