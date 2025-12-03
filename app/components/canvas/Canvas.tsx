"use client";
import { useEffect, useRef, useState } from "react";
import { Shape } from "@/app/types/Shapes";
import { selectedShapes } from "@/app/types/Shapes";

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
      } else if (shape.type === "circle") {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
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
      const radius = Math.sqrt(width * width + height * height);

      switch (selectedTool) {
        case "rectangle":
          currentShape = {
            id: Date.now().toString(),
            type: "rectangle",
            x: startX,
            y: startY,
            width,
            height,
            color: "black",
          };
          break;
        case "circle":
          currentShape = {
            id: Date.now().toString(),
            type: "circle",
            x: startX,
            y: startY,
            radius,
            color: "black",
          };
          break;
        default:
          break;
      }

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
        } else if (shape.type === "circle") {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.closePath();
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
        } else if (currentShape.type === "circle") {
          ctx.beginPath();
          ctx.arc(
            currentShape.x,
            currentShape.y,
            currentShape.radius,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.closePath();
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
      <div className="flex justify-center bg-black">
        <button onClick={() => setSelectedTool("rectangle")}>Rectangle</button>
        <button onClick={() => setSelectedTool("circle")}>Circle</button>
      </div>
      <canvas ref={canvasRef} onMouseDown={handleMouseDown}></canvas>;
    </div>
  );
}
