import React from 'react';
import { Component } from '@/types';

export type ComponentRendererType = 'html' | 'canvas' | 'hybrid' | 'css';

export interface ComponentRenderer {
  type: ComponentRendererType;
  renderer: React.ComponentType<any>;
  preview: 'canvas' | 'dom' | 'webgl';
  performance: 'high' | 'medium' | 'low';
  debounceMs?: number;
  maxInstances?: number;
  pauseOffscreen?: boolean;
}

export interface ComponentRegistry {
  [key: string]: ComponentRenderer;
}

// Performance-optimized renderers
const HTMLRenderer = React.lazy(() => import('@/components/renderers/HTMLRenderer'));
const CanvasRenderer = React.lazy(() => import('@/components/renderers/CanvasRenderer'));
const HybridRenderer = React.lazy(() => import('@/components/renderers/HybridRenderer'));
const CSSAnimationRenderer = React.lazy(() => import('@/components/renderers/CSSAnimationRenderer'));

export const componentRegistry: ComponentRegistry = {
  // Motion Graphics (CSS-based - more reliable than Lottie)
  'customer_logo_split': {
    type: 'css',
    renderer: CSSAnimationRenderer,
    preview: 'dom',
    performance: 'high',
    debounceMs: 50,
    maxInstances: 5,
    pauseOffscreen: false
  },
  // iPhone SMS Conversation Component
  'iphone_sms': {
    type: 'css',
    renderer: CSSAnimationRenderer,
    preview: 'dom',
    performance: 'high',
    debounceMs: 100,
    maxInstances: 3,
    pauseOffscreen: false
  }
};

export const getComponentRenderer = (componentType: string): ComponentRenderer | null => {
  return componentRegistry[componentType] || null;
};

export const getComponentPerformance = (componentType: string) => {
  const renderer = getComponentRenderer(componentType);
  return renderer?.performance || 'medium';
};

export const shouldDebounce = (componentType: string): boolean => {
  const renderer = getComponentRenderer(componentType);
  return renderer?.debounceMs !== undefined;
};

export const getDebounceMs = (componentType: string): number => {
  const renderer = getComponentRenderer(componentType);
  return renderer?.debounceMs || 100;
};

export const getMaxInstances = (componentType: string): number => {
  const renderer = getComponentRenderer(componentType);
  return renderer?.maxInstances || 10;
};

export const shouldPauseOffscreen = (componentType: string): boolean => {
  const renderer = getComponentRenderer(componentType);
  return renderer?.pauseOffscreen || false;
};
