import { useState, useCallback, useRef } from "react";
import { Shape } from "@/app/types/Shapes";

const MAX_HISTORY_SIZE = 50;

interface UseHistoryReturn {
  shapes: Shape[];
  setShapes: (shapes: Shape[] | ((prev: Shape[]) => Shape[])) => void;
  setShapesWithoutHistory: (
    shapes: Shape[] | ((prev: Shape[]) => Shape[])
  ) => void;
  commitToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistory(initialShapes: Shape[] = []): UseHistoryReturn {
  const [history, setHistory] = useState<Shape[][]>([initialShapes]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveShapes, setLiveShapes] = useState<Shape[]>(initialShapes);
  const hasUncommittedChanges = useRef(false);

  const shapes = liveShapes;

  // Normal setShapes - adds to history
  const setShapes = useCallback(
    (update: Shape[] | ((prev: Shape[]) => Shape[])) => {
      const newShapes =
        typeof update === "function" ? update(liveShapes) : update;
      setLiveShapes(newShapes);

      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, currentIndex + 1);
        newHistory.push(newShapes);

        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
          setCurrentIndex(newHistory.length - 1);
          return newHistory;
        }

        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      });
      hasUncommittedChanges.current = false;
    },
    [currentIndex, liveShapes]
  );

  // Update shapes without adding to history (for drag/resize operations)
  const setShapesWithoutHistory = useCallback(
    (update: Shape[] | ((prev: Shape[]) => Shape[])) => {
      const newShapes =
        typeof update === "function" ? update(liveShapes) : update;
      setLiveShapes(newShapes);
      hasUncommittedChanges.current = true;
    },
    [liveShapes]
  );

  // Commit current state to history (call at end of drag/resize)
  const commitToHistory = useCallback(() => {
    if (!hasUncommittedChanges.current) return;

    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(liveShapes);

      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      }

      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
    hasUncommittedChanges.current = false;
  }, [currentIndex, liveShapes]);

  const undo = useCallback(() => {
    // Commit any pending changes first
    if (hasUncommittedChanges.current) {
      commitToHistory();
    }

    setCurrentIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      setLiveShapes(history[newIndex]);
      return newIndex;
    });
  }, [history, commitToHistory]);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = Math.min(history.length - 1, prev + 1);
      setLiveShapes(history[newIndex]);
      return newIndex;
    });
  }, [history]);

  const canUndo = currentIndex > 0 || hasUncommittedChanges.current;
  const canRedo = currentIndex < history.length - 1;

  return {
    shapes,
    setShapes,
    setShapesWithoutHistory,
    commitToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
