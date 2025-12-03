"use client";
import { useEffect, useRef, useState } from "react";
import { Shape } from "@/app/types/Shapes";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      if (shape.type === "rectangle") {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
    });
  }, [canvasRef, shapes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const handleMouseMove = (e: MouseEvent) => {
      const width = e.clientX - startX;
      const height = e.clientY - startY;

      setShapes((prevShapes) => [
        ...prevShapes,
        { type: "rectangle", x: startX, y: startY, width, height },
      ]);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  return (
    <div className="bg-white h-screen w-screen">
      <canvas ref={canvasRef} onMouseDown={handleMouseDown}></canvas>;
    </div>
  );
}
