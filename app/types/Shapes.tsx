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

export interface arrow {
  id: string;
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface freehand {
  id: string;
  type: "freehand";
  points: { x: number; y: number }[];
  color: string;
}

export interface diamond {
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

export interface textbox {
  id: string;
  type: "textbox";
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
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
