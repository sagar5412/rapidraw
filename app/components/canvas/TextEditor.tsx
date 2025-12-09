"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { textbox } from "@/app/types/Shapes";

interface TextEditorProps {
  textShape: textbox;
  offset: { x: number; y: number };
  scale: number;
  onUpdate: (updatedShape: textbox) => void;
  onClose: () => void;
  isLightTheme: boolean;
}

const COLOR_PRESETS = [
  "#000000",
  "#EF4444",
  "#F59E0B",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#FFFFFF",
];

export function TextEditor({
  textShape,
  offset,
  scale,
  onUpdate,
  onClose,
  isLightTheme,
}: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [showToolbar, setShowToolbar] = useState(true);

  const screenX = textShape.x * scale + offset.x;
  const screenY = textShape.y * scale + offset.y;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        if (textShape.htmlContent) {
          editorRef.current.innerHTML = textShape.htmlContent;
          // Select all text content for easy editing/formatting
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(editorRef.current);
          // DON'T collapse - leave text selected so user can immediately format it
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const saveAndClose = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;

      // Measure actual text dimensions using canvas
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");

      if (ctx) {
        const fontSize = textShape.fontSize || 16;
        const fontFamily = textShape.fontFamily || "sans-serif";
        ctx.font = `${fontSize}px ${fontFamily}`;

        // Extract plain text and measure - handle HTML line breaks
        const tempDiv = document.createElement("div");
        // Replace br and closing block tags with newlines for proper counting
        const normalizedContent = content
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/div>/gi, "\n")
          .replace(/<\/p>/gi, "\n");
        tempDiv.innerHTML = normalizedContent;
        const plainText = tempDiv.textContent || "";

        // Split by newlines and filter empty trailing lines
        const lines = plainText.split("\n");
        const lineCount = Math.max(
          1,
          lines.filter((l, i) => l || i < lines.length - 1).length
        );

        // Get max line width
        let maxWidth = 0;
        for (const line of lines) {
          const width = ctx.measureText(line || " ").width;
          if (width > maxWidth) maxWidth = width;
        }

        // Calculate dimensions
        const measuredWidth = Math.max(50, maxWidth + 10); // Add padding
        const measuredHeight = Math.max(24, lineCount * fontSize * 1.4);

        onUpdate({
          ...textShape,
          htmlContent: content,
          width: measuredWidth,
          height: measuredHeight,
        });
      } else {
        // Fallback
        onUpdate({
          ...textShape,
          htmlContent: content,
        });
      }
    }
    onClose();
  }, [textShape, onUpdate, onClose]);

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on toolbar
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest(".text-formatting-toolbar")) {
      editorRef.current?.focus();
      return;
    }
    saveAndClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      saveAndClose();
    }
  };

  const applyColor = (color: string) => {
    // Restore focus and selection before applying color
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      // Apply color to selected text using execCommand (deprecated but works well for contentEditable)
      document.execCommand("foreColor", false, color);
    }
  };

  const applyBold = () => {
    editorRef.current?.focus();
    document.execCommand("bold", false);
  };

  const applyItalic = () => {
    editorRef.current?.focus();
    document.execCommand("italic", false);
  };

  const applyUnderline = () => {
    editorRef.current?.focus();
    document.execCommand("underline", false);
  };

  return (
    <div
      className="fixed z-[100]"
      style={{
        left: screenX,
        top: screenY,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Formatting Toolbar */}
      {showToolbar && (
        <div
          className="text-formatting-toolbar absolute -top-10 left-0 flex items-center gap-1 bg-[#1E1E24] rounded-lg p-1.5 shadow-xl border border-gray-700/50"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Bold */}
          <button
            onClick={applyBold}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-600 text-white font-bold text-sm"
            title="Bold"
          >
            B
          </button>

          {/* Italic */}
          <button
            onClick={applyItalic}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-600 text-white italic text-sm"
            title="Italic"
          >
            I
          </button>

          {/* Underline */}
          <button
            onClick={applyUnderline}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-600 text-white underline text-sm"
            title="Underline"
          >
            U
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-600 mx-1" />

          {/* Color presets */}
          {COLOR_PRESETS.slice(0, 6).map((color) => (
            <button
              key={color}
              onClick={() => applyColor(color)}
              className="w-5 h-5 rounded border border-gray-500 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            />
          ))}

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => colorInputRef.current?.click()}
              className="w-5 h-5 rounded border border-gray-500 hover:scale-110 transition-transform"
              style={{
                background:
                  "linear-gradient(135deg, #EF4444 0%, #F59E0B 25%, #22C55E 50%, #3B82F6 75%, #8B5CF6 100%)",
              }}
              title="Custom color"
            />
            <input
              ref={colorInputRef}
              type="color"
              onChange={(e) => applyColor(e.target.value)}
              className="absolute opacity-0 w-0 h-0"
            />
          </div>
        </div>
      )}

      {/* Text Editor */}
      <div
        ref={editorRef}
        contentEditable
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="min-w-[50px] min-h-[24px] bg-transparent outline-none"
        style={{
          fontSize: `${textShape.fontSize || 16}px`,
          fontFamily: textShape.fontFamily || "sans-serif",
          textAlign: textShape.textAlign || "left",
          lineHeight: "1.4",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: textShape.strokeColor || "black",
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}
