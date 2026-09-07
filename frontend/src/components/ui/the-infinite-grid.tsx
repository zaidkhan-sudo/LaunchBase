import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  useAnimationFrame
} from "framer-motion";

export const Component = ({ children, className }: { children?: React.ReactNode, className?: string }) => {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0;
  const speedY = 0;


  return (
    <>
      <div className="fixed inset-0 overflow-hidden bg-background pointer-events-none z-[-1]">
        <div className="absolute inset-0 z-0 opacity-20">
          <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
        </div>
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/40 dark:bg-orange-600/20 blur-[120px]" />
          <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-primary/30 blur-[100px]" />
          <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/40 dark:bg-blue-600/20 blur-[120px]" />
        </div>
      </div>

      <div ref={containerRef} className={cn("relative z-0 w-full flex flex-col flex-1", className)}>
        {children ? children : (
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 max-w-3xl mx-auto space-y-6 pointer-events-none">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                The Infinite Grid
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Move your cursor to reveal the active grid layer. <br />
                The pattern scrolls infinitely in the background.
              </p>
            </div>

            <div className="flex gap-4 pointer-events-auto">
              <button
                onClick={() => setCount(count + 1)}
                className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-all shadow-md active:scale-95"
              >
                Interact ({count})
              </button>
              <button
                className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/80 transition-all active:scale-95"
              >
                Learn More
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const GridPattern = ({ offsetX, offsetY }: { offsetX: any, offsetY: any }) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};
