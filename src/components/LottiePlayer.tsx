'use client';

import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LottiePlayerProps {
  animationPath?: string;
  animationData?: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export default function LottiePlayer({
  animationPath,
  animationData,
  loop = true,
  autoplay = true,
  className = 'w-full h-full',
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    try {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        ...(animationData ? { animationData } : { path: animationPath }),
      });
      animRef.current = anim;
    } catch (e) {
      console.error('Lottie load error:', e);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [animationPath, animationData, loop, autoplay]);

  return <div ref={containerRef} className={className} />;
}
