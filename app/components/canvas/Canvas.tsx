"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { Shape, textbox } from "@/app/types/Shapes";
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
      // Start erasing - erase shape under cursor and enable drag erase
      setIsErasing(true);
      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      const shapeToDelete = shapes.find((shape) =>
        isPointInShape(shape, worldPos.x, worldPos.y)
      );
      if (shapeToDelete) {
        setShapes((prevShapes) =>
          prevShapes.filter((s) => s.id !== shapeToDelete.id)
        );
      }
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

    // Drag-erase: continuously erase shapes while dragging with eraser
    if (isErasing && selectedTool === "eraser") {
      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      const shapeToDelete = shapes.find((shape) =>
        isPointInShape(shape, worldPos.x, worldPos.y)
      );
      if (shapeToDelete) {
        setShapes((prevShapes) =>
          prevShapes.filter((s) => s.id !== shapeToDelete.id)
        );
      }
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
    setIsErasing(false);
  };

  const handleTextUpdate = (updatedShape: textbox) => {
    setShapes((prevShapes) =>
      prevShapes.map((s) => (s.id === updatedShape.id ? updatedShape : s))
    );
  };

  const editingTextShape = shapes.find(
    (s) => s.id === editingTextId && s.type === "textbox"
  ) as textbox | undefined;

  return (
    <div className="bg-[#F5F5F5] h-screen w-screen">
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
        className={`absolute top-0 left-0 w-full h-full cursor-${
          selectedTool === "select" ? "default" : "crosshair"
        } z-0`}
      ></canvas>

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
