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
  onShowShortcuts?: () => void;
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

// Icons
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

const OpenIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      strokeWidth="1.25"
      d="m9.257 6.351.183.183H15.819c.34 0 .727.182 1.051.506.323.323.505.708.505 1.05v5.819c0 .316-.183.7-.52 1.035-.337.338-.723.522-1.037.522H4.182c-.352 0-.74-.181-1.058-.5-.318-.318-.499-.705-.499-1.057V5.182c0-.351.181-.736.5-1.054.32-.321.71-.503 1.057-.503H6.53l2.726 2.726Z"
    />
  </svg>
);

const SaveIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      strokeWidth="1.25"
      d="M3.333 14.167v1.666c0 .92.747 1.667 1.667 1.667h10c.92 0 1.667-.746 1.667-1.667v-1.666M5.833 9.167 10 13.333l4.167-4.166M10 3.333v10"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      strokeWidth="1.25"
      d="M3.333 5.833h13.334M8.333 9.167v5M11.667 9.167v5M4.167 5.833l.833 10c0 .92.746 1.667 1.667 1.667h6.666c.92 0 1.667-.746 1.667-1.667l.833-10M7.5 5.833v-2.5c0-.46.373-.833.833-.833h3.334c.46 0 .833.373.833.833v2.5"
    />
  </svg>
);

const HelpIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SystemIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
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
  onShowShortcuts,
}: ScreenSettingsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
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
        if (theme === "system") {
          const newPref = e.matches ? "dark" : "light";
          setCanvasBackground(newPref === "dark" ? "#1a1a1a" : "#FFFFFF");
        }
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, setCanvasBackground]);

  // Set default background on mount
  useEffect(() => {
    if (!canvasBackground) {
      const defaultBg =
        theme === "system"
          ? getSystemPreference() === "dark"
            ? "#1a1a1a"
            : "#FFFFFF"
          : theme === "dark"
          ? "#1a1a1a"
          : "#FFFFFF";
      setCanvasBackground(defaultBg);
    }
  }, [canvasBackground, setCanvasBackground, theme]);

  const resolvedTheme = theme === "system" ? systemPreference : theme;
  const backgroundPresets =
    resolvedTheme === "dark" ? DARK_BACKGROUNDS : LIGHT_BACKGROUNDS;

  const handleThemeChange = (newTheme: "system" | "light" | "dark") => {
    setTheme(newTheme);
    const resolvedTheme =
      newTheme === "system" ? getSystemPreference() : newTheme;
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

  const handleClearCanvas = () => {
    if (confirmClear) {
      setShapes([]);
      setConfirmClear(false);
      setIsOpen(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("rapidraw_canvas");
      }
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleShowShortcuts = () => {
    setIsOpen(false);
    onShowShortcuts?.();
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md bg-[#1E1E24] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a32] transition-colors shadow-xl border border-gray-700/50"
        title="Settings"
      >
        <MenuIcon />
      </button>

      {/* Sidebar Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-35"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-3 top-14 w-52 bg-[#1E1E24] rounded-lg shadow-xl border border-gray-700/50 z-40 overflow-hidden">
            {/* Menu Items */}
            <div className="p-1">
              {/* Open */}
              <button
                onClick={handleOpen}
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700/50 text-xs transition-colors cursor-pointer rounded"
              >
                <OpenIcon />
                Open
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700/50 text-xs transition-colors cursor-pointer rounded"
              >
                <SaveIcon />
                Save to
              </button>

              {/* Reset Canvas */}
              <button
                onClick={handleClearCanvas}
                disabled={shapes.length === 0}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors rounded ${
                  confirmClear
                    ? "bg-red-600 text-white cursor-pointer"
                    : shapes.length === 0
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-300 hover:bg-gray-700/50 cursor-pointer"
                }`}
              >
                <TrashIcon />
                {confirmClear ? "Click to confirm!" : "Reset the canvas"}
              </button>

              {/* Separator */}
              <hr className="border-gray-700 my-1" />

              {/* Help - Keyboard Shortcuts */}
              <button
                onClick={handleShowShortcuts}
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700/50 text-xs transition-colors cursor-pointer rounded"
              >
                <HelpIcon />
                Help - Keyboard shortcuts
              </button>

              {/* Separator */}
              <hr className="border-gray-700 my-1" />

              {/* Theme - inline with icons */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-400 text-xs">Theme</span>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => handleThemeChange("system")}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      theme === "system"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                    title="System"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                    title="Light"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`p-1 rounded transition-all cursor-pointer ${
                      theme === "dark"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                    title="Dark"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Separator */}
              <hr className="border-gray-700 my-1" />

              {/* Canvas Background */}
              <div className="px-3 py-2">
                <label className="text-gray-400 text-xs block mb-1.5">
                  Canvas Background
                </label>
                <div className="flex items-center gap-1">
                  {backgroundPresets.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCanvasBackground(color)}
                      className={`w-5 h-5 rounded border-2 transition-all cursor-pointer ${
                        canvasBackground === color
                          ? "border-indigo-500 scale-110"
                          : "border-gray-600 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Custom Color Picker */}
                  <button
                    onClick={() => colorInputRef.current?.click()}
                    className="w-5 h-5 rounded border-2 border-gray-600 hover:border-gray-400 transition-all relative overflow-hidden cursor-pointer"
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
          </div>
        </>
      )}
    </>
  );
}
