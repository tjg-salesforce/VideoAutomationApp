import React, { useRef, useEffect, useState } from 'react';
import './LogoSplitCSS.css';

interface LogoSplitCSSProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  backgroundColor?: string;
  customerLogo?: string;
  logoScale?: number;
  mode?: 'preview' | 'video';
  onPropertyChange?: (property: string, value: any) => void;
}

export default function LogoSplitCSS({
  currentTime,
  duration,
  isPlaying,
  backgroundColor = '#fca5a5',
  customerLogo = 'Customer Logo',
  logoScale = 1,
  mode = 'preview',
  onPropertyChange
}: LogoSplitCSSProps) {
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

  // Update CSS custom properties for real-time changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--customer-bg-color', backgroundColor);
      containerRef.current.style.setProperty('--logo-scale', logoScale.toString());
    }
  }, [backgroundColor, logoScale]);

  return (
    <div 
      ref={containerRef}
      className="logo-split-canvas"
      style={{
        transform: `scale(${logoScale})`
      }}
    >
      {/* Customer side background */}
      <div className="customer-bg-stinger"></div>
      
      {/* Salesforce side background */}
      <div className="salesforce-bg"></div>
      
      {/* Customer logo circle */}
      <div className="logo-circle customer-logo-circle">
        <img 
          className="logo-image" 
          src="https://placehold.co/400x400/ffffff/000000?text=Customer+Logo" 
          alt="Customer Logo"
        />
      </div>
      
      {/* Salesforce logo circle */}
      <div className="logo-circle salesforce-logo-circle">
        <img 
          className="logo-image" 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/1200px-Salesforce.com_logo.svg.png" 
          alt="Salesforce Logo"
        />
      </div>
    </div>
  );
}
