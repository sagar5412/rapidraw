import { Shape } from "../types/Shapes";
import { isPointInShape } from "./checkPoint";
import { screenToWorld } from "./coordinates";

export function handleShapeHover(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  shapes: Shape[],
  selectedTool: string,
  offset: { x: number; y: number },
  scale: number
) {
  if (selectedTool !== "select") {
    return "crosshair";
  }

  const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);

  const clickedShape = shapes.find((shape) =>
    isPointInShape(shape, worldPos.x, worldPos.y)
  );

  if (clickedShape) {
    return "move";
  }

  return "default";
}
