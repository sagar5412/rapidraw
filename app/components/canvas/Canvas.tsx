"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
import { useCollaboration } from "@/app/context/CollaborationContext";
import { CollaborationPanel } from "@/app/components/ui/CollaborationPanel";
import { UserCursors } from "@/app/components/canvas/UserCursors";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    shapes,
    setShapes,
    setShapesWithoutHistory,
    commitToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory([]);
  const [selectedTool, setSelectedTool] = useState<selectedShapes>("select");
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

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<Shape | null>(null);

  // Screen settings
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [canvasBackground, setCanvasBackground] = useState("");
  const [screenSettingsOpen, setScreenSettingsOpen] = useState(false);
  const [collabPanelOpen, setCollabPanelOpen] = useState(false);

  // Collaboration
  const {
    isConnected,
    isCollaborating,
    emitShapeAdd,
    emitShapeUpdate,
    emitShapeDelete,
    emitShapesSync,
    emitCursorMove,
    setOnRemoteShapeAdd,
    setOnRemoteShapeUpdate,
    setOnRemoteShapeDelete,
    setOnRemoteShapesSync,
    setOnRoomState,
  } = useCollaboration();

  // Track if update is from remote to prevent re-emission
  const isRemoteUpdateRef = useRef(false);

  // Ref to track latest shapes for undo/redo sync
  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;

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
      setShapesWithoutHistory,
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
  } = useResizeShape(
    shapes,
    setShapesWithoutHistory,
    selectedShapeId,
    offset,
    scale
  );

  // Get resize handles for selected shape
  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === selectedShapeId),
    [shapes, selectedShapeId]
  );

  const resizeHandles = useMemo(
    () => (selectedShape ? getResizeHandles(selectedShape) : []),
    [selectedShape, getResizeHandles]
  );

  // Set initial background based on system preference on mount
  useEffect(() => {
    if (
      theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia
    ) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setCanvasBackground(isDark ? "#1a1a1a" : "#FFFFFF");
    }
  }, []); // Only run on mount

  // Setup collaboration handlers
  useEffect(() => {
    // Handle remote shape additions
    setOnRemoteShapeAdd((shape: Shape) => {
      isRemoteUpdateRef.current = true;
      setShapes((prev) => {
        if (prev.find((s) => s.id === shape.id)) return prev;
        return [...prev, shape];
      });
      isRemoteUpdateRef.current = false;
    });

    // Handle remote shape updates
    setOnRemoteShapeUpdate((shapeId: string, updates: Partial<Shape>) => {
      isRemoteUpdateRef.current = true;
      setShapes((prev) =>
        prev.map((s) =>
          s.id === shapeId ? ({ ...s, ...updates } as Shape) : s
        )
      );
      isRemoteUpdateRef.current = false;
    });

    // Handle remote shape deletions
    setOnRemoteShapeDelete((shapeId: string) => {
      isRemoteUpdateRef.current = true;
      setShapes((prev) => prev.filter((s) => s.id !== shapeId));
      isRemoteUpdateRef.current = false;
    });

    // Handle room state (initial sync)
    setOnRoomState((state) => {
      if (state.shapes.length > 0) {
        isRemoteUpdateRef.current = true;
        setShapes(state.shapes);
        isRemoteUpdateRef.current = false;
      }
    });

    // Handle full shapes sync (from undo/redo)
    setOnRemoteShapesSync((shapes: Shape[]) => {
      isRemoteUpdateRef.current = true;
      setShapes(shapes);
      isRemoteUpdateRef.current = false;
    });

    return () => {
      setOnRemoteShapeAdd(null);
      setOnRemoteShapeUpdate(null);
      setOnRemoteShapeDelete(null);
      setOnRemoteShapesSync(null);
      setOnRoomState(null);
    };
  }, [
    setOnRemoteShapeAdd,
    setOnRemoteShapeUpdate,
    setOnRemoteShapeDelete,
    setOnRemoteShapesSync,
    setOnRoomState,
    setShapes,
  ]);

  // Wrapper functions for undo/redo with collaboration sync
  const handleUndo = useCallback(() => {
    undo();
    if (isCollaborating) {
      setTimeout(() => {
        emitShapesSync(shapesRef.current);
      }, 50);
    }
  }, [undo, isCollaborating, emitShapesSync]);

  const handleRedo = useCallback(() => {
    redo();
    if (isCollaborating) {
      setTimeout(() => {
        emitShapesSync(shapesRef.current);
      }, 50);
    }
  }, [redo, isCollaborating, emitShapesSync]);

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
        // Emit deletion for collaboration
        if (isCollaborating && !isRemoteUpdateRef.current) {
          emitShapeDelete(selectedShapeId);
        }
        setShapes((prevShapes) =>
          prevShapes.filter((shape) => shape.id !== selectedShapeId)
        );
        setSelectedShapeId(null);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }

      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedShapeId) {
        e.preventDefault();
        const shapeToCopy = shapes.find((s) => s.id === selectedShapeId);
        if (shapeToCopy) {
          setClipboard({ ...shapeToCopy });
        }
      }

      // Paste (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboard) {
        e.preventDefault();
        const pasteOffset = 20; // Offset pasted shape by 20px
        const newId = Date.now().toString();

        let pastedShape: Shape;

        if (clipboard.type === "line" || clipboard.type === "arrow") {
          // For line/arrow shapes, offset all points
          pastedShape = {
            ...clipboard,
            id: newId,
            x1: clipboard.x1 + pasteOffset,
            y1: clipboard.y1 + pasteOffset,
            x2: clipboard.x2 + pasteOffset,
            y2: clipboard.y2 + pasteOffset,
          } as Shape;
        } else if (clipboard.type === "freehand") {
          // For freehand, offset all points
          pastedShape = {
            ...clipboard,
            id: newId,
            points: clipboard.points.map((p) => ({
              x: p.x + pasteOffset,
              y: p.y + pasteOffset,
            })),
          } as Shape;
        } else {
          // For all other shapes with x, y coords
          pastedShape = {
            ...clipboard,
            id: newId,
            x: (clipboard as any).x + pasteOffset,
            y: (clipboard as any).y + pasteOffset,
          } as Shape;
        }

        setShapes((prev) => [...prev, pastedShape]);
        setSelectedShapeId(newId);

        // Emit for collaboration
        if (isCollaborating) {
          emitShapeAdd(pastedShape);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedShapeId,
    handleUndo,
    handleRedo,
    setShapes,
    editingTextId,
    emitShapeDelete,
    isCollaborating,
    shapes,
    clipboard,
    emitShapeAdd,
  ]);

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
    defaultColor,
    () => setSelectedTool("select"), // Switch back to select after drawing
    (shape) => {
      // Emit for collaboration
      if (isCollaborating) {
        emitShapeAdd(shape);
      }
    }
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
    // Emit for collaboration
    if (isCollaborating) {
      emitShapeAdd(newTextbox);
    }
    setEditingTextId(newTextbox.id);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't process canvas clicks while editing text
    if (editingTextId) {
      return;
    }

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
    const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);

    // Check if double-clicking on an existing textbox
    const clickedTextbox = shapes.find(
      (s) =>
        s.type === "textbox" &&
        worldPos.x >= s.x &&
        worldPos.x <= s.x + s.width &&
        worldPos.y >= s.y &&
        worldPos.y <= s.y + s.height
    );

    if (clickedTextbox && clickedTextbox.type === "textbox") {
      // Edit existing textbox
      setSelectedShapeId(null);
      setEditingTextId(clickedTextbox.id);
    } else {
      // Create new textbox at double-click position
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
      // Emit for collaboration
      if (isCollaborating) {
        emitShapeAdd(newTextbox);
      }
      setEditingTextId(newTextbox.id);
      // Switch to select tool for editing
      setSelectedTool("select");
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePanMove(e);

    // Emit cursor position for collaboration
    if (isCollaborating) {
      const worldPos = screenToWorld(e.clientX, e.clientY, offset, scale);
      emitCursorMove(worldPos);
    }

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

    // Commit to history and emit for collaboration if we were dragging or resizing
    if (isDragging || isResizing) {
      commitToHistory();

      // Emit shape update for collaboration after drag/resize
      if (isCollaborating && selectedShapeId) {
        const updatedShape = shapes.find((s) => s.id === selectedShapeId);
        if (updatedShape) {
          emitShapeUpdate(selectedShapeId, updatedShape);
        }
      }
    }

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
        // Emit deletions for collaboration
        if (isCollaborating) {
          shapesToDelete.forEach((id) => emitShapeDelete(id));
        }
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
    // Emit for collaboration
    if (isCollaborating) {
      emitShapeUpdate(updatedShape.id, updatedShape);
    }
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
    // Emit for collaboration
    if (isCollaborating) {
      emitShapeUpdate(selectedShapeId, updates);
    }
  };

  // Don't render until background is determined (prevents flash)
  if (!canvasBackground) {
    return (
      <div
        className="h-screen w-screen"
        style={{ backgroundColor: "#1a1a1a" }}
      />
    );
  }

  return (
    <div
      className="h-screen w-screen"
      style={{ backgroundColor: canvasBackground }}
    >
      {/* Top Bar - Screen Settings (left) | Toolbar (center) | Collaborate (right) */}
      <div className="fixed top-3 left-0 right-0 z-50 flex items-center justify-between px-3">
        {/* Left - Screen Settings */}
        <ScreenSettingsSidebar
          theme={theme}
          setTheme={setTheme}
          canvasBackground={canvasBackground}
          setCanvasBackground={setCanvasBackground}
          shapes={shapes}
          setShapes={setShapes}
        />

        {/* Center - Toolbar */}
        <Toolbar
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
        />

        {/* Right - Collaboration */}
        <CollaborationPanel />
      </div>

      {/* Remote User Cursors */}
      {isCollaborating && <UserCursors offset={offset} scale={scale} />}

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
          isLightTheme={isLightBackground(canvasBackground)}
        />
      )}

      {/* Bottom-left controls: Zoom + Undo/Redo */}
      <div className="fixed bottom-4 left-4 flex items-center gap-1 bg-[#1E1E24] rounded-lg p-1.5 shadow-xl border border-gray-700/50 z-50">
        <ZoomControls
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          zoomPercentage={zoomPercentage}
        />
        <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
        <HistoryControls
          undo={handleUndo}
          redo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
    </div>
  );
}
