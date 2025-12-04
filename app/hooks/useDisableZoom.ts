import { useEffect } from "react";

export const useDisableZoom = () => {
  useEffect(() => {
    const disableZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    window.addEventListener("wheel", disableZoom, { passive: false });
    return () => window.removeEventListener("wheel", disableZoom);
  }, []);
};
