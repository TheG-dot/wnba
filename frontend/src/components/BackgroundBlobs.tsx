import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";

/**
 * Fixed decorative gradient blobs that drift on their own and lean
 * slightly toward the pointer.
 */
export function BackgroundBlobs() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 40, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 40, damping: 20, mass: 0.6 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      x.set(nx * 90);
      y.set(ny * 90);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ x: sx, y: sy }}
        animate={{ scale: [1, 1.18, 1], rotate: [0, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-flame opacity-35 blur-[110px]"
      />
      <motion.div
        style={{ x: sy, y: sx }}
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -14, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: -8 }}
        className="absolute -bottom-40 -right-24 h-[34rem] w-[34rem] rounded-full bg-violet opacity-35 blur-[120px]"
      />
      <motion.div
        style={{ x: sx, y: sy }}
        animate={{ opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-flame-soft blur-[130px]"
      />
    </div>
  );
}
