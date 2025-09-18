import React, { useRef, useEffect, useState } from 'react';
import './LogoSplitAnimation.css';

interface LogoSplitAnimationProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  backgroundColor?: string;
  customerLogo?: string;
  logoScale?: number;
  mode?: 'preview' | 'video';
}

export default function LogoSplitAnimation({
  currentTime,
  duration,
  isPlaying,
  backgroundColor = '#184cb4',
  customerLogo = 'Your Logo',
  logoScale = 1,
  mode = 'preview'
}: LogoSplitAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Calculate current frame based on time
  useEffect(() => {
    const totalFrames = 300; // 5 seconds at 60fps
    const frame = Math.floor((currentTime / duration) * totalFrames);
    setCurrentFrame(Math.min(frame, totalFrames - 1));
  }, [currentTime, duration]);

  // For video rendering, we need frame-based control
  useEffect(() => {
    if (containerRef.current && mode === 'video') {
      containerRef.current.setAttribute('data-frame', currentFrame.toString());
    }
  }, [currentFrame, mode]);

  return (
    <div 
      ref={containerRef}
      className={`logo-split-container ${!isPlaying ? 'paused' : ''}`}
      style={{
        background: backgroundColor,
        transform: `scale(${logoScale})`
      }}
    >
      <div className="logo-split-left">
        {customerLogo}
      </div>
      <div className="logo-split-right">
        {customerLogo}
      </div>
      <div className="logo-split-center">
        {customerLogo}
      </div>
    </div>
  );
}
