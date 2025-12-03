"use client";
import { useEffect, useRef, useState } from "react";
import { Shape } from "@/app/types/Shapes";

type selectedShapes = "rectangle";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<selectedShapes>("rectangle");
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
    let currentShape: Shape | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      currentShape = {
        type: selectedTool,
        x: startX,
        y: startY,
        width,
        height,
      };

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      shapes.forEach((shape) => {
        if (shape.type === "rectangle") {
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
      });

      if (currentShape) {
        if (currentShape.type === "rectangle") {
          ctx.strokeRect(
            currentShape.x,
            currentShape.y,
            currentShape.width,
            currentShape.height
          );
        }
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (currentShape) {
        const shapeToAdd = currentShape;
        setShapes((prevShapes) => [...prevShapes, shapeToAdd]);
      }
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
