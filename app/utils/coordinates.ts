export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  offset: Point;
  scale: number;
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  offset: Point,
  scale: number
): Point {
  return {
    x: (screenX - offset.x) / scale,
    y: (screenY - offset.y) / scale,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  offset: Point,
  scale: number
): Point {
  return {
    x: worldX * scale + offset.x,
    y: worldY * scale + offset.y,
  };
}

export function getWorldMousePosition(
  e: MouseEvent | React.MouseEvent,
  offset: Point,
  scale: number
): Point {
  return screenToWorld(e.clientX, e.clientY, offset, scale);
}
