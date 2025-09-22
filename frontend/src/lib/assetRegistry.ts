// Unified Asset Registry
// All assets (components, media, effects) are registered here

import { ComponentSchema, componentSchemas } from './componentSchemas';

export interface AssetDefinition {
  id: string;
  name: string;
  type: 'component' | 'media' | 'effect' | 'text' | 'audio';
  category: string;
  description: string;
  duration: number;
  icon?: string;
  
  // Schema for properties
  schema?: ComponentSchema;
  
  // Rendering configuration
  renderer: {
    type: 'css' | 'html' | 'canvas' | 'hybrid' | 'native';
    component?: string;
  };
  
  // Default properties
  defaultProperties: Record<string, any>;
  
  // Asset-specific metadata
  metadata?: {
    fileTypes?: string[]; // For media assets
    maxDuration?: number;
    minDuration?: number;
    supportsLayers?: boolean;
  };
}

// Asset Registry
export const assetRegistry: Record<string, AssetDefinition> = {
  // Components
  'customer_logo_split': {
    id: 'customer_logo_split',
    name: 'Customer Logo Split',
    type: 'component',
    category: 'Motion Graphics',
    description: 'Animated logo split with customer branding',
    duration: 5,
    schema: componentSchemas['customer_logo_split'],
    renderer: {
      type: 'css',
      component: 'LogoSplitCSS'
    },
    defaultProperties: componentSchemas['customer_logo_split'].defaultProperties
  },
  
  'iphone_sms': {
    id: 'iphone_sms',
    name: 'iPhone SMS Conversation',
    type: 'component',
    category: 'UI Components',
    description: 'Interactive SMS conversation in iPhone interface',
    duration: 10,
    schema: componentSchemas['iphone_sms'],
    renderer: {
      type: 'css',
      component: 'iPhoneSMSCSS'
    },
    defaultProperties: componentSchemas['iphone_sms'].defaultProperties
  },
  
  // Media Types
  'video': {
    id: 'video',
    name: 'Video File',
    type: 'media',
    category: 'Media',
    description: 'Video file upload',
    duration: 0, // Dynamic based on file
    renderer: {
      type: 'native'
    },
    defaultProperties: {
      scale: 1,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1
    },
    metadata: {
      fileTypes: ['video/mp4', 'video/webm', 'video/mov'],
      supportsLayers: true
    }
  },
  
  'image': {
    id: 'image',
    name: 'Image File',
    type: 'media',
    category: 'Media',
    description: 'Image file upload',
    duration: 0, // Dynamic based on file
    renderer: {
      type: 'native'
    },
    defaultProperties: {
      scale: 1,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1
    },
    metadata: {
      fileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      supportsLayers: true
    }
  },
  
  // Effects
  'fade_in': {
    id: 'fade_in',
    name: 'Fade In',
    type: 'effect',
    category: 'Transitions',
    description: 'Fade in effect',
    duration: 1,
    renderer: {
      type: 'css'
    },
    defaultProperties: {
      duration: 1,
      easing: 'ease-in'
    }
  },
  
  'fade_out': {
    id: 'fade_out',
    name: 'Fade Out',
    type: 'effect',
    category: 'Transitions',
    description: 'Fade out effect',
    duration: 1,
    renderer: {
      type: 'css'
    },
    defaultProperties: {
      duration: 1,
      easing: 'ease-out'
    }
  }
};

// Helper functions
export const getAssetDefinition = (assetType: string): AssetDefinition | null => {
  return assetRegistry[assetType] || null;
};

export const getAssetsByType = (type: 'component' | 'media' | 'effect' | 'text' | 'audio'): AssetDefinition[] => {
  return Object.values(assetRegistry).filter(asset => asset.type === type);
};

export const getAssetsByCategory = (category: string): AssetDefinition[] => {
  return Object.values(assetRegistry).filter(asset => asset.category === category);
};

export const createTimelineItem = (
  assetType: string,
  startTime: number,
  layer: number,
  customProperties?: Record<string, any>
): TimelineItem | null => {
  const assetDef = getAssetDefinition(assetType);
  if (!assetDef) return null;
  
  return {
    id: `timeline_${Date.now()}`,
    type: assetDef.type,
    assetType,
    name: assetDef.name,
    startTime,
    duration: assetDef.duration,
    layer,
    order: 0,
    asset: {
      id: assetDef.id,
      name: assetDef.name,
      type: assetDef.type,
      metadata: assetDef.metadata
    },
    properties: {
      ...assetDef.defaultProperties,
      ...customProperties
    },
    renderer: assetDef.renderer,
    locked: false,
    visible: true,
    muted: false
  };
};
