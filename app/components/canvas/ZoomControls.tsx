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
        className="w-7 h-7 flex items-center justify-center text-white text-base font-bold hover:bg-[#403E6A] rounded-md transition-colors"
        title="Zoom Out"
      >
        −
      </button>
      <div className="w-10 text-center text-white text-xs font-medium">
        {zoomPercentage}%
      </div>
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
