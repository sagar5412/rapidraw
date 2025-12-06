import { Shape } from "@/app/types/Shapes";

export const isPointInShape = (shape: Shape, x: number, y: number): boolean => {
  const tolerance = 5;

  if (shape.type === "rectangle") {
    const withinX = x >= shape.x && x <= shape.x + shape.width;
    const withinY = y >= shape.y && y <= shape.y + shape.height;

    if (!withinX || !withinY) return false;

    const onLeft = Math.abs(x - shape.x) <= tolerance;
    const onRight = Math.abs(x - (shape.x + shape.width)) <= tolerance;
    const onTop = Math.abs(y - shape.y) <= tolerance;
    const onBottom = Math.abs(y - (shape.y + shape.height)) <= tolerance;

    return onLeft || onRight || onTop || onBottom;
  }

  if (shape.type === "circle") {
    const centerX = shape.x + shape.radius;
    const centerY = shape.y + shape.radius;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return Math.abs(distance - shape.radius) <= tolerance;
  }

  if (shape.type === "line") {
    const { x1, y1, x2, y2 } = shape;
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    if (lineLength === 0) {
      return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2) <= tolerance;
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lineLength ** 2
      )
    );
    const nearestX = x1 + t * (x2 - x1);
    const nearestY = y1 + t * (y2 - y1);
    const distance = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);

    return distance <= tolerance;
  }

  if (shape.type === "arrow") {
    const { x1, y1, x2, y2 } = shape;
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    if (lineLength === 0) {
      return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2) <= tolerance;
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lineLength ** 2
      )
    );
    const nearestX = x1 + t * (x2 - x1);
    const nearestY = y1 + t * (y2 - y1);
    const distance = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);

    return distance <= tolerance;
  }

  return false;
};
