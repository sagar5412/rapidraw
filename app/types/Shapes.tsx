// Common style properties for shapes
export interface ShapeStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  edges?: "sharp" | "rounded";
  opacity?: number;
}

export interface rectangle extends ShapeStyle {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface circle extends ShapeStyle {
  id: string;
  type: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface line extends ShapeStyle {
  id: string;
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface arrow extends ShapeStyle {
  id: string;
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface freehand extends ShapeStyle {
  id: string;
  type: "freehand";
  points: { x: number; y: number }[];
  color: string;
}

export interface diamond extends ShapeStyle {
  id: string;
  type: "diamond";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface TextSpan {
  text: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
}

export interface textbox extends ShapeStyle {
  id: string;
  type: "textbox";
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  htmlContent: string;
}

export type Shape =
  | rectangle
  | circle
  | line
  | arrow
  | freehand
  | diamond
  | textbox;

export type selectedShapes =
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "freehand"
  | "diamond"
  | "text"
  | "eraser"
  | "select";
