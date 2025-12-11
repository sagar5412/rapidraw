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
  theme: "system" | "light" | "dark"
): RapidrawFile {
  const now = new Date().toISOString();
  return {
    version: RAPIDRAW_VERSION,
    createdAt: now,
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
 * Download a Rapidraw file to the user's computer
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
 * Open a file picker and load a Rapidraw file
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
