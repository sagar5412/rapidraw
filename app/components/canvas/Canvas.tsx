"use client";
import { useEffect, useRef, useState } from "react";
import { Shape } from "@/app/types/Shapes";
import { selectedShapes } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { DrawShapes } from "./DrawShapes";

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
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      RedrawCanvas(ctx, shapes);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [shapes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let currentShape: Shape | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const currentX = e.clientX;
      const currentY = e.clientY;
      const width = currentX - startX;
      const height = currentY - startY;

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
          const radius = Math.sqrt(width * width + height * height) / 2;
          const circleX = startX + Math.sign(width) * radius - radius;
          const circleY = startY + Math.sign(height) * radius - radius;

          currentShape = {
            id: Date.now().toString(),
            type: "circle",
            x: circleX,
            y: circleY,
            radius,
            color: "black",
          };
          break;
        default:
          break;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      RedrawCanvas(ctx, shapes);
      DrawShapes(ctx, currentShape!);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (currentShape) {
        setShapes((prevShapes) => [...prevShapes, currentShape!]);
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  return (
    <div className="bg-white h-screen w-screen">
      <div className="flex justify-center">
        <div className="flex bg-[#232329] m-2 rounded-lg z-50">
          <div className="m-4">
            <button
              className={` ${
                selectedTool === "rectangle"
                  ? "bg-[#403E6A] p-2 rounded-lg"
                  : "p-2 rounded-lg"
              }`}
              onClick={() => {
                setSelectedTool("rectangle");
              }}
            >
              Rectangle
            </button>
          </div>
          <div className="m-4">
            <button
              className={` ${
                selectedTool === "circle"
                  ? "bg-[#403E6A] p-2 rounded-lg"
                  : "p-2 rounded-lg"
              }`}
              onClick={() => setSelectedTool("circle")}
            >
              Circle
            </button>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair z-0"
      ></canvas>
    </div>
  );
}
