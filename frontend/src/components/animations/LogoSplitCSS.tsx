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
  const customerBgRef = useRef<HTMLDivElement>(null);
  const salesforceBgRef = useRef<HTMLDivElement>(null);
  const customerLogoRef = useRef<HTMLDivElement>(null);
  const salesforceLogoRef = useRef<HTMLDivElement>(null);

  // Calculate animation progress based on time
  const progress = Math.min(1, currentTime / duration);
  
  // Animation phases
  const inPhase = Math.min(1, progress * 3); // First 1/3 of animation
  const holdPhase = Math.min(1, Math.max(0, (progress - 0.33) * 3)); // Middle 1/3
  const outPhase = Math.min(1, Math.max(0, (progress - 0.66) * 3)); // Last 1/3

  // Update element positions based on timeline
  useEffect(() => {
    if (!containerRef.current) return;

    // Customer background circle
    if (customerBgRef.current) {
      const scale = inPhase;
      customerBgRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    // Salesforce background circle
    if (salesforceBgRef.current) {
      const translateX = inPhase > 0 ? (1 - inPhase) * 100 : 100; // Slide in from right
      salesforceBgRef.current.style.transform = `translate(${translateX}vw, -50%)`;
    }

    // Customer logo circle
    if (customerLogoRef.current) {
      const scale = inPhase;
      customerLogoRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    // Salesforce logo circle
    if (salesforceLogoRef.current) {
      const scale = inPhase;
      const translateX = inPhase > 0 ? (1 - inPhase) * 100 : 100; // Slide in from right
      salesforceLogoRef.current.style.transform = `translate(${translateX}vw, -50%) scale(${scale})`;
    }

    // Handle out phase (slide out)
    if (outPhase > 0) {
      const slideOffset = outPhase * 200; // Slide out to the left
      
      if (customerBgRef.current) {
        customerBgRef.current.style.transform = `translate(-50%, -50%) translateX(-${slideOffset}vw) scale(1)`;
      }
      if (salesforceBgRef.current) {
        salesforceBgRef.current.style.transform = `translate(0, -50%) translateX(-${slideOffset}vw)`;
      }
      if (customerLogoRef.current) {
        customerLogoRef.current.style.transform = `translate(-50%, -50%) translateX(-${slideOffset}vw) scale(1)`;
      }
      if (salesforceLogoRef.current) {
        salesforceLogoRef.current.style.transform = `translate(0, -50%) translateX(-${slideOffset}vw) scale(1)`;
      }
    }
  }, [progress, inPhase, outPhase]);

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
      <div ref={customerBgRef} className="customer-bg-stinger"></div>
      
      {/* Salesforce side background */}
      <div ref={salesforceBgRef} className="salesforce-bg"></div>
      
      {/* Customer logo circle */}
      <div ref={customerLogoRef} className="logo-circle customer-logo-circle">
        <img 
          className="logo-image" 
          src="https://placehold.co/400x400/ffffff/000000?text=Customer+Logo" 
          alt="Customer Logo"
        />
      </div>
      
      {/* Salesforce logo circle */}
      <div ref={salesforceLogoRef} className="logo-circle salesforce-logo-circle">
        <img 
          className="logo-image" 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/1200px-Salesforce.com_logo.svg.png" 
          alt="Salesforce Logo"
        />
      </div>
    </div>
  );
}
