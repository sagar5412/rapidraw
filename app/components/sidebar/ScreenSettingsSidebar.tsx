"use client";
import { useState, useEffect, useRef } from "react";
import { Shape } from "@/app/types/Shapes";
import {
  downloadRapidrawFile,
  openRapidrawFile,
} from "@/app/types/RapidrawFile";

interface ScreenSettingsSidebarProps {
  theme: "system" | "light" | "dark";
  setTheme: (theme: "system" | "light" | "dark") => void;
  canvasBackground: string;
  setCanvasBackground: (color: string) => void;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
}

// Light background presets (for light theme) - 5 colors
const LIGHT_BACKGROUNDS = [
  "#FFFFFF",
  "#FAFAFA",
  "#F5F5F5",
  "#EEEEEE",
  "#E5E5E5",
];

// Dark background presets (for dark theme) - 5 colors
const DARK_BACKGROUNDS = [
  "#1a1a1a",
  "#1E1E24",
  "#121212",
  "#0D0D0D",
  "#000000",
];

// Light colors that need to become dark on light backgrounds
const LIGHT_COLORS = ["#FFFFFF", "#FFF", "#F5F5F5", "#E5E5E5", "#FAFAFA"];
// Dark colors that need to become light on dark backgrounds
const DARK_COLORS = ["#000000", "#000", "#1a1a1a", "#121212", "#0D0D0D"];

// Icons - smaller
const MenuIcon = () => (
  <svg
    width="16"
    height="16"
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

const SaveIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const OpenIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const isLightColor = (color: string) =>
  LIGHT_COLORS.includes(color.toUpperCase());

const isDarkColor = (color: string) =>
  DARK_COLORS.includes(color.toUpperCase()) || color.toLowerCase() === "black";

// Detect system preference
const getSystemPreference = (): "light" | "dark" => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

export function ScreenSettingsSidebar({
  theme,
  setTheme,
  canvasBackground,
  setCanvasBackground,
  shapes,
  setShapes,
}: ScreenSettingsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">(
    "light"
  );

  // Detect system preference on mount and listen for changes
  useEffect(() => {
    setSystemPreference(getSystemPreference());

    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemPreference(e.matches ? "dark" : "light");
        // If on system mode, update theme automatically
        if (theme === "system") {
          const newPref = e.matches ? "dark" : "light";
          setCanvasBackground(newPref === "dark" ? "#1a1a1a" : "#FFFFFF");
        }
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, setCanvasBackground]);

  // Get effective theme (resolved system preference)
  const effectiveTheme = theme === "system" ? systemPreference : theme;
  const isLightTheme = effectiveTheme === "light";

  // Get background presets based on effective theme
  const backgroundPresets = isLightTheme ? LIGHT_BACKGROUNDS : DARK_BACKGROUNDS;

  const handleThemeChange = (newTheme: "system" | "light" | "dark") => {
    const resolvedTheme = newTheme === "system" ? systemPreference : newTheme;
    const isLightNew = resolvedTheme === "light";
    const isDarkNew = resolvedTheme === "dark";

    // Update shapes for contrast
    setShapes((prevShapes) =>
      prevShapes.map((shape) => {
        const currentColor =
          shape.strokeColor || ("color" in shape ? shape.color : "#000000");

        if (isLightNew && isLightColor(currentColor)) {
          // Light theme + light shape = change to black
          return { ...shape, strokeColor: "#000000" };
        } else if (isDarkNew && isDarkColor(currentColor)) {
          // Dark theme + dark shape = change to white
          return { ...shape, strokeColor: "#FFFFFF" };
        }
        return shape;
      })
    );

    setTheme(newTheme);
    // Set default background for the theme
    const defaultBg = resolvedTheme === "dark" ? "#1a1a1a" : "#FFFFFF";
    setCanvasBackground(defaultBg);
  };

  const handleSave = () => {
    const filename = `rapidraw-${Date.now()}`;
    downloadRapidrawFile(shapes, canvasBackground, theme, filename);
    setIsOpen(false);
  };

  const handleOpen = async () => {
    const file = await openRapidrawFile();
    if (file) {
      setShapes(file.shapes);
      setCanvasBackground(file.canvas.background);
      setTheme(file.canvas.theme);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Hamburger Menu Button - positioned in top bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md bg-[#1E1E24] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a32] transition-colors shadow-xl border border-gray-700/50"
        title="Screen Settings"
      >
        <MenuIcon />
      </button>

      {/* Sidebar Panel */}
      {isOpen && (
        <>
          {/* Invisible backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-35"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-3 top-14 w-52 bg-[#1E1E24] rounded-lg p-3 shadow-xl border border-gray-700/50 z-40">
            <h3 className="text-white text-xs font-semibold mb-2">Settings</h3>

            {/* File Operations */}
            <div className="mb-2">
              <label className="text-gray-400 text-[10px] mb-1 block uppercase tracking-wider">
                File
              </label>
              <div className="flex gap-1">
                <button
                  onClick={handleOpen}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-[10px] transition-all"
                  title="Open .rapidraw file"
                >
                  <OpenIcon />
                  Open
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] transition-all"
                  title="Save as .rapidraw file"
                >
                  <SaveIcon />
                  Save
                </button>
              </div>
            </div>

            {/* Separator */}
            <hr className="border-gray-700 my-2" />

            {/* Theme */}
            <div className="mb-2">
              <label className="text-gray-400 text-[10px] mb-1 block uppercase tracking-wider">
                Theme
              </label>
              <div className="flex gap-1">
                {(["system", "light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`px-2 py-1 rounded text-[10px] capitalize transition-all ${
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

            {/* Separator */}
            <hr className="border-gray-700 my-2" />

            {/* Background Color */}
            <div>
              <label className="text-gray-400 text-[10px] mb-1 block uppercase tracking-wider">
                Background
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {backgroundPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCanvasBackground(color)}
                    className={`w-5 h-5 rounded border-2 transition-all ${
                      canvasBackground === color
                        ? "border-[#6366F1] scale-110"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {/* Color Picker */}
                <button
                  onClick={() => colorInputRef.current?.click()}
                  className="w-5 h-5 rounded border-2 border-gray-600 hover:border-gray-400 transition-all relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #E5E5E5 0%, #1a1a1a 100%)",
                  }}
                  title="Custom color"
                >
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={canvasBackground}
                    onChange={(e) => setCanvasBackground(e.target.value)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
