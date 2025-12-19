import { useEffect, useCallback, SetStateAction, Dispatch } from "react";
import { Shape } from "@/app/types/Shapes";

export function useCanvasStorage(
  shapes: Shape[],
  setShapes: Dispatch<SetStateAction<Shape[]>>,
  canvasBackground: string,
  setCanvasBackground: Dispatch<SetStateAction<string>>,
  theme: "system" | "light" | "dark",
  setTheme: Dispatch<SetStateAction<"system" | "light" | "dark">>,
  isCollaborating: boolean,
  roomId: string | null
) {
  // LocalStorage keys
  const STORAGE_KEY = "rapidraw_canvas"; // Main local canvas
  const BACKUP_KEY = "rapidraw_canvas_backup"; // Backup before joining session
  const SESSION_KEY = "rapidraw_session_canvas"; // Current session canvas

  // Helper to get current canvas data
  const getCanvasData = useCallback(() => {
    return {
      shapes,
      background: canvasBackground,
      theme,
      savedAt: new Date().toISOString(),
    };
  }, [shapes, canvasBackground, theme]);

  // Save local canvas to backup before joining session
  const backupLocalCanvas = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const data = getCanvasData();
      localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
      console.log("Local canvas backed up");
    } catch (error) {
      console.error("Failed to backup canvas:", error);
    }
  }, [getCanvasData]);

  // Restore local canvas from backup after leaving session
  const restoreLocalCanvas = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const data = JSON.parse(backup);
        if (data.shapes && Array.isArray(data.shapes)) {
          setShapes(data.shapes);
        }
        if (data.background) {
          setCanvasBackground(data.background);
        }
        if (data.theme) {
          setTheme(data.theme);
        }
        // Clear session canvas and restore main canvas
        localStorage.removeItem(SESSION_KEY);
        localStorage.setItem(STORAGE_KEY, backup);
        console.log("Local canvas restored from backup");
      }
    } catch (error) {
      console.error("Failed to restore canvas:", error);
    }
  }, [setShapes, setCanvasBackground, setTheme]);

  // Load from localStorage on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.shapes && Array.isArray(data.shapes)) {
          setShapes(data.shapes);
        }
        if (data.background) {
          setCanvasBackground(data.background);
        }
        if (data.theme) {
          setTheme(data.theme);
        }
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  }, []); // Only run once on mount

  // Save to localStorage whenever shapes, background, or theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canvasBackground) return; // Don't save before background is set

    const saveTimeout = setTimeout(() => {
      try {
        const data = {
          shapes,
          background: canvasBackground,
          theme,
          savedAt: new Date().toISOString(),
        };
        // Save to different storage based on collaboration state
        if (isCollaborating) {
          // Save session canvas separately
          localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
              ...data,
              roomId: roomId,
            })
          );
        } else {
          // Save local canvas
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    }, 500); // Debounce saves

    return () => clearTimeout(saveTimeout);
  }, [shapes, canvasBackground, theme, isCollaborating, roomId]);

  return {
    backupLocalCanvas,
    restoreLocalCanvas,
  };
}
