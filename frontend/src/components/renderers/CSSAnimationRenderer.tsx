import React, { useRef, useEffect, useState } from 'react';
import LogoSplitCSS from '../animations/LogoSplitCSS';
import iPhoneSMSCSS from '../animations/iPhoneSMSCSS';
import iPhoneSMS from '../animations/iPhoneSMSSimple';
import SimplePhone from '../animations/SimplePhone';
import TestComponent from '../animations/TestComponent';

interface CSSAnimationRendererProps {
  component: any;
  properties: any;
  currentTime: number;
  isPlaying: boolean;
  mode?: 'preview' | 'video';
  onPropertyChange?: (property: string, value: any) => void;
  timelineItem?: any;
}

export default function CSSAnimationRenderer({
  component,
  properties,
  currentTime,
  isPlaying,
  mode = 'preview',
  onPropertyChange,
  timelineItem
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
          customerLogo={properties.customerLogo?.data || 'Customer Logo'}
          logoScale={properties.logoScale || 1}
          mode={mode}
          onPropertyChange={onPropertyChange}
        />
      </div>
    );
  }

  if (component.type === 'iphone_sms') {
    console.log('CSSAnimationRenderer: Rendering iPhone SMS component', {
      component,
      properties,
      currentTime,
      isPlaying,
      timelineItem,
      componentStartTime: timelineItem?.start_time,
      componentDuration: timelineItem?.duration,
      shouldBeVisible: timelineItem ? currentTime >= timelineItem.start_time && currentTime < timelineItem.start_time + timelineItem.duration : false
    });
    
    try {
      console.log('About to render iPhone SMS with props:', {
        customerName: properties.customerName || 'Customer',
        agentName: properties.agentName || 'Agent',
        messages: properties.messages || []
      });
      
      return (
        <div ref={containerRef} className="w-full h-full">
          <SimplePhone
            customerName={properties.customerName || 'Customer'}
            agentName={properties.agentName || 'Agent'}
            messages={properties.messages || []}
            scale={properties.scale || 0.8}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering iPhone SMS component:', error);
      return (
        <div ref={containerRef} className="w-full h-full bg-red-200 flex items-center justify-center">
          <p className="text-red-600">Error rendering iPhone SMS component</p>
        </div>
      );
    }
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
