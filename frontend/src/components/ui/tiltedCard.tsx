import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const springValues = { damping: 30, stiffness: 100, mass: 2 };

interface TiltedCardProps {
  children: ReactNode;
  className?: string;
  containerHeight?: string;
  containerWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  tooltipText?: string;
}

export default function TiltedCard({
  children,
  className = '',
  containerHeight = '100%',
  containerWidth = '100%',
  scaleOnHover = 1.02,
  rotateAmplitude = 8,
  tooltipText,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const tooltipOpacity = useSpring(0, { stiffness: 200, damping: 25 });

  function handleMouse(e: React.MouseEvent) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    tooltipOpacity.set(1);
  }

  function handleMouseLeave() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    tooltipOpacity.set(0);
  }

  return (
    <div
      ref={ref}
      className={`relative flex flex-col items-center justify-center [perspective:800px] ${className}`}
      style={{ height: containerHeight, width: containerWidth }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative [transform-style:preserve-3d]"
        style={{ rotateX, rotateY, scale }}
      >
        {children}
      </motion.div>

      {tooltipText && (
        <motion.figcaption
          className="pointer-events-none absolute left-0 top-0 z-50 whitespace-nowrap rounded-md bg-white/90 px-3 py-1.5 text-xs text-[oklch(0.2_0_0)] shadow-lg backdrop-blur-sm"
          style={{ x, y, opacity: tooltipOpacity }}
        >
          {tooltipText}
        </motion.figcaption>
      )}
    </div>
  );
}
