import { Component } from '@/types';

export type ComponentRendererType = 'lottie' | 'html' | 'canvas' | 'hybrid';

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

// Performance-optimized Lottie renderer
const LottieRenderer = React.lazy(() => import('@/components/renderers/LottieRenderer'));
const HTMLRenderer = React.lazy(() => import('@/components/renderers/HTMLRenderer'));
const CanvasRenderer = React.lazy(() => import('@/components/renderers/CanvasRenderer'));
const HybridRenderer = React.lazy(() => import('@/components/renderers/HybridRenderer'));

export const componentRegistry: ComponentRegistry = {
  // Motion Graphics (Lottie-based)
  'customer_logo_split': {
    type: 'lottie',
    renderer: LottieRenderer,
    preview: 'canvas',
    performance: 'high',
    debounceMs: 100,
    maxInstances: 3,
    pauseOffscreen: true
  },
  'salesforce_logo_reveal': {
    type: 'lottie',
    renderer: LottieRenderer,
    preview: 'canvas',
    performance: 'high',
    debounceMs: 100,
    maxInstances: 2,
    pauseOffscreen: true
  },
  'data_flow_animation': {
    type: 'lottie',
    renderer: LottieRenderer,
    preview: 'canvas',
    performance: 'high',
    debounceMs: 150,
    maxInstances: 2,
    pauseOffscreen: true
  },
  'success_transition': {
    type: 'lottie',
    renderer: LottieRenderer,
    preview: 'canvas',
    performance: 'high',
    debounceMs: 100,
    maxInstances: 5,
    pauseOffscreen: true
  },

  // Salesforce UI Components (HTML-based)
  'lead_form': {
    type: 'html',
    renderer: HTMLRenderer,
    preview: 'dom',
    performance: 'medium',
    debounceMs: 50,
    maxInstances: 10,
    pauseOffscreen: false
  },
  'opportunity_pipeline': {
    type: 'html',
    renderer: HTMLRenderer,
    preview: 'dom',
    performance: 'medium',
    debounceMs: 50,
    maxInstances: 8,
    pauseOffscreen: false
  },
  'dashboard_widget': {
    type: 'html',
    renderer: HTMLRenderer,
    preview: 'dom',
    performance: 'medium',
    debounceMs: 50,
    maxInstances: 15,
    pauseOffscreen: false
  },
  'record_detail': {
    type: 'html',
    renderer: HTMLRenderer,
    preview: 'dom',
    performance: 'medium',
    debounceMs: 50,
    maxInstances: 12,
    pauseOffscreen: false
  },
  'list_view': {
    type: 'html',
    renderer: HTMLRenderer,
    preview: 'dom',
    performance: 'medium',
    debounceMs: 50,
    maxInstances: 10,
    pauseOffscreen: false
  },
  'calendar': {
    type: 'html',
    renderer: HTMLRenderer,
    preview: 'dom',
    performance: 'medium',
    debounceMs: 50,
    maxInstances: 5,
    pauseOffscreen: false
  },

  // Hybrid Components (Lottie + HTML)
  'text_with_motion': {
    type: 'hybrid',
    renderer: HybridRenderer,
    preview: 'canvas',
    performance: 'medium',
    debounceMs: 100,
    maxInstances: 5,
    pauseOffscreen: true
  },
  'ui_with_animation': {
    type: 'hybrid',
    renderer: HybridRenderer,
    preview: 'canvas',
    performance: 'medium',
    debounceMs: 100,
    maxInstances: 4,
    pauseOffscreen: true
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
