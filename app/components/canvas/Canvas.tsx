"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { Shape, textbox, ShapeStyle } from "@/app/types/Shapes";
import { selectedShapes } from "@/app/types/Shapes";
import { RedrawCanvas } from "./RedrawCanvas";
import { HandleMouseDown } from "./HandleMouseDown";
import { useCanvasZoom } from "@/app/hooks/useCanvasZoom";
import { useDragShape } from "@/app/hooks/useDragShape";
import { useHistory } from "@/app/hooks/useHistory";
import { useResizeShape } from "@/app/hooks/useResizeShape";
import { handleShapeHover } from "@/app/utils/handleShapeHover";
import { ZoomControls } from "./ZoomControls";
import { HistoryControls } from "./HistoryControls";
import { TextEditor } from "./TextEditor";
import { Toolbar } from "./Toolbar";
import { screenToWorld } from "@/app/utils/coordinates";
import { isPointInShape } from "@/app/utils/checkPoint";
import { ScreenSettingsSidebar } from "@/app/components/sidebar/ScreenSettingsSidebar";
import { ShapeSettingsSidebar } from "@/app/components/sidebar/ShapeSettingsSidebar";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { shapes, setShapes, undo, redo, canUndo, canRedo } = useHistory([]);
  const [selectedTool, setSelectedTool] = useState<selectedShapes>("rectangle");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPath, setEraserPath] = useState<{ x: number; y: number }[]>([]);
  const [eraserHoverPos, setEraserHoverPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Screen settings
  const [theme, setTheme] = useState<"default" | "light" | "dark">("default");
  const [canvasBackground, setCanvasBackground] = useState("#F5F5F5");

  // Calculate default color based on background (light bg = black, dark bg = white)
  const isLightBackground = (color: string) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const defaultColor = isLightBackground(canvasBackground)
    ? "#000000"
    : "#FFFFFF";

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

  const {
    isResizing,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    getResizeHandles,
    getCursorForHandle,
  } = useResizeShape(shapes, setShapes, selectedShapeId, offset, scale);

  // Get resize handles for selected shape
  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === selectedShapeId),
    [shapes, selectedShapeId]
  );

  const resizeHandles = useMemo(
    () => (selectedShape ? getResizeHandles(selectedShape) : []),
    [selectedShape, getResizeHandles]
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

  // Deselect shape when switching to a different tool
  useEffect(() => {
    if (selectedTool !== "select") {
      setSelectedShapeId(null);
    }
  }, [selectedTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts when editing text
      if (editingTextId) return;

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
  }, [selectedShapeId, undo, redo, setShapes, editingTextId]);

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
      RedrawCanvas(
        ctx,
        shapes,
        selectedShapeId,
        offset,
        scale,
        editingTextId,
        resizeHandles
      );
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [shapes, selectedShapeId, scale, offset, editingTextId, resizeHandles]);

  const handleMouseDown = HandleMouseDown(
    canvasRef,
    shapes,
    selectedTool,
    setShapes,
    selectedShapeId,
    setSelectedShapeId,
    offset,
    scale,
    defaultColor
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

  const handleTextClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
    const newTextbox: textbox = {
      id: Date.now().toString(),
      type: "textbox",
      x: worldPos.x,
      y: worldPos.y,
      width: 150,
      height: 30,
      fontSize: 16,
      htmlContent: "",
      strokeColor: defaultColor,
    };
    setShapes((prev) => [...prev, newTextbox]);
    setEditingTextId(newTextbox.id);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      handlePanStart(e);
    } else if (selectedTool === "text") {
      handleTextClick(e);
    } else if (selectedTool === "eraser") {
      // Start erasing - just track path, delete on mouse up
      setIsErasing(true);
      setEraserPath([{ x: e.clientX, y: e.clientY }]);
    } else if (selectedTool === "select") {
      // Check resize handle first if a shape is selected
      if (selectedShape) {
        const handle = handleResizeStart(e, selectedShape);
        if (handle) {
          return; // Started resizing
        }
      }
      // Otherwise, start drag/select
      handleDragStart(e);
    } else {
      handleMouseDown(e);
    }
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "select") {
      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      const clickedTextbox = shapes.find(
        (s) =>
          s.type === "textbox" &&
          worldPos.x >= s.x &&
          worldPos.x <= s.x + s.width &&
          worldPos.y >= s.y &&
          worldPos.y <= s.y + s.height
      );
      if (clickedTextbox && clickedTextbox.type === "textbox") {
        setEditingTextId(clickedTextbox.id);
      }
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePanMove(e);

    // Drag-erase: track path only, delete on mouse up
    if (isErasing && selectedTool === "eraser") {
      setEraserPath((prev) => [...prev, { x: e.clientX, y: e.clientY }]);
      return;
    }

    if (isResizing) {
      handleResizeMove(e);
      return;
    }

    if (isDragging) {
      handleDragMove(e);
      return;
    }

    if (!isPanning) {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      // Check for resize handle hover
      if (selectedTool === "select" && selectedShape) {
        const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
        const hitRadius = 8 / scale;

        for (const { handle, x, y } of resizeHandles) {
          if (
            Math.abs(worldPos.x - x) <= hitRadius &&
            Math.abs(worldPos.y - y) <= hitRadius
          ) {
            canvas.style.cursor = getCursorForHandle(handle as any);
            return;
          }
        }
      }

      // Track eraser hover position
      if (selectedTool === "eraser") {
        setEraserHoverPos({ x: e.clientX, y: e.clientY });
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
    handleResizeEnd();

    // Erase shapes that intersect with eraser path on release
    if (isErasing && eraserPath.length > 0) {
      const shapesToDelete = new Set<string>();

      // Check each point in the eraser path
      for (const point of eraserPath) {
        const worldPos = screenToWorld(point.x, point.y, offset, scale);
        for (const shape of shapes) {
          if (isPointInShape(shape, worldPos.x, worldPos.y)) {
            shapesToDelete.add(shape.id);
          }
        }
      }

      if (shapesToDelete.size > 0) {
        setShapes((prevShapes) =>
          prevShapes.filter((s) => !shapesToDelete.has(s.id))
        );
      }
    }

    setIsErasing(false);
    setEraserPath([]);
  };

  const handleTextUpdate = (updatedShape: textbox) => {
    setShapes((prevShapes) =>
      prevShapes.map((s) => (s.id === updatedShape.id ? updatedShape : s))
    );
  };

  const editingTextShape = shapes.find(
    (s) => s.id === editingTextId && s.type === "textbox"
  ) as textbox | undefined;

  // Handle shape style changes - update the selected shape
  const handleShapeStyleUpdate = (
    updates: Partial<ShapeStyle> & {
      fontSize?: number;
      fontFamily?: string;
      textAlign?: "left" | "center" | "right";
    }
  ) => {
    if (!selectedShapeId) return;
    setShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === selectedShapeId ? { ...shape, ...updates } : shape
      )
    );
  };

  return (
    <div
      className="h-screen w-screen"
      style={{ backgroundColor: canvasBackground }}
    >
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />

      {/* Screen Settings Sidebar */}
      <ScreenSettingsSidebar
        theme={theme}
        setTheme={setTheme}
        canvasBackground={canvasBackground}
        setCanvasBackground={setCanvasBackground}
        shapes={shapes}
        setShapes={setShapes}
      />

      {/* Shape Settings Sidebar - show when shape is selected */}
      <ShapeSettingsSidebar
        selectedShape={selectedShape || null}
        onUpdateShape={handleShapeStyleUpdate}
        isLightTheme={isLightBackground(canvasBackground)}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
        className={`absolute top-0 left-0 w-full h-full z-0`}
        style={{
          cursor:
            selectedTool === "eraser"
              ? "none"
              : selectedTool === "select"
              ? "default"
              : "crosshair",
        }}
      ></canvas>

      {/* Eraser Trail Visual */}
      {isErasing &&
        eraserPath.length > 0 &&
        (() => {
          // Only show last 20 points for recent drag effect
          const recentPath = eraserPath.slice(-20);
          return (
            <svg
              className="pointer-events-none fixed top-0 left-0 w-full h-full z-50"
              style={{ overflow: "visible" }}
            >
              {/* Gray trail path */}
              <path
                d={recentPath
                  .map((p, i) =>
                    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                  )
                  .join(" ")}
                fill="none"
                stroke="rgba(156, 163, 175, 0.5)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Small circle cursor at current position */}
              <circle
                cx={recentPath[recentPath.length - 1].x}
                cy={recentPath[recentPath.length - 1].y}
                r="4"
                fill="white"
                stroke="#6B7280"
                strokeWidth="1.5"
              />
            </svg>
          );
        })()}

      {/* Eraser Hover Cursor (when not dragging) */}
      {selectedTool === "eraser" && !isErasing && eraserHoverPos && (
        <svg
          className="pointer-events-none fixed top-0 left-0 w-full h-full z-50"
          style={{ overflow: "visible" }}
        >
          <circle
            cx={eraserHoverPos.x}
            cy={eraserHoverPos.y}
            r="4"
            fill="white"
            stroke="#6B7280"
            strokeWidth="1.5"
          />
        </svg>
      )}

      {/* Text Editor Overlay */}
      {editingTextShape && (
        <TextEditor
          textShape={editingTextShape}
          offset={offset}
          scale={scale}
          onUpdate={handleTextUpdate}
          onClose={() => setEditingTextId(null)}
        />
      )}

      {/* Bottom-left controls: Zoom + Undo/Redo */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2 bg-[#1E1E24] rounded-xl p-2 shadow-2xl border border-gray-700/50 z-50">
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
