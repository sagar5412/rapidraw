"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Shape } from "@/app/types/Shapes";
import {
  FileState,
  saveToFileHandle,
  saveAsRapidrawFile,
  openRapidrawFileWithHandle,
  isFileSystemAccessSupported,
  RapidrawFile,
} from "@/app/types/RapidrawFile";

interface FileContextValue {
  // File state
  fileState: FileState;
  isFileSystemSupported: boolean;

  // Actions
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
  openFile: () => Promise<RapidrawFile | null>;
  newFile: () => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
}

const FileContext = createContext<FileContextValue | null>(null);

export function useFileContext() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used within FileProvider");
  }
  return context;
}

interface FileProviderProps {
  children: React.ReactNode;
}

export function FileProvider({ children }: FileProviderProps) {
  const [fileState, setFileState] = useState<FileState>({
    handle: null,
    name: "Untitled",
    hasUnsavedChanges: false,
  });

  const isFileSystemSupported =
    typeof window !== "undefined" && isFileSystemAccessSupported();

  // Save to current file (Ctrl+S)
  const saveFile = useCallback(
    async (
      shapes: Shape[],
      background: string,
      theme: "system" | "light" | "dark"
    ): Promise<boolean> => {
      if (fileState.handle) {
        // Save to existing file
        const success = await saveToFileHandle(
          fileState.handle,
          shapes,
          background,
          theme
        );
        if (success) {
          setFileState((prev) => ({ ...prev, hasUnsavedChanges: false }));
        }
        return success;
      } else {
        // No file handle, do Save As
        const result = await saveAsRapidrawFile(
          shapes,
          background,
          theme,
          "Untitled"
        );
        if (result) {
          setFileState({
            handle: result.handle,
            name: result.name,
            hasUnsavedChanges: false,
          });
          return true;
        }
        return false;
      }
    },
    [fileState.handle]
  );

  // Save As (always show picker)
  const saveFileAs = useCallback(
    async (
      shapes: Shape[],
      background: string,
      theme: "system" | "light" | "dark"
    ): Promise<boolean> => {
      const suggestedName =
        fileState.name.replace(/\.rapidraw$/, "") || "Untitled";
      const result = await saveAsRapidrawFile(
        shapes,
        background,
        theme,
        suggestedName
      );
      if (result) {
        setFileState({
          handle: result.handle,
          name: result.name,
          hasUnsavedChanges: false,
        });
        return true;
      }
      return false;
    },
    [fileState.name]
  );

  // Open file
  const openFile = useCallback(async (): Promise<RapidrawFile | null> => {
    const result = await openRapidrawFileWithHandle();
    if (result) {
      setFileState({
        handle: result.handle,
        name: result.name,
        hasUnsavedChanges: false,
      });
      return result.file;
    }
    return null;
  }, []);

  // New file (reset state)
  const newFile = useCallback(() => {
    setFileState({
      handle: null,
      name: "Untitled",
      hasUnsavedChanges: false,
    });
  }, []);

  // Mark as changed
  const markAsChanged = useCallback(() => {
    setFileState((prev) => ({ ...prev, hasUnsavedChanges: true }));
  }, []);

  // Mark as saved
  const markAsSaved = useCallback(() => {
    setFileState((prev) => ({ ...prev, hasUnsavedChanges: false }));
  }, []);

  const value: FileContextValue = {
    fileState,
    isFileSystemSupported,
    saveFile,
    saveFileAs,
    openFile,
    newFile,
    markAsChanged,
    markAsSaved,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}
