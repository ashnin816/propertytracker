"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

function getDepth(path: string): number {
  return path.split("/").filter(Boolean).length;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [direction, setDirection] = useState<"none" | "forward" | "back">("none");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      const prevDepth = getDepth(prevPath.current);
      const newDepth = getDepth(pathname);

      if (newDepth > prevDepth) {
        setDirection("forward");
      } else if (newDepth < prevDepth) {
        setDirection("back");
      } else {
        setDirection("forward");
      }

      setAnimating(true);
      prevPath.current = pathname;

      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const animClass = animating
    ? direction === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left"
    : "";

  return <div className={animClass}>{children}</div>;
}
