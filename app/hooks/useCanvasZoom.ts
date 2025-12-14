import { useState, useCallback, useEffect } from "react";

export const MIN_SCALE = 0.1; // 10%
export const MAX_SCALE = 50; // 5000%
export const ZOOM_STEP = 0.5; // 25% increment for button clicks

interface UseCanvasZoomReturn {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (scale: number) => void;
  handleWheelZoom: (deltaY: number, ctrlKey: boolean) => void;
  zoomPercentage: number;
}

export function useCanvasZoom(initialScale = 1): UseCanvasZoomReturn {
  const [scale, setScale] = useState(initialScale);

  const clampScale = useCallback((value: number) => {
    return Math.max(MIN_SCALE, Math.min(value, MAX_SCALE));
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => clampScale(prev * (1 + ZOOM_STEP)));
  }, [clampScale]);

  const zoomOut = useCallback(() => {
    setScale((prev) => clampScale(prev * (1 - ZOOM_STEP)));
  }, [clampScale]);

  const resetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const setZoom = useCallback(
    (newScale: number) => {
      setScale(clampScale(newScale));
    },
    [clampScale]
  );

  const handleWheelZoom = useCallback(
    (deltaY: number, ctrlKey: boolean) => {
      if (ctrlKey) {
        // Invert deltaY for natural zoom (scroll up = zoom in)
        const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
        setScale((prev) => clampScale(prev * zoomFactor));
      }
    },
    [clampScale]
  );

  const zoomPercentage = Math.round(scale * 100);

  return {
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    handleWheelZoom,
    zoomPercentage,
  };
}
