"use client";
import { selectedShapes } from "@/app/types/Shapes";

interface ToolbarProps {
  selectedTool: selectedShapes;
  setSelectedTool: (tool: selectedShapes) => void;
}

// SVG Icons as components
const SelectIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    <path d="M13 13l6 6" />
  </svg>
);

const RectangleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const CircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const LineIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="5" y1="19" x2="19" y2="5" />
    <polyline points="9 5 19 5 19 15" />
  </svg>
);

const DrawIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
  </svg>
);

const DiamondIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 2L22 12L12 22L2 12Z" />
  </svg>
);

const TextIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const EraserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8l10-10c.8-.8 2-.8 2.8 0l5.6 5.6c.8.8.8 2 0 2.8L12.6 20" />
    <path d="M6 12l6-6" />
  </svg>
);

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const ToolButton = ({ icon, label, isSelected, onClick }: ToolButtonProps) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-3 rounded-lg transition-all duration-200 hover:bg-[#504E7A] ${
      isSelected
        ? "bg-[#6366F1] text-white shadow-lg shadow-indigo-500/30"
        : "text-gray-400 hover:text-white"
    }`}
  >
    {icon}
  </button>
);

export function Toolbar({ selectedTool, setSelectedTool }: ToolbarProps) {
  const tools = [
    {
      id: "select" as selectedShapes,
      icon: <SelectIcon />,
      label: "Select (V)",
    },
    {
      id: "rectangle" as selectedShapes,
      icon: <RectangleIcon />,
      label: "Rectangle (R)",
    },
    {
      id: "circle" as selectedShapes,
      icon: <CircleIcon />,
      label: "Circle (C)",
    },
    {
      id: "diamond" as selectedShapes,
      icon: <DiamondIcon />,
      label: "Diamond (D)",
    },
    { id: "line" as selectedShapes, icon: <LineIcon />, label: "Line (L)" },
    { id: "arrow" as selectedShapes, icon: <ArrowIcon />, label: "Arrow (A)" },
    { id: "freehand" as selectedShapes, icon: <DrawIcon />, label: "Draw (P)" },
    { id: "text" as selectedShapes, icon: <TextIcon />, label: "Text (T)" },
    {
      id: "eraser" as selectedShapes,
      icon: <EraserIcon />,
      label: "Eraser (E)",
    },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-[#1E1E24] px-3 py-2 rounded-xl shadow-2xl border border-gray-700/50 backdrop-blur-sm">
        {tools.map((tool, index) => (
          <div key={tool.id} className="flex items-center">
            <ToolButton
              icon={tool.icon}
              label={tool.label}
              isSelected={selectedTool === tool.id}
              onClick={() => setSelectedTool(tool.id)}
            />
            {/* Add separator between shape tools and other tools */}
            {(index === 0 || index === 5 || index === 7) && (
              <div className="w-px h-6 bg-gray-600/50 mx-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
