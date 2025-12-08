"use client";
import { useRef, useEffect, useCallback } from "react";
import { textbox } from "@/app/types/Shapes";

interface TextEditorProps {
  textShape: textbox;
  offset: { x: number; y: number };
  scale: number;
  onUpdate: (updatedShape: textbox) => void;
  onClose: () => void;
}

export function TextEditor({
  textShape,
  offset,
  scale,
  onUpdate,
  onClose,
}: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const screenX = textShape.x * scale + offset.x;
  const screenY = textShape.y * scale + offset.y;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        if (textShape.htmlContent) {
          editorRef.current.innerHTML = textShape.htmlContent;
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
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
      const rect = editorRef.current.getBoundingClientRect();
      onUpdate({
        ...textShape,
        htmlContent: content,
        width: Math.max(100, rect.width),
        height: Math.max(24, rect.height),
      });
    }
    onClose();
  }, [textShape, onUpdate, onClose]);

  const handleBlur = () => {
    saveAndClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      saveAndClose();
    }
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
      <div
        ref={editorRef}
        contentEditable
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="min-w-[50px] min-h-[24px] p-1 bg-transparent outline-none"
        style={{
          fontSize: `${textShape.fontSize || 16}px`,
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
