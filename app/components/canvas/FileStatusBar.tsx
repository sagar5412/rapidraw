import React from "react";
import { Shape } from "@/app/types/Shapes";

interface FileStatusBarProps {
  fileState: { name: string; hasUnsavedChanges: boolean };
  saveStatus: "idle" | "saving" | "saved";
  setSaveStatus: React.Dispatch<
    React.SetStateAction<"idle" | "saving" | "saved">
  >;
  saveFile: (
    shapes: Shape[],
    background: string,
    theme: "system" | "light" | "dark"
  ) => Promise<boolean>;
  saveFileAs: (
    shapes: Shape[],
    background: string,
    theme: "system" | "light" | "dark"
  ) => Promise<boolean>;
  shapes: Shape[];
  canvasBackground: string;
  theme: "system" | "light" | "dark";
}

export function FileStatusBar({
  fileState,
  saveStatus,
  setSaveStatus,
  saveFile,
  saveFileAs,
  shapes,
  canvasBackground,
  theme,
}: FileStatusBarProps) {
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-[#1E1E24] rounded-lg p-1.5 shadow-xl border border-gray-700/50 z-50">
      {/* File name */}
      <span
        className="text-gray-400 text-[10px] px-1 max-w-[100px] truncate"
        title={fileState.name}
      >
        {fileState.name}
        {fileState.hasUnsavedChanges && (
          <span className="text-yellow-400 ml-0.5">•</span>
        )}
      </span>

      {/* Save status indicator */}
      {saveStatus === "saving" && (
        <span className="text-gray-400 text-[10px] animate-pulse">
          Saving...
        </span>
      )}
      {saveStatus === "saved" && (
        <span className="text-green-400 text-[10px]">✓ Saved</span>
      )}

      {/* Divider */}
      <div className="w-px h-4 bg-gray-600"></div>

      {/* Save button */}
      <button
        onClick={() => {
          setSaveStatus("saving");
          saveFile(shapes, canvasBackground, theme).then((success) => {
            setSaveStatus(success ? "saved" : "idle");
            if (success) setTimeout(() => setSaveStatus("idle"), 2000);
          });
        }}
        className="px-2 py-1 text-[10px] text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
        title="Save (Ctrl+S)"
      >
        Save
      </button>

      {/* Save As button */}
      <button
        onClick={() => {
          setSaveStatus("saving");
          saveFileAs(shapes, canvasBackground, theme).then((success) => {
            setSaveStatus(success ? "saved" : "idle");
            if (success) setTimeout(() => setSaveStatus("idle"), 2000);
          });
        }}
        className="px-2 py-1 text-[10px] text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
        title="Save As (Ctrl+Shift+S)"
      >
        Save As
      </button>
    </div>
  );
}
