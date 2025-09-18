import React, { useRef, useEffect, useState } from 'react';
import LogoSplitCSS from '../animations/LogoSplitCSS';

interface CSSAnimationRendererProps {
  component: any;
  properties: any;
  currentTime: number;
  isPlaying: boolean;
  mode?: 'preview' | 'video';
  onPropertyChange?: (property: string, value: any) => void;
}

export default function CSSAnimationRenderer({
  component,
  properties,
  currentTime,
  isPlaying,
  mode = 'preview',
  onPropertyChange
}: CSSAnimationRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (component.type === 'customer_logo_split') {
    return (
      <div ref={containerRef} className="w-full h-full">
        <LogoSplitCSS
          currentTime={currentTime}
          duration={5} // 5 seconds
          isPlaying={isPlaying}
          backgroundColor={properties.backgroundColor || '#fca5a5'}
          customerLogo={properties.customerLogo || 'Customer Logo'}
          logoScale={properties.logoScale || 1}
          mode={mode}
          onPropertyChange={onPropertyChange}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-500">
        <p className="text-lg font-medium">Unknown Component Type</p>
        <p className="text-sm">No CSS renderer found for: {component.type}</p>
      </div>
    </div>
  );
}
