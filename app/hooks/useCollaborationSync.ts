import React, { useEffect, useRef, useCallback } from "react";
import { Shape } from "@/app/types/Shapes";
import { useCollaboration } from "@/app/context/CollaborationContext";

export function useCollaborationSync(
  shapes: Shape[],
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  backupLocalCanvas: () => void,
  restoreLocalCanvas: () => void,
  undo: () => void,
  redo: () => void
) {
  const {
    isCollaborating,
    emitShapeAdd,
    emitShapeUpdate,
    emitShapeDelete,
    emitShapesSync,
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
      // Backup current local canvas before loading session
      backupLocalCanvas();

      // Clear canvas and load session shapes
      isRemoteUpdateRef.current = true;
      if (state.shapes.length > 0) {
        setShapes(state.shapes);
      } else {
        // Clear canvas for fresh session
        setShapes([]);
      }
      isRemoteUpdateRef.current = false;
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
    backupLocalCanvas,
  ]);

  // Restore local canvas when leaving a session
  const wasCollaboratingRef = useRef(isCollaborating);
  useEffect(() => {
    // Detect when we stop collaborating
    if (wasCollaboratingRef.current && !isCollaborating) {
      console.log("Left collaboration session, restoring local canvas");
      restoreLocalCanvas();
    }
    wasCollaboratingRef.current = isCollaborating;
  }, [isCollaborating, restoreLocalCanvas]);

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

  return {
    isRemoteUpdateRef,
    handleUndo,
    handleRedo,
    emitShapeAdd,
    emitShapeUpdate,
    emitShapeDelete,
    isCollaborating,
  };
}
