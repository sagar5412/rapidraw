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
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#232329] rounded-lg p-2 shadow-lg z-50">
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
    </div>
  );
}
