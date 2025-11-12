import { TimelineTab, TimelineGroup } from './timeline';

export interface Project {
  id: string;
  name: string;
  description?: string;
  template_id?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  folderId?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
  timeline?: TimelineItem[];
  settings?: {
    duration?: number;
    resolution?: string;
    frame_rate?: number;
    mediaAssets?: any[];
    timelineLayers?: any[];
    timelineTabs?: TimelineTab[];
    timelineZoom?: number;
    mediaProperties?: Record<string, any>;
    componentProperties?: Record<string, any>;
  };
  
  // New tabbed timeline system
  timelineTabs?: TimelineTab[];
  activeTabId?: string;
  groups?: TimelineGroup[];
}

export interface TimelineItem {
  id: string;
  component_id: string;
  component: Component;
  start_time: number; // in seconds
  duration: number; // in seconds
  order: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Component {
  id: string;
  name: string;
  type: string;
  category?: string;
  file_path?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  template_id?: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface CreateComponentData {
  name: string;
  type: string;
  category?: string;
  file_path?: string;
  duration?: number;
  metadata?: Record<string, any>;
}
