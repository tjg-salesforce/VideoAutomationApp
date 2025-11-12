'use client';

import React, { Suspense, useMemo } from 'react';
import { Component } from '@/types';
import { getComponentRenderer } from '@/lib/componentRegistry';

interface ComponentRendererProps {
  component: Component;
  properties?: {
    [key: string]: any;
  };
  currentTime: number;
  isPlaying: boolean;
  mode?: 'preview' | 'fullscreen' | 'video';
  onPropertyChange?: (property: string, value: any) => void;
  timelineItem?: any; // Timeline item with start_time, duration, etc.
}

// Loading fallback component
const LoadingFallback = () => (
  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
    <div className="text-center text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p>Loading component...</p>
    </div>
  </div>
);

// Error boundary component
class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; componentType: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; componentType: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component renderer error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-red-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">Component Error</p>
            <p className="text-sm">Failed to render {this.props.componentType}</p>
            <p className="text-xs mt-2">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ComponentRenderer({ 
  component, 
  properties = {}, 
  currentTime, 
  isPlaying, 
  mode = 'preview',
  onPropertyChange,
  timelineItem
}: ComponentRendererProps) {
  // Get the appropriate renderer from the registry
  const rendererConfig = useMemo(() => {
    return getComponentRenderer(component.type);
  }, [component.type]);

  // If no renderer found, show error
  if (!rendererConfig) {
    return (
      <div className="w-full h-full bg-yellow-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-yellow-800">
          <p className="text-lg font-medium">Unknown Component Type</p>
          <p className="text-sm">No renderer found for: {component.type}</p>
        </div>
      </div>
    );
  }

  // Memoize the component props to prevent unnecessary re-renders
  const componentProps = useMemo(() => ({
    component,
    properties,
    currentTime,
    isPlaying,
    mode,
    onPropertyChange,
    timelineItem
  }), [component, properties, currentTime, isPlaying, mode, onPropertyChange, timelineItem]);

  // Render the component with error boundary and suspense
  return (
    <ComponentErrorBoundary componentType={component.type}>
      <Suspense fallback={<LoadingFallback />}>
        <rendererConfig.renderer {...componentProps} />
      </Suspense>
    </ComponentErrorBoundary>
  );
}
