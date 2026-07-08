import { useCallback, useRef } from 'react';
import { motion, useSpring, useMotionTemplate, type MotionValue } from 'framer-motion';

// ── Mouse glow hook ──
// Encapsulates the two-layer spring + motion template for the login page glow effect.
export function useMouseGlow() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Two springs: outer is slower (ambient), inner is snappier (highlight core)
  const outerX = useSpring(50, { stiffness: 80, damping: 30 });
  const outerY = useSpring(50, { stiffness: 80, damping: 30 });
  const innerX = useSpring(50, { stiffness: 160, damping: 20 });
  const innerY = useSpring(50, { stiffness: 160, damping: 20 });

  // Outer large ambient glow
  const outerGlow = useMotionTemplate`radial-gradient(700px circle at ${outerX}% ${outerY}%, rgba(100,140,255,0.45) 0%, rgba(100,140,255,0.15) 35%, transparent 65%)`;
  // Inner highlight core
  const innerGlow = useMotionTemplate`radial-gradient(280px circle at ${innerX}% ${innerY}%, rgba(120,160,255,0.55) 0%, rgba(150,100,255,0.25) 30%, transparent 60%)`;
  // Card border glow
  const borderGlow = useMotionTemplate`radial-gradient(350px circle at ${innerX}% ${innerY}%, rgba(130,170,255,0.6) 0%, rgba(150,100,255,0.3) 40%, transparent 65%)`;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    outerX.set(x);
    outerY.set(y);
    innerX.set(x);
    innerY.set(y);
  }, [outerX, outerY, innerX, innerY]);

  return {
    containerRef,
    outerGlow,
    innerGlow,
    borderGlow,
    handleMouseMove,
  } as const;
}

// ── Reusable glow layers ──
// These components can be placed inside the container with onMouseMove.

interface GlowLayerProps {
  glow: string | MotionValue<string>;
}

export function AmbientGlow({ glow }: GlowLayerProps) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: glow }}
    />
  );
}

export function GridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          'linear-gradient(oklch(0 0 0 / 0.05) 1px, transparent 1px), linear-gradient(90deg, oklch(0 0 0 / 0.05) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    />
  );
}
