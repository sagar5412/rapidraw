import { selectedShapes } from "@/app/types/Shapes";

interface EraserVisualProps {
  isErasing: boolean;
  eraserPath: { x: number; y: number }[];
  selectedTool: selectedShapes;
  eraserHoverPos: { x: number; y: number } | null;
}

export function EraserVisual({
  isErasing,
  eraserPath,
  selectedTool,
  eraserHoverPos,
}: EraserVisualProps) {
  return (
    <>
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
    </>
  );
}
