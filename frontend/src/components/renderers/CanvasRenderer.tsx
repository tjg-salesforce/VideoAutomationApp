'use client';

import React from 'react';
import { Component } from '@/types';

interface CanvasRendererProps {
  component: Component;
  properties?: {
    [key: string]: any;
  };
  currentTime: number;
  isPlaying: boolean;
  mode?: 'preview' | 'fullscreen';
  onPropertyChange?: (property: string, value: any) => void;
}

export default function CanvasRenderer({ 
  component, 
  properties = {}, 
  currentTime, 
  isPlaying, 
  mode = 'preview',
  onPropertyChange 
}: CanvasRendererProps) {
  return (
    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-500">
        <p className="text-lg">Canvas Renderer</p>
        <p className="text-sm">Not implemented yet</p>
        <p className="text-xs">Component: {component.type}</p>
      </div>
    </div>
  );
}
