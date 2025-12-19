import React, { useEffect, useState } from "react";
import { Shape, selectedShapes } from "@/app/types/Shapes";

export function useKeyboardShortcuts({
  selectedTool,
  setSelectedTool,
  selectedShapeId,
  setSelectedShapeId,
  shapes,
  setShapes,
  editingTextId,
  handleUndo,
  handleRedo,
  saveFile,
  saveFileAs,
  canvasBackground,
  theme,
  isCollaborating,
  isRemoteUpdateRef,
  emitShapeAdd,
  emitShapeDelete,
  setSaveStatus,
  setShowShortcuts,
}: {
  selectedTool: selectedShapes;
  setSelectedTool: (tool: selectedShapes) => void;
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  editingTextId: string | null;
  handleUndo: () => void;
  handleRedo: () => void;
  saveFile: (
    shapes: Shape[],
    background: string,
    theme: "system" | "light" | "dark"
  ) => Promise<boolean>;
  saveFileAs: (
    shapes: Shape[],
    background: string,
    theme: "system" | "light" | "dark"
  ) => Promise<boolean>;
  canvasBackground: string;
  theme: "system" | "light" | "dark";
  isCollaborating: boolean;
  isRemoteUpdateRef: React.MutableRefObject<boolean>;
  emitShapeAdd: (shape: Shape) => void;
  emitShapeDelete: (id: string) => void;
  setSaveStatus: (status: "idle" | "saving" | "saved") => void;
  setShowShortcuts: (show: boolean) => void;
}) {
  const [clipboard, setClipboard] = useState<Shape | null>(null);

  // Deselect shape when switching to a different tool
  useEffect(() => {
    if (selectedTool !== "select") {
      setSelectedShapeId(null);
    }
  }, [selectedTool, setSelectedShapeId]);

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

      // Tool shortcuts (only when not using Ctrl/Meta)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case "v":
            setSelectedTool("select");
            break;
          case "r":
            setSelectedTool("rectangle");
            break;
          case "c":
            setSelectedTool("circle");
            break;
          case "d":
            setSelectedTool("diamond");
            break;
          case "l":
            setSelectedTool("line");
            break;
          case "a":
            setSelectedTool("arrow");
            break;
          case "p":
            setSelectedTool("freehand");
            break;
          case "t":
            setSelectedTool("text");
            break;
          case "e":
            setSelectedTool("eraser");
            break;
        }
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

      // Save (Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setSaveStatus("saving");
        saveFile(shapes, canvasBackground, theme).then((success) => {
          setSaveStatus(success ? "saved" : "idle");
          if (success) {
            setTimeout(() => setSaveStatus("idle"), 2000);
          }
        });
      }

      // Save As (Ctrl+Shift+S)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        setSaveStatus("saving");
        saveFileAs(shapes, canvasBackground, theme).then((success) => {
          setSaveStatus(success ? "saved" : "idle");
          if (success) {
            setTimeout(() => setSaveStatus("idle"), 2000);
          }
        });
      }

      // Show keyboard shortcuts (?)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts(true);
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
    saveFile,
    saveFileAs,
    canvasBackground,
    theme,
    selectedTool,
    setSelectedShapeId,
    isRemoteUpdateRef,
    setSaveStatus,
    setShowShortcuts,
  ]);
}
