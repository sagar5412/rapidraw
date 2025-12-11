"use client";

interface HistoryControlsProps {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function HistoryControls({
  undo,
  redo,
  canUndo,
  canRedo,
}: HistoryControlsProps) {
  return (
    <>
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`w-7 h-7 flex items-center justify-center text-white text-sm font-bold rounded-md transition-colors ${
          canUndo ? "hover:bg-[#403E6A]" : "opacity-40 cursor-not-allowed"
        }`}
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`w-7 h-7 flex items-center justify-center text-white text-sm font-bold rounded-md transition-colors ${
          canRedo ? "hover:bg-[#403E6A]" : "opacity-40 cursor-not-allowed"
        }`}
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
    </>
  );
}
