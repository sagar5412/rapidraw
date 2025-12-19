import React, { useState, RefObject } from "react";

export function useCanvasPan(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
) {
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  const handlePanStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      e.preventDefault();
      setIsPanning(true);
      setLastPan({ x: e.clientX, y: e.clientY });
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grabbing";
      }
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

  return {
    isPanning,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  };
}
