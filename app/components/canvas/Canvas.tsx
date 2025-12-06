"use client";
import { useEffect, useRef, useState } from "react";
import { Shape } from "@/app/types/Shapes";
import { selectedShapes } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { HandleMouseDown } from "./HandleMouseDown";
import { useCanvasZoom } from "@/app/hooks/useCanvasZoom";
import { useDragShape } from "@/app/hooks/useDragShape";
import { useHistory } from "@/app/hooks/useHistory";
import { handleShapeHover } from "@/app/utils/handleShapeHover";
import { ZoomControls } from "./ZoomControls";
import { HistoryControls } from "./HistoryControls";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { shapes, setShapes, undo, redo, canUndo, canRedo } = useHistory([]);
  const [selectedTool, setSelectedTool] = useState<selectedShapes>("rectangle");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  const { scale, zoomIn, zoomOut, handleWheelZoom, zoomPercentage } =
    useCanvasZoom(1);

  const { isDragging, handleDragStart, handleDragMove, handleDragEnd } =
    useDragShape(
      canvasRef,
      shapes,
      setShapes,
      selectedShapeId,
      setSelectedShapeId,
      offset,
      scale
    );

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const isZoomGesture = e.ctrlKey || e.metaKey;

      if (isZoomGesture) {
        e.preventDefault();
        handleWheelZoom(e.deltaY, true);
      } else {
        e.preventDefault();
        setOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheelZoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
        e.preventDefault();
        setShapes((prevShapes) =>
          prevShapes.filter((shape) => shape.id !== selectedShapeId)
        );
        setSelectedShapeId(null);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, undo, redo, setShapes]);

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
      RedrawCanvas(ctx, shapes, selectedShapeId, offset, scale);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [shapes, selectedShapeId, scale, offset]);

  const handleMouseDown = HandleMouseDown(
    canvasRef,
    shapes,
    selectedTool,
    setShapes,
    selectedShapeId,
    setSelectedShapeId,
    offset,
    scale
  );

  const handlePanStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      e.preventDefault();
      setIsPanning(true);
      setLastPan({ x: e.clientX, y: e.clientY });
      canvasRef.current!.style.cursor = "grabbing";
    }
  };

  const handlePanMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPan.x;
    const dy = e.clientY - lastPan.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPan({ x: e.clientX, y: e.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default";
    }
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      handlePanStart(e);
    } else if (selectedTool === "select") {
      handleDragStart(e);
    } else {
      handleMouseDown(e);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePanMove(e);

    if (isDragging) {
      handleDragMove(e);
      return;
    }

    if (!isPanning) {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const cursor = handleShapeHover(
        e,
        canvas,
        shapes,
        selectedTool,
        offset,
        scale
      );
      canvas.style.cursor = cursor;
    }
  };

  const onMouseUp = () => {
    handlePanEnd();
    handleDragEnd();
  };

  return (
    <div className="bg-white h-screen w-screen">
      <div className="flex justify-center">
        <div className="flex bg-[#232329] m-2 rounded-lg z-50">
          <div className="m-4">
            <button
              className={` ${
                selectedTool === "select"
                  ? "bg-[#403E6A] p-2 rounded-lg text-white"
                  : "p-2 rounded-lg text-white"
              }`}
              onClick={() => setSelectedTool("select")}
            >
              Select
            </button>
            <button
              className={` ${
                selectedTool === "rectangle"
                  ? "bg-[#403E6A] p-2 rounded-lg text-white"
                  : "p-2 rounded-lg text-white"
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
                  ? "bg-[#403E6A] p-2 rounded-lg text-white"
                  : "p-2 rounded-lg text-white"
              }`}
              onClick={() => setSelectedTool("circle")}
            >
              Circle
            </button>
            <button
              className={` ${
                selectedTool === "line"
                  ? "bg-[#403E6A] p-2 rounded-lg text-white"
                  : "p-2 rounded-lg text-white"
              }`}
              onClick={() => setSelectedTool("line")}
            >
              Line
            </button>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className={`absolute top-0 left-0 w-full h-full cursor-${
          selectedTool === "select" ? "default" : "crosshair"
        } z-0`}
      ></canvas>

      {/* Bottom-left controls: Zoom + Undo/Redo */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2 bg-[#232329] rounded-lg p-2 shadow-lg z-50">
        <ZoomControls
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          zoomPercentage={zoomPercentage}
        />
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        <HistoryControls
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
    </div>
  );
}
