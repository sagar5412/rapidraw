import { Shape } from "@/app/types/Shapes";

interface BackToContentButtonProps {
  isContentVisible: boolean;
  shapes: Shape[];
  centerOnContent: () => void;
}

export function BackToContentButton({
  isContentVisible,
  shapes,
  centerOnContent,
}: BackToContentButtonProps) {
  if (isContentVisible || shapes.length === 0) return null;

  return (
    <button
      onClick={centerOnContent}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xl border border-indigo-500 z-50 transition-all animate-bounce"
      title="Center view on your drawings"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
      <span className="text-xs font-medium">Back to Content</span>
    </button>
  );
}
