"use client";
import { useState } from "react";
import { Shape } from "@/app/types/Shapes";

interface ScreenSettingsSidebarProps {
  theme: "default" | "light" | "dark";
  setTheme: (theme: "default" | "light" | "dark") => void;
  canvasBackground: string;
  setCanvasBackground: (color: string) => void;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
}

const THEME_BACKGROUNDS = {
  default: "#F5F5F5",
  light: "#FFFFFF",
  dark: "#1a1a1a",
};

const BACKGROUND_PRESETS = [
  "#FFFFFF",
  "#F5F5F5",
  "#E5E5E5",
  "#1a1a1a",
  "#121212",
  "#000000",
];

// Light colors that need to become dark on light backgrounds
const LIGHT_COLORS = ["#FFFFFF", "#FFF", "#F5F5F5", "#E5E5E5", "#FAFAFA"];
// Dark colors that need to become light on dark backgrounds
const DARK_COLORS = ["#000000", "#000", "#1a1a1a", "#121212", "#0D0D0D"];

// Hamburger icon
const MenuIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const isLightColor = (color: string) =>
  LIGHT_COLORS.includes(color.toUpperCase());

const isDarkColor = (color: string) =>
  DARK_COLORS.includes(color.toUpperCase()) || color.toLowerCase() === "black";

export function ScreenSettingsSidebar({
  theme,
  setTheme,
  canvasBackground,
  setCanvasBackground,
  shapes,
  setShapes,
}: ScreenSettingsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState("");

  const handleThemeChange = (newTheme: "default" | "light" | "dark") => {
    const isLightTheme = newTheme === "light" || newTheme === "default";
    const isDarkTheme = newTheme === "dark";

    // Update shapes for contrast
    setShapes((prevShapes) =>
      prevShapes.map((shape) => {
        const currentColor =
          shape.strokeColor || ("color" in shape ? shape.color : "#000000");

        if (isLightTheme && isLightColor(currentColor)) {
          // Light theme + light shape = change to black
          return { ...shape, strokeColor: "#000000" };
        } else if (isDarkTheme && isDarkColor(currentColor)) {
          // Dark theme + dark shape = change to white
          return { ...shape, strokeColor: "#FFFFFF" };
        }
        return shape;
      })
    );

    setTheme(newTheme);
    setCanvasBackground(THEME_BACKGROUNDS[newTheme]);
  };

  const handleCustomHex = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) {
      setCanvasBackground(customHex);
    }
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-20 w-10 h-10 bg-[#1E1E24] rounded-lg flex items-center justify-center text-white hover:bg-[#2a2a32] transition-colors z-50 shadow-lg border border-gray-700/50"
        title="Screen Settings"
      >
        <MenuIcon />
      </button>

      {/* Sidebar Panel */}
      {isOpen && (
        <div className="fixed left-4 top-32 w-56 bg-[#1E1E24] rounded-xl p-4 shadow-2xl border border-gray-700/50 z-40">
          <h3 className="text-white text-sm font-semibold mb-4">
            Screen Settings
          </h3>

          {/* Theme */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Theme</label>
            <div className="flex gap-2">
              {(["default", "light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    theme === t
                      ? "bg-[#6366F1] text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">
              Background
            </label>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {BACKGROUND_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => setCanvasBackground(color)}
                  className={`w-7 h-7 rounded-md border-2 transition-all ${
                    canvasBackground === color
                      ? "border-[#6366F1] scale-110"
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Custom Hex Input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="#RRGGBB"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value.toUpperCase())}
                className="flex-1 bg-gray-700 text-white text-xs px-2 py-1.5 rounded-md border border-gray-600 focus:border-[#6366F1] outline-none"
                maxLength={7}
              />
              <button
                onClick={handleCustomHex}
                className="px-2 py-1.5 bg-[#6366F1] text-white text-xs rounded-md hover:bg-[#5558E3] transition-colors"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
