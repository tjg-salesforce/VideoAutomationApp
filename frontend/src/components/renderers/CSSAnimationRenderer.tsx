import React, { useRef, useEffect, useState } from 'react';
import LogoSplitCSS from '../animations/LogoSplitCSS';
import { iPhoneSMSCSSComponent as SMSConversation } from '../animations/iPhoneSMSCSS';
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
    // Calculate relative time within the component's duration
    // currentTime is the absolute timeline time
    // componentStartTime is when this component starts on the timeline
    const componentStartTime = timelineItem?.start_time || 0;
    const componentDuration = timelineItem?.duration || 5;
    // If component has been split, use componentStartTime/componentEndTime to clamp
    const componentAnimationStart = (timelineItem as any)?.componentStartTime ?? 0;
    const componentAnimationEnd = (timelineItem as any)?.componentEndTime ?? componentDuration;
    // Calculate relative time within the component's animation timeline
    let relativeTime = Math.max(0, currentTime - componentStartTime);
    // Clamp to split boundaries if they exist
    if ((timelineItem as any)?.componentStartTime !== undefined || (timelineItem as any)?.componentEndTime !== undefined) {
      // Component has been split - adjust relativeTime to account for the split
      relativeTime = Math.min(relativeTime, componentAnimationEnd - componentAnimationStart);
      relativeTime = Math.max(relativeTime, 0) + componentAnimationStart;
    } else {
      // Normal case: clamp to component duration
      relativeTime = Math.min(relativeTime, componentDuration);
    }
    
    // Handle freeze-frame (Option+extend)
    if ((timelineItem as any)?.freezeFrame && (timelineItem as any)?.freezeFrameTime !== undefined) {
      relativeTime = (timelineItem as any).freezeFrameTime;
    }
    
    return (
      <div ref={containerRef} className="w-full h-full">
        <LogoSplitCSS
          currentTime={relativeTime}
          duration={componentDuration}
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
    // Calculate relative time within the component's duration
    // currentTime is the absolute timeline time
    // componentStartTime is when this component starts on the timeline
    // relativeTime should be 0 when component starts, and increase from there
    const componentStartTime = timelineItem?.start_time || 0;
    const componentDuration = timelineItem?.duration || 10;
    // If component has been split, use componentStartTime/componentEndTime to clamp
    const componentAnimationStart = (timelineItem as any)?.componentStartTime ?? 0;
    const componentAnimationEnd = (timelineItem as any)?.componentEndTime ?? componentDuration;
    // Calculate relative time within the component's animation timeline
    let relativeTime = Math.max(0, currentTime - componentStartTime);
    // Clamp to split boundaries if they exist
    if ((timelineItem as any)?.componentStartTime !== undefined || (timelineItem as any)?.componentEndTime !== undefined) {
      // Component has been split - adjust relativeTime to account for the split
      relativeTime = Math.min(relativeTime, componentAnimationEnd - componentAnimationStart);
      relativeTime = Math.max(relativeTime, 0) + componentAnimationStart;
    }
    
    // Handle freeze-frame (Option+extend)
    if ((timelineItem as any)?.freezeFrame && (timelineItem as any)?.freezeFrameTime !== undefined) {
      relativeTime = (timelineItem as any).freezeFrameTime;
    }
    
    // Debug logging (only when relativeTime changes significantly)
    if (Math.floor(relativeTime) !== Math.floor((window as any).lastLoggedRelativeTime || -1)) {
      (window as any).lastLoggedRelativeTime = relativeTime;
      const debugInfo = {
        currentTime: currentTime.toFixed(2),
        componentStartTime: componentStartTime.toFixed(2),
        componentDuration: componentDuration.toFixed(2),
        relativeTime: relativeTime.toFixed(2),
        messageCount: (properties.messages || []).length,
        componentId: component.id,
        hasProperties: !!properties && Object.keys(properties).length > 0,
        propertiesKeys: properties ? Object.keys(properties) : [],
        propertiesMessages: properties?.messages,
        timelineItemProperties: timelineItem?.properties,
        fullProperties: properties,
        fullTimelineItem: timelineItem
      };
      console.log('iPhone SMS render:', debugInfo);
      // Also log separately for easier reading
      if ((properties.messages || []).length === 0) {
        console.warn('⚠️ iPhone SMS has NO MESSAGES!', {
          componentId: component.id,
          propertiesKeys: properties ? Object.keys(properties) : [],
          hasTimelineItemProperties: !!timelineItem?.properties,
          timelineItemPropertiesKeys: timelineItem?.properties ? Object.keys(timelineItem.properties) : []
        });
      }
    }
    
    try {
      // Ensure messages is an array - try multiple sources
      let messages = Array.isArray(properties.messages) ? properties.messages : [];
      
      // Fallback: check timelineItem.properties if properties.messages is empty
      if (messages.length === 0 && timelineItem?.properties?.messages) {
        messages = Array.isArray(timelineItem.properties.messages) ? timelineItem.properties.messages : [];
        console.log('Using timelineItem.properties.messages:', messages.length, 'messages');
      }
      
      return (
        <div 
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center"
          style={
            mode === 'preview' 
              ? {
                  transform: 'scale(0.72)',
                  transformOrigin: 'center center'
                }
              : mode === 'fullscreen' || mode === 'video'
              ? {
                  transform: 'scale(1.3)',
                  transformOrigin: 'center center'
                }
              : undefined
          }
        >
          <SMSConversation
            customerName={properties.customerName || 'Customer'}
            agentName={properties.agentName || 'Agent'}
            messages={messages}
            currentTime={relativeTime}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering iPhone SMS component:', error);
      return (
        <div ref={containerRef} className="w-full h-full bg-red-200 flex items-center justify-center">
          <p className="text-red-600">Error rendering iPhone SMS component: {error instanceof Error ? error.message : 'Unknown error'}</p>
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
