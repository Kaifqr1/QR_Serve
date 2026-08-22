import type { MotionProps } from "framer-motion";

/**
 * Returns one-time viewport reveal props, or an empty object when the visitor
 * requests reduced motion. Keeping the condition pure makes the accessibility
 * behavior straightforward to test independently of the browser media query.
 */
export function scrollReveal(reduceMotion: boolean, delay = 0, offset = 24): MotionProps {
  if (reduceMotion) return {};
  return {
    initial: { opacity: 0, y: offset },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.22 },
    transition: { duration: 0.64, delay, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  };
}
