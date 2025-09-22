// Unified Timeline Item Architecture
// All timeline items (components, media, effects) are treated the same

export interface TimelineItem {
  id: string;
  type: 'component' | 'media' | 'effect' | 'text' | 'audio' | 'group';
  assetType: string; // 'iphone_sms', 'video', 'image', 'customer_logo_split', etc.
  name: string;
  startTime: number;
  duration: number;
  layer: number;
  order: number;
  
  // Asset data - varies by type
  asset: {
    id: string;
    name: string;
    type: string;
    data?: any; // For media files, this is the file data
    metadata?: Record<string, any>;
  };
  
  // Properties - unified for all item types
  properties: Record<string, any>;
  
  // Rendering info
  renderer: {
    type: 'css' | 'html' | 'canvas' | 'hybrid' | 'native';
    component?: string; // For custom components
  };
  
  // Timeline behavior
  locked?: boolean;
  visible?: boolean;
  muted?: boolean;
  
  // Grouping
  groupId?: string; // Reference to parent group
  isGroup?: boolean; // True if this item represents a group
  groupItems?: string[]; // Array of TimelineItem IDs in this group
}

// Layer definition
export interface TimelineLayer {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'effects' | 'text';
  visible: boolean;
  locked: boolean;
  opacity: number;
  items: TimelineItem[];
}

// Timeline state
export interface TimelineState {
  layers: TimelineLayer[];
  totalDuration: number;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  snapToGrid: boolean;
}

// Timeline Tab - represents a timeline view (main or group)
export interface TimelineTab {
  id: string;
  name: string;
  type: 'main' | 'group';
  parentId?: string; // For group tabs, reference to the group item
  items: TimelineItem[];
  layers: TimelineLayer[];
  isActive: boolean;
}

// Timeline Group - represents a grouped set of items
export interface TimelineGroup {
  id: string;
  name: string;
  items: string[]; // Array of TimelineItem IDs
  startTime: number;
  endTime: number;
  color: string;
  collapsed: boolean;
  tabId?: string; // Reference to the tab if opened
}
