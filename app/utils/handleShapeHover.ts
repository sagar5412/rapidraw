import { Shape } from "../types/Shapes";
import { isPointInShape } from "./checkPoint";

export function handleShapeHover(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  shapes: Shape[],
  selectedTool: string
) {
  if (selectedTool !== "select") {
    return "crosshair";
  }

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedShape = shapes.find((shape) => isPointInShape(shape, x, y));

  if (clickedShape) {
    return "move";
  }

  return "default";
}
