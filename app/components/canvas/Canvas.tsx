"use client";
import { useEffect, useRef, useState } from "react";
import { Shape } from "@/app/types/Shapes";
import { selectedShapes } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { HandleMouseDown } from "./HandleMouseDown";
import { useDisableZoom } from "@/app/hooks/useDisableZoom";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<selectedShapes>("rectangle");

  useDisableZoom();

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

  const handleMouseDown = HandleMouseDown(
    canvasRef,
    shapes,
    selectedTool,
    setShapes
  );
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
