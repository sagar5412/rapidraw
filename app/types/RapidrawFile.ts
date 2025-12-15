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
