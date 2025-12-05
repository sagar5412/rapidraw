import { Shape } from "@/app/types/Shapes";
import { isPointInShape } from "./checkPoint";
import { screenToWorld } from "./coordinates";

export function handleSelectionMode(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  shapes: Shape[],
  setSelectedShapeId: (id: string | null) => void,
  offset: { x: number; y: number },
  scale: number
) {
  const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);

  const clickedShape = shapes.find((shape) =>
    isPointInShape(shape, worldPos.x, worldPos.y)
  );
  setSelectedShapeId(clickedShape ? clickedShape.id : null);
}
