import { useState, useCallback } from "react";
import { Shape } from "@/app/types/Shapes";

const MAX_HISTORY_SIZE = 50;

interface UseHistoryReturn {
  shapes: Shape[];
  setShapes: (shapes: Shape[] | ((prev: Shape[]) => Shape[])) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistory(initialShapes: Shape[] = []): UseHistoryReturn {
  const [history, setHistory] = useState<Shape[][]>([initialShapes]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const shapes = history[currentIndex];

  const setShapes = useCallback(
    (update: Shape[] | ((prev: Shape[]) => Shape[])) => {
      setHistory((prevHistory) => {
        const currentShapes = prevHistory[currentIndex];
        const newShapes =
          typeof update === "function" ? update(currentShapes) : update;

        const newHistory = prevHistory.slice(0, currentIndex + 1);
        newHistory.push(newShapes);

        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
          return newHistory;
        }

        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [currentIndex]
  );

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    shapes,
    setShapes,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
