"use client";

interface ZoomControlsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomPercentage: number;
}

export function ZoomControls({
  zoomIn,
  zoomOut,
  zoomPercentage,
}: ZoomControlsProps) {
  return (
    <>
      <button
        onClick={zoomOut}
        className="w-10 h-10 flex items-center justify-center text-white text-xl font-bold hover:bg-[#403E6A] rounded-lg transition-colors"
        title="Zoom Out"
      >
        −
      </button>
      <div className="w-16 text-center text-white text-sm font-medium">
        {zoomPercentage}%
      </div>
      <button
        onClick={zoomIn}
        className="w-10 h-10 flex items-center justify-center text-white text-xl font-bold hover:bg-[#403E6A] rounded-lg transition-colors"
        title="Zoom In"
      >
        +
      </button>
    </>
  );
}
