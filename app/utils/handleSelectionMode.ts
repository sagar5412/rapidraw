import { Shape } from "@/app/types/Shapes";
import { isPointInShape } from "./checkPoint";

export function handleSelectionMode(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  shapes: Shape[],
  setSelectedShapeId: (id: string | null) => void
) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedShape = shapes.find((shape) => isPointInShape(shape, x, y));
  setSelectedShapeId(clickedShape ? clickedShape.id : null);
}
