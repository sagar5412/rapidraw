import { useEffect } from "react";

export const useDisableZoom = (
  onZoom?: (deltaY: number, ctrlKey: boolean) => void
) => {
  useEffect(() => {
    const disableZoom = (e: WheelEvent) => {
      const isZoomGesture = e.ctrlKey || e.metaKey;
      if (isZoomGesture) {
        e.preventDefault();
        onZoom?.(e.deltaY, true);
      } else {
        onZoom?.(e.deltaY, false);
      }
    };
    window.addEventListener("wheel", disableZoom, { passive: false });
    return () => window.removeEventListener("wheel", disableZoom);
  }, [onZoom]);
};
