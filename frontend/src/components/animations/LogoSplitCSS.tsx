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
  
  // Customer background animation completes in first 0.7s (14% of 5s timeline) - much slower growth
  const customerBgPhase = Math.min(1, progress * 3.57);
  // Customer logo animation - faster growth, original speed
  const customerLogoPhase = Math.min(1, progress * 7.14);
  // Salesforce background starts at 0.05s and completes by 0.4s - leads the logo, starts much earlier
  const salesforceBgPhase = Math.min(1, Math.max(0, (progress - 0.01) * 10));
  // Salesforce logo starts at 0.3s and completes by 0.65s - follows the background, moved back by 0.05s
  const salesforceLogoPhase = Math.min(1, Math.max(0, (progress - 0.06) * 8.33));
  const holdPhase = Math.min(1, Math.max(0, (progress - 0.16) * 2.5)); // Hold from 0.16s to 0.56s
  const outPhase = Math.min(1, Math.max(0, (progress - 0.56) * 3.125)); // Out phase from 0.56s - 25% faster
  const customerOutPhase = Math.min(1, Math.max(0, (progress - 0.53) * 3.125)); // Customer logo exit starts at 0.53s - 25% faster
  const customerBgOutPhase = Math.min(1, Math.max(0, (progress - 0.56) * 3.125)); // Customer background exit starts at 0.56s - 25% faster

  // Update element positions based on timeline
  useEffect(() => {
    if (!containerRef.current) return;

    // Customer background circle - grows slower, similar speed to white circle
    if (customerBgRef.current) {
      const easedScale = customerBgPhase > 0 ? 1 - Math.pow(1 - customerBgPhase, 2) : 0; // Ease-out quadratic
      customerBgRef.current.style.transform = `translate(-50%, -50%) scale(${easedScale})`;
    }

    // Salesforce background circle - quick fly-in with easing
    if (salesforceBgRef.current) {
      const easedPhase = salesforceBgPhase > 0 ? 1 - Math.pow(1 - salesforceBgPhase, 3) : 0; // Ease-out cubic
      const translateX = (1 - easedPhase) * 100;
      salesforceBgRef.current.style.transform = `translate(${translateX}%, -50%)`;
    }

    // Customer logo circle - grows with easing, similar speed to background
    if (customerLogoRef.current) {
      const easedScale = customerLogoPhase > 0 ? 1 - Math.pow(1 - customerLogoPhase, 2) : 0; // Ease-out quadratic
      customerLogoRef.current.style.transform = `translate(-50%, -50%) scale(${easedScale})`;
    }

    // Salesforce logo circle - starts completely off-screen right, slides in after background
    if (salesforceLogoRef.current) {
      const easedPhase = salesforceLogoPhase > 0 ? 1 - Math.pow(1 - salesforceLogoPhase, 3) : 0; // Ease-out cubic
      // Start completely off-screen to the right, slide to center at 75%
      // Increased to 250% to ensure it's completely off-screen in all container sizes
      const translateX = (1 - easedPhase) * 250; // Start much further off-screen
      salesforceLogoRef.current.style.transform = `translate(calc(-50% + ${translateX}%), -50%) scale(1)`; // Keep centered while sliding
    }

    // Handle customer logo exit phase (starts at 0.5s)
    if (customerOutPhase > 0) {
      const customerSlideOffset = customerOutPhase * 1000; // Customer logo 2x faster
      
      if (customerLogoRef.current) {
        customerLogoRef.current.style.transform = `translate(-50%, -50%) translateX(-${customerSlideOffset}%) scale(1)`;
      }
    }

    // Handle customer background slide out (starts same time as blue circle)
    if (customerBgOutPhase > 0) {
      if (customerBgRef.current) {
        // Slide the green circle out to the left
        const customerBgSlideOffset = customerBgOutPhase * 400; // Same speed as blue circle
        
        customerBgRef.current.style.transform = `translate(-50%, -50%) translateX(-${customerBgSlideOffset}%)`;
        customerBgRef.current.style.borderRadius = '50%'; // Keep it circular
      }
    }

    // Handle out phase (slide out) - 2x faster logo speeds
    if (outPhase > 0) {
      const salesforceBgSlideOffset = outPhase * 400; // Blue bg 2x faster
      const salesforceLogoSlideOffset = outPhase * 1200; // Salesforce logo 2x faster
      
      if (salesforceBgRef.current) {
        salesforceBgRef.current.style.transform = `translate(0, -50%) translateX(-${salesforceBgSlideOffset}%)`;
      }
      if (salesforceLogoRef.current) {
        salesforceLogoRef.current.style.transform = `translate(-50%, -50%) translateX(-${salesforceLogoSlideOffset}%) scale(1)`;
      }
    }
  }, [progress, customerBgPhase, customerLogoPhase, salesforceBgPhase, salesforceLogoPhase, outPhase, customerOutPhase, customerBgOutPhase]);

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
    >
      {/* Customer side background */}
      <div ref={customerBgRef} className="customer-bg-stinger"></div>
      
      {/* Salesforce side background */}
      <div ref={salesforceBgRef} className="salesforce-bg"></div>
      
      {/* Customer logo circle */}
      <div ref={customerLogoRef} className="logo-circle customer-logo-circle">
        <img 
          className="logo-image" 
          src={customerLogo} 
          alt="Customer Logo"
          style={{
            transform: `scale(${logoScale})`
          }}
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
