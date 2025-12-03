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

export type Shape = rectangle | circle;
export type selectedShapes = "rectangle" | "circle";
