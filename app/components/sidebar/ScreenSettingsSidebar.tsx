"use client";
import { useState, useEffect, useRef } from "react";
import { Shape } from "@/app/types/Shapes";

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
        <>
          {/* Invisible backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-35"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-4 top-32 w-56 bg-[#1E1E24] rounded-xl p-4 shadow-2xl border border-gray-700/50 z-40">
            <h3 className="text-white text-sm font-semibold mb-4">
              Screen Settings
            </h3>

            {/* Theme */}
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">Theme</label>
              <div className="flex gap-2">
                {(["system", "light", "dark"] as const).map((t) => (
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

            {/* Separator */}
            <hr className="border-gray-700 my-3" />

            {/* Background Color */}
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">
                Background
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {backgroundPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCanvasBackground(color)}
                    className={`w-6 h-6 rounded-md border-2 transition-all ${
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
                  className="w-6 h-6 rounded-md border-2 border-gray-600 hover:border-gray-400 transition-all relative overflow-hidden"
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
