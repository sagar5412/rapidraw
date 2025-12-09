"use client";
import { useState, useEffect, useRef } from "react";
import { Shape, ShapeStyle } from "@/app/types/Shapes";

interface ShapeSettingsSidebarProps {
  selectedShape: Shape | null;
  onUpdateShape: (
    updates: Partial<ShapeStyle> & {
      fontSize?: number;
      fontFamily?: string;
      textAlign?: "left" | "center" | "right";
    }
  ) => void;
  isLightTheme: boolean;
}

const STROKE_WIDTHS = [1, 2, 4];
const STROKE_STYLES: ("solid" | "dashed" | "dotted")[] = [
  "solid",
  "dashed",
  "dotted",
];
const EDGES_OPTIONS: ("sharp" | "rounded")[] = ["sharp", "rounded"];
const FONT_FAMILIES = ["sans-serif", "serif", "monospace", "cursive"];
const FONT_SIZES = [12, 14, 16, 20, 24, 32, 48];
const TEXT_ALIGNS: ("left" | "center" | "right")[] = [
  "left",
  "center",
  "right",
];

// Color picker component with presets
function ColorPicker({
  label,
  currentColor,
  onChange,
  isLightTheme,
  includeTransparent = false,
}: {
  label: string;
  currentColor: string;
  onChange: (color: string) => void;
  isLightTheme: boolean;
  includeTransparent?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Theme-aware presets: black first for light theme, white first for dark
  const baseColors = isLightTheme
    ? ["#000000", "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#FFFFFF"]
    : ["#FFFFFF", "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#000000"];

  const presets = includeTransparent
    ? ["transparent", ...baseColors.slice(0, 5)]
    : baseColors;

  return (
    <div className="mb-4">
      <label className="text-gray-400 text-xs mb-2 block">{label}</label>
      <div className="flex items-center gap-1.5">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded-md border-2 transition-all ${
              currentColor === color
                ? "border-[#6366F1] scale-110"
                : "border-gray-600 hover:border-gray-400"
            }`}
            style={{
              backgroundColor: color === "transparent" ? "transparent" : color,
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

        {/* Divider */}
        <div className="w-px h-5 bg-gray-600 mx-1" />

        {/* Color picker button */}
        <div className="relative">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-6 h-6 rounded-md border-2 border-gray-600 hover:border-gray-400 transition-all flex items-center justify-center bg-gray-700"
            title={`${label} color picker`}
            style={{
              background: `linear-gradient(135deg, #EF4444 0%, #F59E0B 25%, #22C55E 50%, #3B82F6 75%, #8B5CF6 100%)`,
            }}
          />
          <input
            ref={inputRef}
            type="color"
            value={currentColor === "transparent" ? "#000000" : currentColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute opacity-0 w-0 h-0"
          />
        </div>
      </div>
    </div>
  );
}

export function ShapeSettingsSidebar({
  selectedShape,
  onUpdateShape,
  isLightTheme,
}: ShapeSettingsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open when shape is selected
  useEffect(() => {
    if (selectedShape) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [selectedShape?.id]);

  if (!selectedShape) return null;

  // Get current values safely
  const shapeColor = "color" in selectedShape ? selectedShape.color : "#000000";
  const currentStroke = selectedShape.strokeColor || shapeColor;
  const currentFill = selectedShape.fillColor || "transparent";
  const currentWidth = selectedShape.strokeWidth || 1;
  const currentStyle = selectedShape.strokeStyle || "solid";
  const currentEdges = selectedShape.edges || "sharp";
  const currentOpacity = selectedShape.opacity ?? 100;

  // Text-specific values
  const isTextbox = selectedShape.type === "textbox";
  const isFreehand = selectedShape.type === "freehand";
  const isShape = !isTextbox && !isFreehand;

  const currentFontSize = isTextbox ? selectedShape.fontSize || 16 : 16;
  const currentFontFamily = isTextbox
    ? selectedShape.fontFamily || "sans-serif"
    : "sans-serif";
  const currentTextAlign = isTextbox
    ? selectedShape.textAlign || "left"
    : "left";

  if (!isOpen) return null;

  return (
    <div className="fixed left-4 top-32 w-60 bg-[#1E1E24] rounded-xl p-4 shadow-2xl border border-gray-700/50 z-40 max-h-[75vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-sm font-semibold">
          {isTextbox
            ? "Text Settings"
            : isFreehand
            ? "Draw Settings"
            : "Shape Settings"}
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* STROKE/TEXT COLOR - All types */}
      <ColorPicker
        label={isTextbox ? "Text Color" : "Stroke"}
        currentColor={currentStroke}
        onChange={(color) => onUpdateShape({ strokeColor: color })}
        isLightTheme={isLightTheme}
      />

      {/* FILL/BACKGROUND - Shapes and Freehand only */}
      {(isShape || isFreehand) && (
        <ColorPicker
          label="Background"
          currentColor={currentFill}
          onChange={(color) => onUpdateShape({ fillColor: color })}
          isLightTheme={isLightTheme}
          includeTransparent
        />
      )}

      {/* STROKE WIDTH - Shapes and Freehand only */}
      {(isShape || isFreehand) && (
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
      )}

      {/* STROKE STYLE - Shapes only */}
      {isShape && (
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
      )}

      {/* EDGES - Shapes only (not lines/arrows) */}
      {isShape &&
        selectedShape.type !== "line" &&
        selectedShape.type !== "arrow" && (
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Edges</label>
            <div className="flex gap-2">
              {EDGES_OPTIONS.map((edge) => (
                <button
                  key={edge}
                  onClick={() => onUpdateShape({ edges: edge })}
                  className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    currentEdges === edge
                      ? "bg-[#6366F1] text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {edge}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* FONT FAMILY - Textbox only */}
      {isTextbox && (
        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-2 block">
            Font Family
          </label>
          <select
            value={currentFontFamily}
            onChange={(e) => onUpdateShape({ fontFamily: e.target.value })}
            className="w-full bg-gray-700 text-white text-xs px-2 py-2 rounded-md border border-gray-600 focus:border-[#6366F1] outline-none"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* FONT SIZE - Textbox only */}
      {isTextbox && (
        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-2 block">Font Size</label>
          <div className="flex flex-wrap gap-1.5">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onUpdateShape({ fontSize: size })}
                className={`px-2 py-1 rounded-md text-xs transition-all ${
                  currentFontSize === size
                    ? "bg-[#6366F1] text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TEXT ALIGN - Textbox only */}
      {isTextbox && (
        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-2 block">Text Align</label>
          <div className="flex gap-2">
            {TEXT_ALIGNS.map((align) => (
              <button
                key={align}
                onClick={() => onUpdateShape({ textAlign: align })}
                className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-all ${
                  currentTextAlign === align
                    ? "bg-[#6366F1] text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OPACITY - All types */}
      <div className="mb-2">
        <label className="text-gray-400 text-xs mb-2 block">
          Opacity: {currentOpacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={currentOpacity}
          onChange={(e) => onUpdateShape({ opacity: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
        />
      </div>
    </div>
  );
}
