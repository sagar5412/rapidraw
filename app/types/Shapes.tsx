export interface rectangle {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface circle {
  id: string;
  type: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface line {
  id: string;
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export type Shape = rectangle | circle | line;
export type selectedShapes = "rectangle" | "circle" | "line" | "select";
