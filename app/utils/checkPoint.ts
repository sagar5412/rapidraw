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

  return false;
};
