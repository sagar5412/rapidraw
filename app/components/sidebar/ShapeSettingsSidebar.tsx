"use client";
import { useState } from "react";
import { Shape, ShapeStyle } from "@/app/types/Shapes";

interface ShapeSettingsSidebarProps {
  selectedShape: Shape | null;
  onUpdateShape: (updates: Partial<ShapeStyle>) => void;
}

const STROKE_PRESETS = ["#000000", "#EF4444", "#3B82F6", "#22C55E", "#F59E0B"];
const FILL_PRESETS = [
  "transparent",
  "#FEE2E2",
  "#DBEAFE",
  "#DCFCE7",
  "#FEF3C7",
];
const STROKE_WIDTHS = [1, 2, 4];
const STROKE_STYLES: ("solid" | "dashed" | "dotted")[] = [
  "solid",
  "dashed",
  "dotted",
];

// Settings icon
const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
);

export function ShapeSettingsSidebar({
  selectedShape,
  onUpdateShape,
}: ShapeSettingsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStrokeHex, setCustomStrokeHex] = useState("");
  const [customFillHex, setCustomFillHex] = useState("");

  if (!selectedShape) return null;

  // Get color safely - some shapes have color, some don't (textbox)
  const shapeColor = "color" in selectedShape ? selectedShape.color : "#000000";
  const currentStroke = selectedShape.strokeColor || shapeColor;
  const currentFill = selectedShape.fillColor || "transparent";
  const currentWidth = selectedShape.strokeWidth || 1;
  const currentStyle = selectedShape.strokeStyle || "solid";
  const currentOpacity = selectedShape.opacity ?? 100;

  const handleCustomStroke = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customStrokeHex)) {
      onUpdateShape({ strokeColor: customStrokeHex });
      setCustomStrokeHex("");
    }
  };

  const handleCustomFill = () => {
    if (
      /^#[0-9A-Fa-f]{6}$/.test(customFillHex) ||
      customFillHex.toLowerCase() === "transparent"
    ) {
      onUpdateShape({ fillColor: customFillHex || "transparent" });
      setCustomFillHex("");
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-36 w-10 h-10 bg-[#1E1E24] rounded-lg flex items-center justify-center text-white hover:bg-[#2a2a32] transition-colors z-50 shadow-lg border border-gray-700/50"
        title="Shape Settings"
      >
        <SettingsIcon />
      </button>

      {/* Sidebar Panel */}
      {isOpen && (
        <div className="fixed left-16 top-36 w-56 bg-[#1E1E24] rounded-xl p-4 shadow-2xl border border-gray-700/50 z-40 max-h-[70vh] overflow-y-auto">
          <h3 className="text-white text-sm font-semibold mb-4">
            Shape Settings
          </h3>

          {/* Stroke Color */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Stroke</label>
            <div className="flex gap-1.5 mb-2">
              {STROKE_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateShape({ strokeColor: color })}
                  className={`w-7 h-7 rounded-md border-2 transition-all ${
                    currentStroke === color
                      ? "border-[#6366F1] scale-110"
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="#RRGGBB"
                value={customStrokeHex}
                onChange={(e) =>
                  setCustomStrokeHex(e.target.value.toUpperCase())
                }
                className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded-md border border-gray-600 focus:border-[#6366F1] outline-none"
                maxLength={7}
              />
              <button
                onClick={handleCustomStroke}
                className="px-2 py-1 bg-[#6366F1] text-white text-xs rounded-md hover:bg-[#5558E3]"
              >
                Set
              </button>
            </div>
          </div>

          {/* Fill Color */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Fill</label>
            <div className="flex gap-1.5 mb-2">
              {FILL_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateShape({ fillColor: color })}
                  className={`w-7 h-7 rounded-md border-2 transition-all ${
                    currentFill === color
                      ? "border-[#6366F1] scale-110"
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                  style={{
                    backgroundColor:
                      color === "transparent" ? "transparent" : color,
                    backgroundImage:
                      color === "transparent"
                        ? "linear-gradient(45deg, #666 25%, transparent 25%), linear-gradient(-45deg, #666 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #666 75%), linear-gradient(-45deg, transparent 75%, #666 75%)"
                        : "none",
                    backgroundSize: "6px 6px",
                    backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                  }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="#RRGGBB"
                value={customFillHex}
                onChange={(e) => setCustomFillHex(e.target.value.toUpperCase())}
                className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded-md border border-gray-600 focus:border-[#6366F1] outline-none"
                maxLength={11}
              />
              <button
                onClick={handleCustomFill}
                className="px-2 py-1 bg-[#6366F1] text-white text-xs rounded-md hover:bg-[#5558E3]"
              >
                Set
              </button>
            </div>
          </div>

          {/* Stroke Width */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">
              Stroke Width
            </label>
            <div className="flex gap-2">
              {STROKE_WIDTHS.map((width) => (
                <button
                  key={width}
                  onClick={() => onUpdateShape({ strokeWidth: width })}
                  className={`flex-1 py-2 rounded-lg text-xs transition-all flex items-center justify-center ${
                    currentWidth === width
                      ? "bg-[#6366F1] text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <div
                    className="bg-current rounded-full"
                    style={{ width: width * 3 + 2, height: width * 3 + 2 }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Style */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">
              Stroke Style
            </label>
            <div className="flex gap-2">
              {STROKE_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdateShape({ strokeStyle: style })}
                  className={`flex-1 py-2 rounded-lg text-xs capitalize transition-all ${
                    currentStyle === style
                      ? "bg-[#6366F1] text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <svg width="100%" height="8" className="px-1">
                    <line
                      x1="2"
                      y1="4"
                      x2="98%"
                      y2="4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={
                        style === "dashed"
                          ? "6,4"
                          : style === "dotted"
                          ? "2,3"
                          : "none"
                      }
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div className="mb-2">
            <label className="text-gray-400 text-xs mb-2 block">
              Opacity: {currentOpacity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={currentOpacity}
              onChange={(e) =>
                onUpdateShape({ opacity: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
            />
          </div>
        </div>
      )}
    </>
  );
}
