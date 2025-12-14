"use client";

interface ZoomControlsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomPercentage: number;
}

export function ZoomControls({
  zoomIn,
  zoomOut,
  resetZoom,
  zoomPercentage,
}: ZoomControlsProps) {
  const isNotDefault = zoomPercentage !== 100;

  return (
    <>
      <button
        onClick={zoomOut}
        className="w-7 h-7 flex items-center justify-center text-white text-base font-bold hover:bg-[#403E6A] rounded-md transition-colors"
        title="Zoom Out"
      >
        −
      </button>
      <button
        onClick={resetZoom}
        className={`w-12 text-center text-xs font-medium rounded transition-colors ${
          isNotDefault
            ? "text-indigo-400 hover:bg-[#403E6A] cursor-pointer"
            : "text-white cursor-default"
        }`}
        title={isNotDefault ? "Reset to 100%" : "Zoom: 100%"}
        disabled={!isNotDefault}
      >
        {zoomPercentage}%
      </button>
      <button
        onClick={zoomIn}
        className="w-7 h-7 flex items-center justify-center text-white text-base font-bold hover:bg-[#403E6A] rounded-md transition-colors"
        title="Zoom In"
      >
        +
      </button>
    </>
  );
}
