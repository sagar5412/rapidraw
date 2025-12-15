"use client";
import { useEffect, useRef } from "react";

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: Shortcut[];
}

const SHORTCUTS: ShortcutSection[] = [
  {
    title: "Tools",
    shortcuts: [
      { keys: ["V"], description: "Select tool" },
      { keys: ["R"], description: "Rectangle" },
      { keys: ["C"], description: "Circle" },
      { keys: ["D"], description: "Diamond" },
      { keys: ["L"], description: "Line" },
      { keys: ["A"], description: "Arrow" },
      { keys: ["P"], description: "Freehand/Pen" },
      { keys: ["T"], description: "Text" },
      { keys: ["E"], description: "Eraser" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Y"], description: "Redo" },
      { keys: ["Ctrl", "C"], description: "Copy" },
      { keys: ["Ctrl", "V"], description: "Paste" },
      { keys: ["Delete", "/", "Backspace"], description: "Delete selected" },
    ],
  },
  {
    title: "File",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save" },
      { keys: ["Ctrl", "Shift", "S"], description: "Save As" },
    ],
  },
  {
    title: "Canvas",
    shortcuts: [
      { keys: ["Space", "Drag"], description: "Pan canvas" },
      { keys: ["Ctrl", "Scroll"], description: "Zoom in/out" },
      { keys: ["Double Click"], description: "Create textbox" },
    ],
  },
  {
    title: "View",
    shortcuts: [{ keys: ["?"], description: "Show shortcuts" }],
  },
];

const KeyIcon = ({ char }: { char: string }) => (
  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-gray-700 rounded text-[10px] font-mono font-medium text-gray-200 border border-gray-600">
    {char}
  </span>
);

// Custom scrollbar styles
const scrollbarStyles = `
  .shortcuts-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .shortcuts-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .shortcuts-scrollbar::-webkit-scrollbar-thumb {
    background: #4B5563;
    border-radius: 3px;
  }
  .shortcuts-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6B7280;
  }
`;

export function KeyboardShortcutsPanel({
  isOpen,
  onClose,
}: KeyboardShortcutsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll from propagating to canvas
  useEffect(() => {
    if (!isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      // Stop the event from reaching the canvas
      e.stopPropagation();
    };

    const panel = panelRef.current;
    if (panel) {
      panel.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (panel) {
        panel.removeEventListener("wheel", handleWheel);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Inject scrollbar styles */}
      <style>{scrollbarStyles}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] max-h-[80vh] bg-[#1E1E24] rounded-xl shadow-2xl border border-gray-700/50 z-[100] overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-white text-sm font-semibold">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content with custom scrollbar */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)] shortcuts-scrollbar">
          {SHORTCUTS.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "mt-4" : ""}>
              <h3 className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-gray-300 text-xs">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center gap-1">
                          <KeyIcon char={key} />
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-gray-500 text-[10px]">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700/50 text-center">
          <span className="text-gray-500 text-[10px]">
            Press <KeyIcon char="?" /> anytime to show this panel
          </span>
        </div>
      </div>
    </>
  );
}
