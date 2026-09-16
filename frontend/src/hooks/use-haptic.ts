/** Short vibration on supported touch devices; no-op elsewhere. */
export function useHaptic() {
  return (pattern: number | number[] = 12) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* ignored */
      }
    }
  };
}
