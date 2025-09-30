'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PlayIcon, PauseIcon, TrashIcon, ArrowLeftIcon, ArrowDownTrayIcon, ScissorsIcon, ArrowsPointingOutIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Project, Component, TimelineItem } from '@/types';
import { apiEndpoints } from '@/lib/api';
import ComponentRenderer from '@/components/ComponentRenderer';
import { getComponentSchema, getDefaultProperties } from '@/lib/componentSchemas';
import ComponentPropertiesPanel from '@/components/ComponentPropertiesPanel';
import TimelineTabBar from '@/components/TimelineTabBar';
import { useTimelineTabs } from '@/hooks/useTimelineTabs';
import PreviewModal from '@/components/PreviewModal';
import Toast from '@/components/Toast';
import lottie from 'lottie-web';

// Video component that responds to timeline controls
function VideoTimelineControl({ 
  src, 
  startTime, 
  duration, 
  currentTime, 
  isPlaying, 
  className,
  videoStartTime = 0,
  videoEndTime,
  freezeFrame = false,
  freezeFrameTime = 0
}: {
  src: string;
  startTime: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  className: string;
  videoStartTime?: number;
  videoEndTime?: number;
  freezeFrame?: boolean;
  freezeFrameTime?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Function to update video time
  const updateVideoTime = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const timelineEndTime = startTime + duration;
    
    if (currentTime >= startTime && currentTime <= timelineEndTime) {
      if (freezeFrame) {
        // Freeze frame behavior - only freeze the extended portion
        // Check if we're in the extended area (beyond the original content)
        // For freeze frame, we want to freeze at the end of the original video content
        // The original content duration is the duration BEFORE we extended it with freeze frame
        // We need to calculate this from the freezeFrameTime
        const originalContentDuration = freezeFrameTime - videoStartTime;
        const extendedStartTime = startTime + originalContentDuration;
        
        if (currentTime >= extendedStartTime) {
          // We're in the extended area - show the freeze frame
          const targetVideoTime = freezeFrameTime;
          if (isFinite(targetVideoTime) && targetVideoTime >= 0 && targetVideoTime <= video.duration) {
            video.currentTime = targetVideoTime;
        }
      } else {
          // We're in the original content area - play normally
          const videoProgress = (currentTime - startTime) / originalContentDuration;
          const targetVideoTime = videoStartTime + (videoProgress * originalContentDuration);
          if (isFinite(targetVideoTime) && targetVideoTime >= 0 && targetVideoTime <= video.duration) {
            video.currentTime = targetVideoTime;
          }
        }
      } else {
        // Normal video playback
      const videoProgress = (currentTime - startTime) / duration;
      
        // Calculate the actual video time based on cropping
        const actualVideoDuration = videoEndTime ? videoEndTime - videoStartTime : video.duration;
        const targetVideoTime = videoStartTime + (videoProgress * actualVideoDuration);
        
        if (isFinite(targetVideoTime) && targetVideoTime >= 0 && targetVideoTime <= video.duration) {
          video.currentTime = targetVideoTime;
        }
      }
    }
  }, [currentTime, startTime, duration, videoStartTime, videoEndTime, freezeFrame, freezeFrameTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Control video playback based on timeline
    if (isPlaying) {
      video.play();
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Handle video load event
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      updateVideoTime();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    return () => video.removeEventListener('loadeddata', handleLoadedData);
  }, []);

  useEffect(() => {
    updateVideoTime();
  }, [updateVideoTime]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      muted
      loop
    />
  );
}

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Start at 0s
  const [totalDuration, setTotalDuration] = useState(0);
  const [hasPlayedBefore, setHasPlayedBefore] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<Component | null>(null);
  const [draggedMediaAsset, setDraggedMediaAsset] = useState<any>(null);
  const [draggedLayer, setDraggedLayer] = useState<any>(null);
  const [draggedTimelineItem, setDraggedTimelineItem] = useState<any>(null);
  const [draggedMediaItem, setDraggedMediaItem] = useState<any>(null);
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
    time: number;
    layer: number;
    snapTarget?: string;
    itemId?: string;
    layerId?: string;
    startTime?: number;
    duration?: number;
    swapTarget?: string;
    isPlaceholder?: boolean;
  } | null>(null);
  const [dragOutline, setDragOutline] = useState<{x: number, y: number, time: number, layer: number, width: number, item: any, targetTop?: number, isPlaceholder?: boolean} | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [editingLayerValue, setEditingLayerValue] = useState('');
  const [timelineZoom, setTimelineZoom] = useState(1); // 1 = normal, 2 = 2x zoom, 0.5 = half zoom
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);

  // Timeline tab system
  const {
    tabs,
    groups,
    activeTabId,
    activeTab,
    switchTab,
    closeTab,
    renameTab,
    createGroupTab,
    createGroup,
    updateTabItems,
    updateTabLayers
  } = useTimelineTabs();
  const [timelineLayers, setTimelineLayers] = useState<{
    id: string;
    name: string;
    visible: boolean;
    items: (TimelineItem | {
      id: string;
      asset: any;
      start_time: number;
      duration: number;
      layerId: string;
      type: 'media';
    })[];
  }[]>([]);

  // Tab system for grouping
  const [timelineTabs, setTimelineTabs] = useState<{
    id: string;
    name: string;
    type: 'main' | 'group';
    layers: string[]; // Array of layer IDs in this tab
  }[]>([
    {
      id: 'main-video',
      name: 'Main Video',
      type: 'main',
      layers: []
    }
  ]);
  const [currentActiveTab, setCurrentActiveTab] = useState<string>('main-video');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState<string>('');
  const [isDraggingItem, setIsDraggingItem] = useState<{
    itemId: string;
    layerId: string;
    startX: number;
    startTime: number;
  } | null>(null);
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm' | 'mov'>('mp4');
  const [hasAlphaChannel, setHasAlphaChannel] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  
  // Clip splitting state
  const [hoveredItem, setHoveredItem] = useState<{itemId: string; layerId: string} | null>(null);
  const [showScissors, setShowScissors] = useState(false);
  
  // Undo system state - automatic state capture
  // Automatic undo/redo system - captures ALL state changes
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);
  const [lastStateSnapshot, setLastStateSnapshot] = useState<any>(null);
  
  // Drag vs click detection
  const [justDragged, setJustDragged] = useState(false);
  
  // Freeze frame functionality
  const [isOptionHeld, setIsOptionHeld] = useState(false);
  
  // Component properties state
  const [componentProperties, setComponentProperties] = useState<{[key: string]: any}>({});
  
  // Media properties state
  const [mediaProperties, setMediaProperties] = useState<{[key: string]: any}>({});
  const [selectedMediaItem, setSelectedMediaItem] = useState<any>(null);

  // ===== AUTOMATIC UNDO/REDO SYSTEM =====
  // This system automatically captures ALL state changes without manual intervention
  
  // Define all state variables that should be tracked for undo/redo
  const stateConfig = {
    // Core timeline state
    timelineLayers: { getter: () => timelineLayers, setter: setTimelineLayers, default: [] },
    timelineTabs: { getter: () => timelineTabs, setter: setTimelineTabs, default: [] },
    currentActiveTab: { getter: () => currentActiveTab, setter: setCurrentActiveTab, default: 'main-video' },
    
    // Properties state
    mediaProperties: { getter: () => mediaProperties, setter: setMediaProperties, default: {} },
    componentProperties: { getter: () => componentProperties, setter: setComponentProperties, default: {} },
    
    // Selection state
    selectedItems: { getter: () => Array.from(selectedItems), setter: (val: any[]) => setSelectedItems(new Set(val)), default: [] },
    selectedMediaItem: { getter: () => selectedMediaItem, setter: setSelectedMediaItem, default: null },
    selectedTimelineItem: { getter: () => selectedTimelineItem, setter: setSelectedTimelineItem, default: null },
    
    // UI state
    currentTime: { getter: () => currentTime, setter: setCurrentTime, default: 0 },
    timelineZoom: { getter: () => timelineZoom, setter: setTimelineZoom, default: 1 },
    isPlaying: { getter: () => isPlaying, setter: setIsPlaying, default: false },
    
    // Add new state variables here - they'll be automatically handled
  };

  // Capture current state snapshot
  const captureStateSnapshot = () => {
    const snapshot: any = {};
    Object.entries(stateConfig).forEach(([key, config]) => {
      snapshot[key] = JSON.parse(JSON.stringify(config.getter()));
    });
    return snapshot;
  };

  // Restore state from snapshot
  const restoreStateSnapshot = (snapshot: any) => {
    Object.entries(stateConfig).forEach(([key, config]) => {
      const value = snapshot[key] !== undefined ? snapshot[key] : config.default;
      config.setter(value);
    });
  };

  // Save current state to history
  const saveToHistory = () => {
    if (isUndoRedoOperation) return; // Don't save during undo/redo operations
    
    const currentSnapshot = captureStateSnapshot();
    
    // Only save if state has actually changed
    if (lastStateSnapshot && JSON.stringify(currentSnapshot) === JSON.stringify(lastStateSnapshot)) {
      return;
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentSnapshot);
    
    // Limit history to 100 states to prevent memory issues
    if (newHistory.length > 100) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
    setLastStateSnapshot(currentSnapshot);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoOperation(true);
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      restoreStateSnapshot(state);
      setHistoryIndex(newIndex);
      setLastStateSnapshot(state);
      setTimeout(() => setIsUndoRedoOperation(false), 0);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoOperation(true);
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      restoreStateSnapshot(state);
      setHistoryIndex(newIndex);
      setLastStateSnapshot(state);
      setTimeout(() => setIsUndoRedoOperation(false), 0);
    }
  };

  // Auto-save state changes with debouncing
  useEffect(() => {
    if (isUndoRedoOperation) return;
    
    const timeoutId = setTimeout(() => {
      saveToHistory();
    }, 100); // Debounce to avoid too many saves
    
    return () => clearTimeout(timeoutId);
  }, [
    timelineLayers, timelineTabs, currentActiveTab, 
    mediaProperties, componentProperties, 
    selectedItems, selectedMediaItem, selectedTimelineItem,
    currentTime, timelineZoom, isPlaying
  ]);

  // Initialize history with first state
  useEffect(() => {
    if (timelineLayers.length > 0 && history.length === 0) {
      const initialState = captureStateSnapshot();
      setHistory([initialState]);
      setHistoryIndex(0);
      setLastStateSnapshot(initialState);
    }
  }, [timelineLayers.length, history.length]);

  // Utility function to wrap state changes with history
  const withHistory = (fn: () => void) => {
    fn();
    saveToHistory();
  };

  // Utility function to remove empty layers
  const removeEmptyLayers = () => {
    setTimelineLayers(prev => prev.filter(layer => layer.items.length > 0));
  };
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Helper functions to identify item types
  const isComponentItem = (item: any): item is TimelineItem => {
    return item.component_id !== undefined && item.component !== undefined;
  };

  const isMediaItem = (item: any): item is {id: string; asset: any; start_time: number; duration: number; layerId: string; type: 'media'} => {
    return item.type === 'media' || item.asset !== undefined;
  };



  // Click to move scrubber to item position
  const handleItemClick = (item: any, event: React.MouseEvent) => {
    // Calculate click position within the item
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const itemWidth = rect.width;
    const clickProgress = clickX / itemWidth;
    
    // Calculate the time position within the item
    const timeInItem = clickProgress * item.duration;
    const newTime = item.start_time + timeInItem;
    
    setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
  };

  // Utility function for deep copying properties (scalable approach)
  const deepCopyProperties = (originalProperties: any) => {
    if (!originalProperties) return null;
    return JSON.parse(JSON.stringify(originalProperties)); // Deep copy
  };

  // Utility function to inherit all properties from original item to new items
  const inheritProperties = (originalItemId: string, newItemIds: string[]) => {
    // Copy media properties (if they exist)
    const originalMediaProperties = mediaProperties[originalItemId];
    if (originalMediaProperties) {
      const copiedProperties = deepCopyProperties(originalMediaProperties);
      setMediaProperties(prev => {
        const newProps = { ...prev };
        newItemIds.forEach(id => {
          newProps[id] = copiedProperties;
        });
        return newProps;
      });
    }
    
    // Copy component properties (if they exist)
    const originalComponentProperties = componentProperties[originalItemId];
    if (originalComponentProperties) {
      const copiedProperties = deepCopyProperties(originalComponentProperties);
      setComponentProperties(prev => {
        const newProps = { ...prev };
        newItemIds.forEach(id => {
          newProps[id] = copiedProperties;
        });
        return newProps;
      });
    }
  };

  // Clip splitting functionality
  const splitClip = (itemId: string, layerId: string, splitTime: number) => {
      // Find which group (if any) contains this item
      const containingGroup = timelineTabs.find(tab => 
        tab.type === 'group' && (tab as any).items && (tab as any).items.includes(itemId)
      );
      
      // Generate unique IDs for the split parts
      const timestamp = Date.now();
      const firstPartId = `${itemId}_part1_${timestamp}`;
      const secondPartId = `${itemId}_part2_${timestamp}`;
      
      setTimelineLayers(prev => prev.map(layer => {
        if (layer.id !== layerId) return layer;
        
        return {
          ...layer,
          items: layer.items.flatMap(item => {
            if (item.id !== itemId) return [item];
            
            // Can't split if time is at the very start or end
            if (splitTime <= item.start_time || splitTime >= item.start_time + item.duration) {
              return [item];
            }
            
            // Calculate split point within the item
            const timeIntoItem = splitTime - item.start_time;
            
            // Create two new items with proper video cropping to maintain original speed
            const firstPart = {
              ...item,
              id: firstPartId,
              duration: timeIntoItem,
              // For video items, add crop information to maintain original speed
              ...(isMediaItem(item) && item.asset?.type === 'video' ? {
                videoStartTime: 0, // First part starts from beginning of video
                videoEndTime: timeIntoItem // First part ends at the split point
              } : {})
            };
            
            const secondPart = {
              ...item,
              id: secondPartId,
              start_time: splitTime,
              duration: item.duration - timeIntoItem,
              // For video items, add crop information to maintain original speed
              ...(isMediaItem(item) && item.asset?.type === 'video' ? {
                videoStartTime: timeIntoItem, // Second part starts from split point
                videoEndTime: item.duration // Second part ends at original end
              } : {})
            };
            
            return [firstPart, secondPart];
          })
        };
      }));
      
      // Inherit ALL properties from original item to both split parts (scalable approach)
      // This automatically handles any current or future properties without code changes
      inheritProperties(itemId, [firstPartId, secondPartId]);
      
      // If the item was in a group, add the new parts to the same group
      if (containingGroup) {
        setTimelineTabs(prev => prev.map(tab => {
          if (tab.id === containingGroup.id) {
            return {
              ...tab,
              items: [
                ...(tab as any).items.filter((id: string) => id !== itemId), // Remove original
                firstPartId,
                secondPartId
              ]
            };
          }
          return tab;
        }));
      }
  };

  // Group management functions
  // Calculate group duration based on its contents
  const calculateGroupDuration = (itemIds: string[]) => {
    let earliestStart = Infinity;
    let latestEnd = 0;
    
    // Find all items across all layers that belong to this group
    timelineLayers.forEach(layer => {
      layer.items.forEach(item => {
        if (itemIds.includes(item.id)) {
          earliestStart = Math.min(earliestStart, item.start_time);
          latestEnd = Math.max(latestEnd, item.start_time + item.duration);
        }
      });
    });
    
    // Return duration and start time, or defaults if no items found
    if (earliestStart === Infinity) {
      return { startTime: 0, duration: 10 };
    }
    
    return {
      startTime: earliestStart,
      duration: latestEnd - earliestStart
    };
  };

  const createNewGroup = (selectedItemIds: string[], groupName: string) => {
    
    const groupId = `group_${Date.now()}`;
    const newGroup = {
      id: groupId,
      name: groupName,
      type: 'group' as const,
      items: selectedItemIds // Store individual item IDs instead of layer IDs
    };

    // Calculate actual group duration based on contents
    const groupTiming = calculateGroupDuration(selectedItemIds);

    // Add group as a timeline item in the current tab
    const groupItem = {
      id: groupId,
      name: groupName,
      type: 'group',
      start_time: groupTiming.startTime,
      duration: groupTiming.duration,
      layerId: 'group-layer',
      isGroup: true,
      items: selectedItemIds // Store individual item IDs
    };

    // Add group item to timeline layers
    setTimelineLayers(prev => {
      const newLayers = [...prev];
      // Find or create a group layer
      let groupLayer = newLayers.find(layer => layer.id === 'group-layer');
      if (!groupLayer) {
        groupLayer = {
          id: 'group-layer',
          name: 'Groups',
          visible: true,
          items: []
        };
        newLayers.push(groupLayer);
      }
      if (groupLayer) {
        // Check if group already exists to prevent duplicates
        const existingGroup = groupLayer.items.find(item => item.id === groupId);
        if (!existingGroup) {
          groupLayer.items.push(groupItem as any);
        }
      }
      return newLayers;
    });

    // Add group to tabs for navigation
    setTimelineTabs(prev => [...prev, newGroup as any]);
    setCurrentActiveTab(groupId);
    setSelectedItems(new Set());
    
    // Auto-enter rename mode for the group name
    setTimeout(() => {
      const groupElement = document.querySelector(`[data-group-id="${groupId}"] .group-name`) as HTMLInputElement;
      if (groupElement) {
        groupElement.focus();
        groupElement.select();
      }
    }, 100);
    
    console.log('Created group:', groupName, 'with items:', selectedItemIds);
    console.log('Group ID:', groupId);
    console.log('Group item:', groupItem);
  };

  const moveLayersToGroup = (layerIds: string[], groupId: string) => {
    setTimelineTabs(prev => prev.map(tab => 
      tab.id === groupId 
        ? { ...tab, layers: [...tab.layers, ...layerIds] }
        : tab
    ));
  };

  const moveLayersFromGroup = (layerIds: string[], groupId: string) => {
    setTimelineTabs(prev => prev.map(tab => 
      tab.id === groupId 
        ? { ...tab, layers: tab.layers.filter(id => !layerIds.includes(id)) }
        : tab
    ));
  };

  const deleteGroup = (groupId: string) => {
    // Remove from tabs
    setTimelineTabs(prev => prev.filter(tab => tab.id !== groupId));
    
    // Remove from timeline layers
    setTimelineLayers(prev => prev.map(layer => ({
      ...layer,
      items: layer.items.filter(item => item.id !== groupId)
    })));
    
    if (currentActiveTab === groupId) {
      setCurrentActiveTab('main-video');
    }
  };

  const renameGroup = (groupId: string, newName: string) => {
    // Update in tabs
    setTimelineTabs(prev => prev.map(tab => 
      tab.id === groupId ? { ...tab, name: newName } : tab
    ));
    
    // Update in timeline layers
    setTimelineLayers(prev => prev.map(layer => ({
      ...layer,
      items: layer.items.map(item => 
        item.id === groupId ? { ...item, name: newName } : item
      )
    })));
  };

  const openGroup = (groupId: string) => {
    setCurrentActiveTab(groupId);
  };

  const handleGroupDoubleClick = (groupId: string) => {
    openGroup(groupId);
  };

  const handleGroupNameEdit = (groupId: string, newName: string) => {
    if (newName.trim()) {
      renameGroup(groupId, newName.trim());
    }
  };

  const startEditingTab = (tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditingTabName(currentName);
  };

  const finishEditingTab = () => {
    if (editingTabId && editingTabName.trim()) {
      if (editingTabId === 'main-video') {
        // Can't rename main video tab
        setEditingTabId(null);
        setEditingTabName('');
        return;
      }
      
      // Update tab name
      setTimelineTabs(prev => prev.map(tab => 
        tab.id === editingTabId ? { ...tab, name: editingTabName.trim() } : tab
      ));
      
      // Also update group item name if it's a group
      setTimelineLayers(prev => prev.map(layer => ({
        ...layer,
        items: layer.items.map(item => 
          item.id === editingTabId ? { ...item, name: editingTabName.trim() } as any : item
        )
      })));
    }
    
    setEditingTabId(null);
    setEditingTabName('');
  };

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingTab();
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingTabName('');
    }
  };

  // Collision detection and snapping functions
  const checkCollision = (itemId: string, layerId: string, newStartTime: number, duration: number) => {
    const layer = timelineLayers.find(l => l.id === layerId);
    if (!layer) return null;

    // Filter items based on current active tab to avoid cross-tab collisions
    let layerItems = layer.items;
    
    // Find the active tab data
    const activeTabData = timelineTabs.find(tab => tab.id === currentActiveTab);
    
    if (currentActiveTab === 'main-video') {
      // Main video shows items not in any group
      const allGroupItems = timelineTabs
        .filter(tab => tab.id !== 'main-video')
        .flatMap(tab => (tab as any).items || []);
      layerItems = layer.items.filter(item => !allGroupItems.includes(item.id));
    } else if (activeTabData) {
      // Group tabs show only items in that group
      const groupItems = (activeTabData as any).items || [];
      layerItems = layer.items.filter(item => groupItems.includes(item.id));
    }

    const otherItems = layerItems.filter(item => item.id !== itemId);
    const newEndTime = newStartTime + duration;

    // Calculate snap threshold based on timeline width
    const timelineWidth = timelineRef.current?.getBoundingClientRect().width || 1000;
    const snapThreshold = (30 / timelineWidth) * totalDuration; // 30px threshold (reasonable)

    // Check for snap to 0s mark
    if (Math.abs(newStartTime - 0) < snapThreshold) {
      return {
        type: 'snap',
        item: null,
        snapTime: 0,
        snapPosition: 'start'
      };
    }

    // Check for snap to current playhead position
    if (Math.abs(newStartTime - currentTime) < snapThreshold) {
      return {
        type: 'snap',
        item: null,
        snapTime: currentTime,
        snapPosition: 'playhead'
      };
    }

    // Check for buffer zone at end of timeline (last 200px)
    const bufferZonePixels = 200;
    const bufferZoneTime = (bufferZonePixels / timelineWidth) * totalDuration;
    const timelineEnd = totalDuration;
    const bufferZoneStart = timelineEnd - bufferZoneTime;
    
    if (newStartTime >= bufferZoneStart && newStartTime < timelineEnd) {
      // In buffer zone - allow placement but don't force snap
      return null; // Allow free placement in buffer zone
    }

    for (const otherItem of otherItems) {
      const otherStart = otherItem.start_time;
      const otherEnd = otherItem.start_time + otherItem.duration;

      // Check for overlap - if overlap detected, force snap instead
      if (newStartTime < otherEnd && newEndTime > otherStart) {
        // Determine which snap position is closer
        const snapToStart = Math.abs(newEndTime - otherStart);
        const snapToEnd = Math.abs(newStartTime - otherEnd);
        
        if (snapToStart < snapToEnd) {
          // Snap before the other item
          return {
            type: 'snap',
            item: otherItem,
            snapTime: otherStart - duration,
            snapPosition: 'before'
          };
        } else {
          // Snap after the other item
          return {
            type: 'snap',
            item: otherItem,
            snapTime: otherEnd,
            snapPosition: 'after'
          };
        }
      }

      // Check for snap opportunities
      const snapToStart = Math.abs(newEndTime - otherStart) < snapThreshold;
      const snapToEnd = Math.abs(newStartTime - otherEnd) < snapThreshold;

      if (snapToStart) {
        return {
          type: 'snap',
          item: otherItem,
          snapTime: otherStart - duration,
          snapPosition: 'before'
        };
      }

      if (snapToEnd) {
        return {
          type: 'snap',
          item: otherItem,
          snapTime: otherEnd,
          snapPosition: 'after'
        };
      }
    }

    return null;
  };

  const handleItemDrag = (itemId: string, layerId: string, newStartTime: number) => {
    const item = timelineLayers
      .find(l => l.id === layerId)
      ?.items.find(i => i.id === itemId);
    
    if (!item) return;

    const collision = checkCollision(itemId, layerId, newStartTime, item.duration);
    
    if (collision && collision.type === 'snap') {
      // Snap to adjacent item, 0s mark, or playhead
      setDragPreview({
        x: 0,
        y: 0,
        time: collision.snapTime || 0,
        layer: 0,
        itemId,
        layerId,
        startTime: collision.snapTime || 0,
        duration: item.duration
      });
    } else {
      // No collision - normal drag
      setDragPreview({
        x: 0,
        y: 0,
        time: newStartTime,
        layer: 0,
        itemId,
        layerId,
        startTime: newStartTime,
        duration: item.duration
      });
    }
  };

  const handleItemDrop = (itemId: string, layerId: string, finalStartTime: number) => {
    const item = timelineLayers
      .find(l => l.id === layerId)
      ?.items.find(i => i.id === itemId);
    
    if (!item) return;

    // Store the snap position before clearing dragPreview
    const snapPosition = dragPreview?.startTime;
    const finalPosition = snapPosition !== undefined ? snapPosition : finalStartTime;
    
    // Clear drag preview first
    setDragPreview(null);
    
    withHistory(() => {
      // Normal drop - use final position (which may be snapped)
      setTimelineLayers(prev => prev.map(layer => ({
        ...layer,
        items: layer.items.map(i => {
          if (i.id === itemId) {
            const updatedItem = { ...i, start_time: finalPosition };
            // Preserve video cropping properties for split clips
            if (isMediaItem(i) && i.asset?.type === 'video' && 
                ((i as any).videoStartTime !== undefined || (i as any).videoEndTime !== undefined)) {
              return {
                ...updatedItem,
                videoStartTime: (i as any).videoStartTime,
                videoEndTime: (i as any).videoEndTime
              };
            }
            return updatedItem;
          }
          return i;
        })
      })));
    });
    
    // Clean up empty layers after a short delay to allow state updates to complete
    setTimeout(() => {
      removeEmptyLayers();
    }, 100);
  };

  // Move item from one layer to another
  const moveItemToLayer = (itemId: string, fromLayerId: string, toLayerId: string, finalStartTime: number) => {
    const item = timelineLayers
      .find(l => l.id === fromLayerId)
      ?.items.find(i => i.id === itemId);
    
    if (!item) return;

    // Check for collisions in the target layer
    const collision = checkCollision(itemId, toLayerId, finalStartTime, item.duration);
    
    setTimelineLayers(prev => prev.map(layer => {
      if (layer.id === fromLayerId) {
        // Remove item from source layer
        return {
          ...layer,
          items: layer.items.filter(i => i.id !== itemId)
        };
      } else if (layer.id === toLayerId) {
        // Add item to target layer
        const newItem = { 
          ...item, 
          start_time: collision?.snapTime || finalStartTime,
          layerId: toLayerId,
          // Preserve video cropping properties for split clips
          ...(isMediaItem(item) && item.asset?.type === 'video' && 
              ((item as any).videoStartTime !== undefined || (item as any).videoEndTime !== undefined) ? {
            videoStartTime: (item as any).videoStartTime,
            videoEndTime: (item as any).videoEndTime
          } : {})
        };
        return {
          ...layer,
          items: [...layer.items, newItem]
        };
      }
      return layer;
    }));

    setDragPreview(null);
    
    // Clean up empty layers after a short delay to allow state updates to complete
    setTimeout(() => {
      removeEmptyLayers();
    }, 100);
  };

  const ungroupGroup = (groupId: string) => {
    
    // Find the group item
    const groupItem = timelineLayers
      .find(layer => layer.id === 'group-layer')
      ?.items.find(item => item.id === groupId);
    
    if (!groupItem || !(groupItem as any).isGroup) return;
    
    const groupItems = (groupItem as any).items || [];
    
    // Remove the group item from timeline
    setTimelineLayers(prev => prev.map(layer => ({
      ...layer,
      items: layer.items.filter(item => item.id !== groupId)
    })));
    
    // Remove the group tab
    setTimelineTabs(prev => prev.filter(tab => tab.id !== groupId));
    
    // Switch back to main video if we were in the group
    if (currentActiveTab === groupId) {
      setCurrentActiveTab('main-video');
    }
    
    console.log('Ungrouped group:', groupId, 'items returned to main video:', groupItems);
  };

  // Multi-select functions
  const toggleItemSelection = (itemId: string, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    } else {
      // If clicking without Cmd/Ctrl, toggle selection
      setSelectedItems(prev => {
        if (prev.has(itemId)) {
          // If already selected, deselect it
          return new Set();
        } else {
          // If not selected, select only this item
          return new Set([itemId]);
        }
      });
    }
  };

  // Clear selection when clicking on blank timeline areas
  const handleTimelineClick = (e: React.MouseEvent) => {
    // Check if we clicked on a timeline item (has data-group-id or is absolute positioned)
    const target = e.target as HTMLElement;
    const isTimelineItem = target.closest('[data-group-id]') || 
                          target.closest('.absolute') ||
                          target.closest('.group');
    
    // Only clear selection if we didn't click on a timeline item
    if (!isTimelineItem) {
      setSelectedItems(new Set());
      setSelectedMediaItem(null);
      setSelectedTimelineItem(null);
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const selectAll = () => {
    const allItemIds = timelineLayers.flatMap(layer => 
      layer.items.map(item => item.id)
    );
    setSelectedItems(new Set(allItemIds));
  };

  // Global mouse event listeners for item dragging
  useEffect(() => {
    if (isDraggingItem) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDraggingItem, dragPreview]);

  // Track Option key for freeze frame functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsOptionHeld(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsOptionHeld(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 'g' && !e.shiftKey) {
          e.preventDefault();
          if (selectedItems.size > 0) {
            // Use selected item IDs directly instead of converting to layer IDs
            const selectedItemIds = Array.from(selectedItems);
            
            console.log('Selected items:', selectedItemIds);
            console.log('All timeline layers:', timelineLayers.map(l => ({ id: l.id, name: l.name, itemCount: l.items.length })));
            console.log('Items in each layer:', timelineLayers.map(l => ({ 
              layerId: l.id, 
              items: l.items.map(item => ({ id: item.id, name: (item as any).name || (item as any).asset?.name || 'Unknown' }))
            })));
            
            if (selectedItemIds.length > 0) {
              const groupName = `Group ${timelineTabs.filter(t => t.type === 'group').length + 1}`;
              createNewGroup(selectedItemIds, groupName);
            }
          }
        } else if (e.key === 'g' && e.shiftKey) {
          e.preventDefault();
          // Ungroup selected groups
          if (selectedItems.size > 0) {
            const selectedGroupIds = Array.from(selectedItems).filter(itemId => {
              const layer = timelineLayers.find(l => 
                l.items.some(item => item.id === itemId && (item as any).isGroup)
              );
              return layer !== undefined;
            });
            
            selectedGroupIds.forEach(groupId => {
              ungroupGroup(groupId);
            });
            
            if (selectedGroupIds.length > 0) {
              setSelectedItems(new Set());
            }
          }
        } else if (e.key === 'a') {
          e.preventDefault();
          selectAll();
        }
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected groups with confirmation
        if (selectedItems.size > 0) {
          const selectedGroupIds = Array.from(selectedItems).filter(itemId => {
            const layer = timelineLayers.find(l => 
              l.items.some(item => item.id === itemId && (item as any).isGroup)
            );
            return layer !== undefined;
          });
          
          if (selectedGroupIds.length > 0) {
            const groupNames = selectedGroupIds.map(groupId => {
              const groupItem = timelineLayers
                .find(layer => layer.id === 'group-layer')
                ?.items.find(item => item.id === groupId);
              return (groupItem as any)?.name || 'Unknown Group';
            });
            
            const confirmMessage = `Delete ${groupNames.length > 1 ? 'groups' : 'group'} "${groupNames.join('", "')}"?\n\nClick "Keep Layers" to ungroup (layers return to main video)\nClick "Delete All" to permanently delete the layers\nClick "Cancel" to do nothing`;
            
            if (confirm(confirmMessage)) {
              // Ask what to do with the layers
              const keepLayers = confirm('Keep the layers? (Click OK to ungroup, Cancel to delete everything)');
              
              selectedGroupIds.forEach(groupId => {
                if (keepLayers) {
                  ungroupGroup(groupId);
                } else {
                  deleteGroup(groupId);
                }
              });
              
              setSelectedItems(new Set());
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, timelineTabs]);

  // Migration function to move components from timeline array to timelineLayers
  const migrateComponentsToTimelineLayers = () => {
    if (timeline.length === 0) return;

    // Create a components layer if it doesn't exist
    const componentsLayer = timelineLayers.find(layer => layer.id === 'components-layer');
    
    if (!componentsLayer) {
      // Create new components layer
      const newComponentsLayer = {
        id: 'components-layer',
        name: 'Components',
        visible: true,
        items: timeline as TimelineItem[]
      };
      
      setTimelineLayers(prev => [newComponentsLayer, ...prev]);
    } else {
      // Add components to existing layer
      setTimelineLayers(prev => prev.map(layer => 
        layer.id === 'components-layer' 
          ? { ...layer, items: [...timeline, ...layer.items] }
          : layer
      ));
    }
    
    // Clear the old timeline array
    setTimeline([]);
  };

  useEffect(() => {
    loadProject();
    loadComponents();
    loadLottieData();
  }, [projectId]);

  // Handle URL parameters for preview mode
  useEffect(() => {
    const viewMode = searchParams.get('view');
    if (viewMode === 'preview') {
      setShowPreviewModal(true);
    }
  }, [searchParams]);

  // Generate shareable link
  const generateShareLink = () => {
    const currentUrl = window.location.origin;
    const shareUrl = `${currentUrl}/projects/${projectId}/watch`;
    return shareUrl;
  };

  // Copy share link to clipboard
  const copyShareLink = async () => {
    try {
      const shareUrl = generateShareLink();
      await navigator.clipboard.writeText(shareUrl);
      setToast({ message: 'Watch link copied to clipboard!', type: 'success' });
    } catch (error) {
      console.error('Failed to copy link:', error);
      setToast({ message: 'Failed to copy link. Please try again.', type: 'error' });
    }
  };

  // Skip functions for preview controls
  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(totalDuration, currentTime + 10);
    setCurrentTime(newTime);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Migration effect - move components to timelineLayers when they're loaded
  useEffect(() => {
    if (timeline.length > 0) {
      migrateComponentsToTimelineLayers();
    }
  }, [timeline]);

  const loadLottieData = async () => {
    try {
      const response = await fetch('/CustomerLogoSplit.json');
      const data = await response.json();
      setLottieData(data);
    } catch (error) {
      console.error('Error loading Lottie data:', error);
    }
  };

  useEffect(() => {
    if (project) {
      setTimeline(project.timeline || []);
      calculateTotalDuration(project.timeline || []);
    }
  }, [project]);

  // Populate component objects in timeline items when both project and components are loaded
  useEffect(() => {
    if (project?.timeline && components.length > 0) {
      const timelineWithComponents = project.timeline.map(item => ({
        ...item,
        component: components.find(comp => comp.id === item.component_id) || item.component
      }));
      setTimeline(timelineWithComponents);
    }
  }, [project, components]);

  useEffect(() => {
    calculateTotalDuration(timeline);
  }, [timelineLayers]);

  // Save initial state to history when timeline loads

  // Keyboard shortcuts for timeline control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setTimelineZoom(Math.min(4, timelineZoom + 0.25));
      } else if (e.key === '-') {
        e.preventDefault();
        setTimelineZoom(Math.max(0.25, timelineZoom - 0.25));
      } else if (e.key === '0') {
        e.preventDefault();
        setTimelineZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timelineZoom]);

  const loadProject = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await apiEndpoints.getProject(projectId);
        const projectData = response.data.data;
        setProject(projectData);
        
        // Restore component properties if they exist
        if (projectData.componentProperties) {
          setComponentProperties(projectData.componentProperties);
        } else if (projectData.timeline) {
          // Extract properties from timeline items if they exist
          const properties: { [key: string]: any } = {};
          projectData.timeline.forEach((item: any) => {
            if (item.properties && item.component?.id) {
              properties[item.component.id] = item.properties;
            }
          });
          setComponentProperties(properties);
        }

        // Also restore component properties from timelineLayers
        if (projectData.settings?.timelineLayers) {
          const properties: { [key: string]: any } = {};
          projectData.settings.timelineLayers.forEach((layer: any) => {
            layer.items.forEach((item: any) => {
              if (item.properties && item.component?.id) {
                properties[item.component.id] = item.properties;
              }
            });
          });
          if (Object.keys(properties).length > 0) {
            setComponentProperties(prev => ({ ...prev, ...properties }));
          }
        }

        // Restore media assets, timeline layers, zoom, and media properties from settings if they exist
        if (projectData.settings) {
          if (projectData.settings.mediaAssets) {
            setMediaAssets(projectData.settings.mediaAssets);
          }
          if (projectData.settings.timelineLayers) {
            // Migrate existing media items to have type: 'media' property
            const migratedLayers = projectData.settings.timelineLayers.map((layer: any) => ({
              ...layer,
              items: layer.items.map((item: any) => {
                // If item has asset property but no type, it's a media item
                if (item.asset && !item.type) {
                  return { ...item, type: 'media' };
                }
                return item;
              })
            }));
            setTimelineLayers(migratedLayers);
          }
          if (projectData.settings.timelineTabs) {
            setTimelineTabs(projectData.settings.timelineTabs);
          }
          if (projectData.settings.timelineZoom) {
            setTimelineZoom(projectData.settings.timelineZoom);
          }
          if (projectData.settings.mediaProperties) {
            setMediaProperties(projectData.settings.mediaProperties);
          }
        }
        return; // Success, exit the retry loop
      } catch (error) {
        console.error(`Error loading project (attempt ${attempt}/${retries}):`, error);
        
        // If it's a network error and we have retries left, wait and try again
        if (attempt < retries && (
          (error as any).message?.includes('Network Error') ||
          (error as any).message?.includes('ERR_NETWORK') ||
          (error as any).code === 'ERR_NETWORK' ||
          (error as any).response?.status >= 500
        )) {
          console.log(`Retrying project load in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        // If all retries failed, show error message
        if (attempt === retries) {
          console.error('Failed to load project after all retries');
        }
      }
    }
  };

  const loadComponents = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await apiEndpoints.getComponents();
        setComponents(response.data.data || []);
        return; // Success, exit the retry loop
      } catch (error) {
        console.error(`Error loading components (attempt ${attempt}/${retries}):`, error);
        
        // If it's a network error and we have retries left, wait and try again
        if (attempt < retries && (
          (error as any).message?.includes('Network Error') ||
          (error as any).message?.includes('ERR_NETWORK') ||
          (error as any).code === 'ERR_NETWORK' ||
          (error as any).response?.status >= 500
        )) {
          console.log(`Retrying components load in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        // If all retries failed, set empty array as fallback
        if (attempt === retries) {
          console.error('Failed to load components after all retries, using empty array');
          setComponents([]);
        }
      }
    }
  };

  const calculateTotalDuration = (timelineItems: TimelineItem[]) => {
    const componentMaxTime = Math.max(...timelineItems.map(item => item.start_time + item.duration), 0);
    const mediaMaxTime = Math.max(...timelineLayers.flatMap(layer => 
      layer.items.map(item => item.start_time + item.duration)
    ), 0);
    const maxEndTime = Math.max(componentMaxTime, mediaMaxTime);
    
    // Set minimum duration to 5 seconds (for CSS animations) if no timeline items
    const finalDuration = maxEndTime > 0 ? maxEndTime : 5;
    setTotalDuration(finalDuration);
  };

  const handleDragStart = (e: React.DragEvent, component: Component) => {
    setDraggedComponent(component);
    setDraggedMediaAsset(null);
    setDragPreview(null); // Clear any existing drag preview
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMediaDragStart = (e: React.DragEvent, mediaAsset: any) => {
    setDraggedMediaAsset(mediaAsset);
    setDraggedComponent(null);
    setDraggedLayer(null);
    setDragPreview(null); // Clear any existing drag preview
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDragStart = (e: React.DragEvent, layer: any) => {
    setDraggedLayer(layer);
    setDraggedComponent(null);
    setDraggedMediaAsset(null);
    setDragPreview(null); // Clear any existing drag preview
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTimelineItemDragStart = (e: React.DragEvent, item: any) => {
    setDraggedTimelineItem(item);
    setDraggedComponent(null);
    setDraggedMediaAsset(null);
    setDraggedLayer(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMediaItemDragStart = (e: React.DragEvent, item: any, layerId: string) => {
    // Calculate the offset from where the user clicked to the clip's start position
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clipStartX = 0; // The clip starts at the left edge of its container
    const clickOffset = clickX - clipStartX;
    
    setDraggedMediaItem({ ...item, layerId, clickOffset });
    setDraggedComponent(null);
    setDraggedMediaAsset(null);
    setDraggedLayer(null);
    setDragPreview(null); // Clear any existing drag preview
    setDragOutline(null); // Clear any existing drag outline
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: any, layerId: string) => {
    if (e.button !== 0) return; // Only left mouse button
    
    const rect = e.currentTarget.getBoundingClientRect();
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return;
    
    // Calculate the actual position of the item on the timeline
    const itemStartX = (item.start_time / totalDuration) * timelineRect.width;
    const clickX = e.clientX - timelineRect.left;
    const clickOffset = clickX - itemStartX; // Offset from the start of the item
    
    // Store initial mouse position for drag detection
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    let isDrag = false;
    const dragThreshold = 5; // pixels of movement before considering it a drag
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - initialMouseX);
      const deltaY = Math.abs(moveEvent.clientY - initialMouseY);
      
      // Only start dragging if mouse has moved beyond threshold
      if ((deltaX > dragThreshold || deltaY > dragThreshold) && !isDrag) {
        isDrag = true;
        setJustDragged(true);
        setIsDraggingItem({
          itemId: item.id,
          layerId,
          startX: clickOffset, // Store the offset from item start
          startTime: item.start_time
        });
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // If it wasn't a drag, it was just a click - don't do anything here
      // The onClick handler will handle the selection
    };
    
    // Add temporary listeners for this specific mouse down
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDraggingItem || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - timelineRect.left;
    const y = e.clientY - timelineRect.top;
    
    // Calculate new start time based on where the mouse is, minus the click offset
    const newStartTime = Math.max(0, (x - isDraggingItem.startX) / timelineRect.width * totalDuration);
    
    // Calculate target layer using correct layer heights
    const mainLayerHeight = 80; // Height of main component layer
    const mediaLayerHeight = 124; // 44px header + 64px content + 16px mb-4
    let targetLayerIndex = 0;
    
    if (y < mainLayerHeight) {
      // In main component layer
      targetLayerIndex = 0;
    } else {
      // In media layers
      const adjustedY = y - mainLayerHeight;
      targetLayerIndex = Math.floor(adjustedY / mediaLayerHeight);
    }
    
    const targetLayer = timelineLayers[targetLayerIndex];
    
    if (targetLayer && targetLayer.id !== isDraggingItem.layerId) {
      // Moving to a different existing layer - update drag preview
      setDragPreview({
        x: 0,
        y: 0,
        time: newStartTime,
        layer: targetLayerIndex,
        itemId: isDraggingItem.itemId,
        layerId: targetLayer.id,
        startTime: newStartTime,
        duration: 0
      });
    } else if (!targetLayer) {
      // Dragging to a position that would create a new layer (above/below existing layers)
      // Calculate the maximum possible layer index based on current layers
      const maxLayerIndex = timelineLayers.length - 1;
      const isAboveTop = targetLayerIndex < 0;
      const isBelowBottom = targetLayerIndex > maxLayerIndex;
      
      if (isAboveTop || isBelowBottom) {
        // Create a placeholder layer ID for the drag preview
        const placeholderLayerId = `placeholder_${targetLayerIndex}`;
        setDragPreview({
          x: 0,
          y: 0,
          time: newStartTime,
          layer: targetLayerIndex,
          itemId: isDraggingItem.itemId,
          layerId: placeholderLayerId,
          startTime: newStartTime,
          duration: 0,
          isPlaceholder: true
        });
      }
    } else {
      // Moving within the same layer - always call handleItemDrag for proper collision detection
      handleItemDrag(isDraggingItem.itemId, isDraggingItem.layerId, newStartTime);
    }
  };

  const handleGlobalMouseUp = (e: MouseEvent) => {
    if (!isDraggingItem || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - timelineRect.top;
    
    // Calculate target layer using correct layer heights
    const mainLayerHeight = 80; // Height of main component layer
    const mediaLayerHeight = 124; // 44px header + 64px content + 16px mb-4
    let targetLayerIndex = 0;
    
    const tabHeight = 40; // Height of the main video tab
    const aboveZoneStart = tabHeight; // Start after the tab
    const aboveZoneEnd = tabHeight + 20; // 20px zone after tab for creating layer above first layer
    
    if (y >= aboveZoneStart && y < aboveZoneEnd) {
      // Dragging in the "above" zone - create layer above all existing layers
      targetLayerIndex = -1;
    } else if (y < mainLayerHeight) {
      // In main component layer
      targetLayerIndex = 0;
    } else {
      // In media layers
      const adjustedY = y - mainLayerHeight;
      targetLayerIndex = Math.floor(adjustedY / mediaLayerHeight);
    }
    
    // Find the target layer
    const targetLayer = timelineLayers[targetLayerIndex];
    const finalStartTime = dragPreview?.startTime || isDraggingItem.startTime;
    
    if (targetLayer && targetLayer.id !== isDraggingItem.layerId) {
      // Moving to a different existing layer
      moveItemToLayer(isDraggingItem.itemId, isDraggingItem.layerId, targetLayer.id, finalStartTime);
    } else if (!targetLayer && dragPreview?.isPlaceholder) {
      // Creating a new layer at placeholder position
      withHistory(() => {
        const newLayer = {
          id: `layer_${Date.now()}`,
          name: `Layer ${timelineLayers.length + 1}`,
          visible: true,
          items: []
        };
        
        // Insert the new layer at the correct position
        setTimelineLayers(prev => {
          const newLayers = [...prev];
          if (targetLayerIndex === -1) {
            // Insert at the beginning (above all existing layers)
            newLayers.unshift(newLayer);
          } else {
            // Insert at the calculated position
            const insertIndex = Math.max(0, Math.min(targetLayerIndex, newLayers.length));
            newLayers.splice(insertIndex, 0, newLayer);
          }
          return newLayers;
        });
        
        // Move the item to the new layer
        setTimeout(() => {
          moveItemToLayer(isDraggingItem.itemId, isDraggingItem.layerId, newLayer.id, finalStartTime);
        }, 0);
      });
    } else {
      // Moving within the same layer (or no valid target layer)
      handleItemDrop(isDraggingItem.itemId, isDraggingItem.layerId, finalStartTime);
    }
    
    setIsDraggingItem(null);
    
    // Reset the justDragged flag after a short delay to allow click handlers to check it
    setTimeout(() => setJustDragged(false), 100);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
      // Update drag preview
      if (timelineRef.current) {
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - timelineRect.left;
        const y = e.clientY - timelineRect.top;
        const timePerPixel = totalDuration / timelineRect.width;
        const time = Math.max(0, Math.min(totalDuration, x * timePerPixel));
        
        // Calculate layer index based on actual layer structure
        // Main component layer: 80px
        // Each media layer: 44px header + 64px content + 16px mb-4 = 124px total
        const mainLayerHeight = 80;
        const mediaLayerHeight = 124; // 44px header + 64px content + 16px mb-4
        
        let layer;
        const tabHeight = 40; // Height of the main video tab
        const aboveZoneStart = tabHeight; // Start after the tab
        const aboveZoneEnd = tabHeight + 20; // 20px zone after tab for creating layer above first layer
        
        if (y >= aboveZoneStart && y < aboveZoneEnd) {
          // Dragging in the "above" zone - create layer above all existing layers
          layer = -1;
        } else if (y < mainLayerHeight) {
          // In main component layer
          layer = 0;
        } else {
          // In media layers
          const adjustedY = y - mainLayerHeight;
          layer = Math.floor(adjustedY / mediaLayerHeight);
        }
      
      let finalTime = time;
      let snapTarget = null;
      
      if (snapToGrid) {
        // Find snap targets
        const snapTargets = findSnapTargets(time);
        console.log('Snap targets found:', snapTargets, 'for time:', time);
        if (snapTargets.length > 0) {
          // Use the closest snap target
          const closest = snapTargets.reduce((prev, curr) => 
            Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev
          );
          finalTime = closest.time;
          snapTarget = closest.label;
          console.log('Snapping to:', closest.label, 'at time:', closest.time);
      } else {
          // Fall back to grid snapping
          finalTime = Math.round(time * 4) / 4;
          console.log('No snap targets, using grid snap:', finalTime);
        }
    } else {
        // No snapping, use original time
        finalTime = time;
      }
      
      // Check if we're dragging to a position that would create a new layer
      const maxLayerIndex = timelineLayers.length - 1;
      const isAboveTop = layer === -1;
      const isBelowBottom = layer > maxLayerIndex;
      const isPlaceholderPosition = isAboveTop || isBelowBottom;
      
      // For new items, check for collisions with existing items
      if (draggedMediaItem && !isPlaceholderPosition && layer >= 0 && layer < timelineLayers.length) {
        const targetLayer = timelineLayers[layer];
        if (targetLayer) {
          const itemDuration = draggedMediaItem.duration || 5;
          const collision = checkCollision('new-item', targetLayer.id, finalTime, itemDuration);
          if (collision && collision.type === 'snap') {
            finalTime = collision.snapTime || finalTime;
          }
        }
      }
      
      setDragPreview({ 
        x, 
        y, 
        time: finalTime, 
        layer, 
        snapTarget: snapTarget || undefined,
        isPlaceholder: isPlaceholderPosition
      });
      
      // Set drag outline for media items
      if (draggedMediaItem) {
        const itemWidth = (draggedMediaItem.duration / totalDuration) * timelineRect.width;
        
        // Try to find the actual layer content area and position relative to it
        const layerElements = document.querySelectorAll('[data-layer-content]');
        let targetTop = 80 + (layer * 124) + 44; // Fallback calculation
        
        if (layerElements[layer]) {
          const layerRect = layerElements[layer].getBoundingClientRect();
          const timelineRect = timelineRef.current?.getBoundingClientRect();
          if (timelineRect) {
            targetTop = layerRect.top - timelineRect.top;
            console.log('Using actual DOM positioning - Layer rect top:', layerRect.top, 'Timeline rect top:', timelineRect.top, 'Calculated target top:', targetTop);
          }
        } else {
          console.log('Using fallback calculation - Layer:', layer, 'Calculated top:', targetTop);
        }
        
        // Calculate the preview position accounting for the click offset
        const clickOffset = draggedMediaItem.clickOffset || 0;
        const previewTime = Math.max(0, finalTime - (clickOffset / timelineRect.width) * totalDuration);
        
        setDragOutline({ 
          x, 
          y, 
          time: previewTime, 
          layer, 
          width: itemWidth,
          item: draggedMediaItem,
          targetTop,
          isPlaceholder: isPlaceholderPosition
        });
      } else {
        setDragOutline(null);
      }
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        // For videos, we need to get the actual duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          const duration = video.duration;
          const reader = new FileReader();
          reader.onload = (event) => {
            const newAsset = {
              id: `media_${Date.now()}_${Math.random()}`,
              name: file.name,
              type: 'video',
              data: event.target?.result as string,
              duration: duration,
              file: file
            };
            setMediaAssets(prev => [...prev, newAsset]);
          };
          reader.readAsDataURL(file);
        };
        
        video.src = URL.createObjectURL(file);
      } else {
        // For images, use default duration
        const reader = new FileReader();
        reader.onload = (event) => {
          const newAsset = {
            id: `media_${Date.now()}_${Math.random()}`,
            name: file.name,
            type: 'image',
            data: event.target?.result as string,
            duration: 3, // Default duration for images
            file: file
          };
          setMediaAssets(prev => [...prev, newAsset]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset the input
    e.target.value = '';
  };

  // Helper function to find the next available time slot in a layer
  const findNextAvailableTime = (layerItems: any[], preferredStartTime: number, duration: number) => {
    if (layerItems.length === 0) return preferredStartTime;
    
    // Sort items by start time
    const sortedItems = [...layerItems].sort((a, b) => a.start_time - b.start_time);
    
    // Check if preferred time is available
    const isOverlap = sortedItems.some(item => 
      preferredStartTime < item.start_time + item.duration && 
      preferredStartTime + duration > item.start_time
    );
    
    if (!isOverlap) return preferredStartTime;
    
    // Find the next available slot by placing after the last item
    const lastItem = sortedItems[sortedItems.length - 1];
    return lastItem.start_time + lastItem.duration;
  };

  // Handle media item resizing (extension)
  const handleMediaResize = (e: React.MouseEvent, item: any, layerId: string, direction: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return;
    
    const timePerPixel = totalDuration / timelineRect.width;
    const startTime = item.start_time;
    const startDuration = item.duration;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX * timePerPixel;
      
      let newDuration = startDuration;
      let newStartTime = startTime;
      
      if (direction === 'end') {
        // Extending the end
        if (isOptionHeld && isMediaItem(item) && item.asset?.type === 'video') {
          // With Option held, allow extending beyond video length for freeze frame
          newDuration = Math.max(1, startDuration + deltaTime);
        } else if (isMediaItem(item) && item.asset?.type === 'video') {
          // Without Option, limit to original video length
          const maxDuration = item.asset.duration || startDuration;
          newDuration = Math.max(1, Math.min(maxDuration, startDuration + deltaTime));
      } else {
          // For images, allow unlimited extension
        newDuration = Math.max(1, startDuration + deltaTime);
        }
      } else {
        // Resizing the start handle
        // Dragging right moves start time later (reduces duration)
        // Dragging left moves start time earlier (increases duration)
        newStartTime = Math.max(0, startTime + deltaTime);
        newDuration = Math.max(1, startDuration - deltaTime);
      }
      
      // Update the item in the timeline
      setTimelineLayers(prev => prev.map(layer => 
        layer.id === layerId 
          ? {
              ...layer,
              items: layer.items.map(mediaItem => {
                if (mediaItem.id !== item.id) return mediaItem;
                
                // For video items with Option held, add freeze-frame behavior
                if (isOptionHeld && isMediaItem(mediaItem) && mediaItem.asset?.type === 'video') {
                  const updatedItem = { ...mediaItem, start_time: newStartTime, duration: newDuration };
                  
                  if (direction === 'end') {
                    // Extending end with freeze-frame - freeze at the last visible frame
                    // For split videos, freeze at the split point (videoEndTime)
                    // For unsplit videos, freeze at the original video end
                    const freezeFrameTime = (mediaItem as any).videoEndTime || mediaItem.asset.duration;
                    return {
                      ...updatedItem,
                      freezeFrame: true,
                      freezeFrameTime: freezeFrameTime,
                      // Preserve video cropping properties for split clips
                      ...(((mediaItem as any).videoStartTime !== undefined || (mediaItem as any).videoEndTime !== undefined) ? {
                        videoStartTime: (mediaItem as any).videoStartTime,
                        videoEndTime: (mediaItem as any).videoEndTime
                      } : {})
                    };
                  } else {
                    // Extending start with freeze-frame - freeze at the first visible frame
                    // For split videos, freeze at the split point (videoStartTime)
                    // For unsplit videos, freeze at the beginning (0)
                    const freezeFrameTime = (mediaItem as any).videoStartTime || 0;
                    return {
                      ...updatedItem,
                      freezeFrame: true,
                      freezeFrameTime: freezeFrameTime,
                      // Preserve video cropping properties for split clips
                      ...(((mediaItem as any).videoStartTime !== undefined || (mediaItem as any).videoEndTime !== undefined) ? {
                        videoStartTime: (mediaItem as any).videoStartTime,
                        videoEndTime: (mediaItem as any).videoEndTime
                      } : {})
                    };
                  }
                }
                
                // Normal resize behavior - preserve video cropping properties for split clips
                const updatedItem = { ...mediaItem, start_time: newStartTime, duration: newDuration };
                
                // For split video clips, adjust the video cropping to match the new timeline duration
                if (isMediaItem(mediaItem) && mediaItem.asset?.type === 'video' && 
                    ((mediaItem as any).videoStartTime !== undefined || (mediaItem as any).videoEndTime !== undefined)) {
                  
                  const originalVideoStartTime = (mediaItem as any).videoStartTime || 0;
                  const originalVideoEndTime = (mediaItem as any).videoEndTime || mediaItem.asset.duration;
                  const originalDuration = mediaItem.duration;
                  const originalVideoDuration = originalVideoEndTime - originalVideoStartTime;
                  
                  if (direction === 'end') {
                    // Resizing the end - crop the video content to match the new duration
                    // The new video duration should be the new timeline duration, but bounded by available content
                    const maxVideoDuration = originalVideoEndTime - originalVideoStartTime;
                    const newVideoDuration = Math.min(newDuration, maxVideoDuration);
                    const newVideoEndTime = originalVideoStartTime + newVideoDuration;
                    
                    return {
                      ...updatedItem,
                      videoStartTime: originalVideoStartTime,
                      videoEndTime: newVideoEndTime
                    };
                  } else {
                    // Resizing the start - crop the video content to match the new duration
                    // The new video duration should be the new timeline duration, but bounded by available content
                    const maxVideoDuration = originalVideoEndTime - originalVideoStartTime;
                    const newVideoDuration = Math.min(newDuration, maxVideoDuration);
                    const newVideoStartTime = originalVideoEndTime - newVideoDuration;
                    
                    return {
                      ...updatedItem,
                      videoStartTime: newVideoStartTime,
                      videoEndTime: originalVideoEndTime
                    };
                  }
                }
                
                return updatedItem;
              })
            }
          : layer
      ));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Group resize handler
  const handleGroupResize = (e: React.MouseEvent, item: any, layerId: string, direction: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return;
    
    const timePerPixel = totalDuration / timelineRect.width;
    const startTime = item.start_time;
    const startDuration = item.duration;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX * timePerPixel;
      
      let newDuration = startDuration;
      let newStartTime = startTime;
      
      if (direction === 'end') {
        // Extending the end
        newDuration = Math.max(1, startDuration + deltaTime); // Minimum 1 second
      } else {
        // Resizing the start handle
        newStartTime = Math.max(0, startTime + deltaTime);
        newDuration = Math.max(1, startDuration - deltaTime);
      }
      
      // Update the group item in the timeline
      setTimelineLayers(prev => prev.map(layer => 
        layer.id === layerId 
          ? {
              ...layer,
              items: layer.items.map(groupItem => 
                groupItem.id === item.id 
                  ? { ...groupItem, start_time: newStartTime, duration: newDuration }
                  : groupItem
              )
            }
          : layer
      ));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return;
    

    const x = e.clientX - timelineRect.left;
    const y = e.clientY - timelineRect.top;
    const timePerPixel = totalDuration / timelineRect.width;
    let startTime = Math.max(0, Math.min(totalDuration, x * timePerPixel));
    
    // Use the snapped time from drag preview if available
    if (dragPreview) {
      startTime = dragPreview.time;
    } else if (snapToGrid) {
      startTime = Math.round(startTime * 4) / 4;
    }
    
    // Clear drag preview and outline
    setDragPreview(null);
    setDragOutline(null);

    if (draggedComponent) {
      console.log('Dropping component:', draggedComponent);
      
      // Calculate target layer using correct layer heights (same as drag preview)
      const mainLayerHeight = 80; // Height of main component layer
      const mediaLayerHeight = 124; // 44px header + 64px content + 16px mb-4
      let targetLayerIndex = 0;
      
      const tabHeight = 40; // Height of the main video tab
      const aboveZoneStart = tabHeight; // Start after the tab
      const aboveZoneEnd = tabHeight + 20; // 20px zone after tab for creating layer above first layer
      
      if (y >= aboveZoneStart && y < aboveZoneEnd) {
        // Dragging in the "above" zone - create layer above all existing layers
        targetLayerIndex = -1;
      } else if (y < mainLayerHeight) {
        // In main component layer
        targetLayerIndex = 0;
      } else {
        // In media layers
        const adjustedY = y - mainLayerHeight;
        targetLayerIndex = Math.floor(adjustedY / mediaLayerHeight);
      }
      
      // Check for collisions if dropping into an existing layer
      let finalStartTime = startTime;
      if (targetLayerIndex >= 0 && targetLayerIndex < timelineLayers.length) {
        const targetLayer = timelineLayers[targetLayerIndex];
        const itemDuration = totalDuration || 10;
        const collision = checkCollision('new-component', targetLayer.id, startTime, itemDuration);
        if (collision && collision.type === 'snap') {
          finalStartTime = collision.snapTime || startTime;
        }
      }
      
      const newItem: TimelineItem = {
        id: `timeline_${Date.now()}`,
        component_id: draggedComponent.id,
          component: draggedComponent,
        start_time: finalStartTime,
          duration: totalDuration || 10, // Use total video duration instead of component duration
        order: 0 // Will be set by the layer system
        };

        // Set default properties for the component based on schema
        const defaultProperties = getDefaultProperties(draggedComponent.type);
        console.log('Default properties for', draggedComponent.type, ':', defaultProperties);
        
        setComponentProperties(prev => ({
          ...prev,
          [draggedComponent.id]: defaultProperties
        }));

      // Add to timelineLayers instead of timeline
      setTimelineLayers(prev => {
        const newLayers = [...prev];
        
        // Check if we need to create a new layer or add to existing
        const maxLayerIndex = newLayers.length - 1;
        const isAboveTop = targetLayerIndex < 0;
        const isBelowBottom = targetLayerIndex > maxLayerIndex;
        
        if (isAboveTop || isBelowBottom) {
          // Create new layer at the correct position
          const newLayerId = `layer_${Date.now()}`;
          const newLayer = {
            id: newLayerId,
            name: `Layer ${newLayers.length + 1}`,
            visible: true,
            items: [newItem]
          };
          
          if (isAboveTop) {
            // Insert at the beginning (index 0)
            newLayers.unshift(newLayer);
          } else {
            // Insert at the end
            newLayers.push(newLayer);
          }
        } else if (targetLayerIndex >= 0 && targetLayerIndex < newLayers.length) {
          // Add to existing layer
          const targetLayer = newLayers[targetLayerIndex];
          newLayers[targetLayerIndex] = {
            ...targetLayer,
            items: [...targetLayer.items, newItem]
          };
        }
        
        return newLayers;
      });
        
        // Auto-select the new component and show properties
        setSelectedTimelineItem(newItem);
        setShowComponentLibrary(false);
        setShowMediaLibrary(false);
      
      setDraggedComponent(null);
    } else if (draggedMediaAsset) {
      // Check if dropping on an existing layer or creating a new one
      const mainLayerHeight = 80; // Height of main component layer
      const mediaLayerHeight = 124; // 44px header + 64px content + 16px mb-4
      
      const tabHeight = 40; // Height of the main video tab
      const aboveZoneStart = tabHeight; // Start after the tab
      const aboveZoneEnd = tabHeight + 20; // 20px zone after tab for creating layer above first layer
      
      let layerIndex;
      if (y >= aboveZoneStart && y < aboveZoneEnd) {
        // Dragging in the "above" zone - create layer above all existing layers
        layerIndex = -1;
      } else if (y < mainLayerHeight) {
        // In main component layer
        layerIndex = 0;
      } else {
        // In media layers
        const adjustedY = y - mainLayerHeight;
        layerIndex = Math.floor(adjustedY / mediaLayerHeight);
      }
      
      if (layerIndex >= 0 && layerIndex < timelineLayers.length) {
        // Add to existing layer
        const targetLayer = timelineLayers[layerIndex];
        const duration = draggedMediaAsset.duration || 5;
        
        // Find next available time slot to prevent overlaps
        const adjustedStartTime = findNextAvailableTime(targetLayer.items, startTime, duration);
        
        const newMediaItem = {
          id: `media_${Date.now()}`,
          asset: draggedMediaAsset,
          start_time: adjustedStartTime,
          duration: duration,
          layerId: targetLayer.id,
          type: 'media' as const
        };
        
        setTimelineLayers(prev => prev.map(layer => 
          layer.id === targetLayer.id 
            ? { ...layer, items: [...layer.items, newMediaItem] }
            : layer
        ));
        
        // Set default properties for the media item
        setMediaProperties(prev => ({
          ...prev,
          [newMediaItem.id]: {
            scale: 1,
            x: 0,
            y: 0,
            opacity: 1,
            rotation: 0
          }
        }));
      } else {
        // Create a new layer
        const newMediaItem = {
          id: `media_${Date.now()}`,
          asset: draggedMediaAsset,
          start_time: startTime,
          duration: draggedMediaAsset.duration || 5, // Use asset duration or default to 5s
          layerId: `layer_${Date.now()}`,
          type: 'media' as const
        };
        
        const newLayer = {
          id: newMediaItem.layerId,
          name: `Layer ${timelineLayers.length + 1}`,
          visible: true,
          items: [newMediaItem]
        };
        
        if (layerIndex === -1) {
          // Insert at the beginning (above all existing layers)
          setTimelineLayers(prev => [newLayer, ...prev]);
        } else {
          // Insert at the end (below all existing layers)
        setTimelineLayers(prev => [...prev, newLayer]);
        }
        
        // Set default properties for the media item
        setMediaProperties(prev => ({
          ...prev,
          [newMediaItem.id]: {
            scale: 1,
            x: 0,
            y: 0,
            opacity: 1,
            rotation: 0
          }
        }));
      }
      
      setDraggedMediaAsset(null);
        } else if (draggedLayer) {
          // Handle layer reordering
          const mainLayerHeight = 80; // Height of main component layer
          const mediaLayerHeight = 124; // 44px header + 64px content + 16px mb-4
          const adjustedY = y - mainLayerHeight;
          const newIndex = Math.max(0, Math.floor(adjustedY / mediaLayerHeight));
      
      if (newIndex >= 0 && newIndex <= timelineLayers.length) {
        const currentIndex = timelineLayers.findIndex(layer => layer.id === draggedLayer.id);
        
        if (currentIndex !== -1 && newIndex !== currentIndex) {
          const newLayers = [...timelineLayers];
          const [movedLayer] = newLayers.splice(currentIndex, 1);
          newLayers.splice(newIndex, 0, movedLayer);
          
          setTimelineLayers(newLayers);
        }
      }
      
      setDraggedLayer(null);
    } else if (draggedTimelineItem) {
      // Handle timeline item repositioning
      const timelineRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - timelineRect.left;
      const timelineWidth = timelineRect.width;
      const newStartTime = (x / timelineWidth) * totalDuration;
      
      // Ensure the item doesn't go negative or extend beyond total duration
      const clampedStartTime = Math.max(0, Math.min(newStartTime, totalDuration - draggedTimelineItem.duration));
      
      setTimeline(prev => prev.map(item => 
        item.id === draggedTimelineItem.id 
          ? { ...item, start_time: clampedStartTime }
          : item
      ));
      
      setDraggedTimelineItem(null);
    } else if (draggedMediaItem) {
      // Handle media item repositioning or moving between layers
      const timelineRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - timelineRect.left;
      const y = e.clientY - timelineRect.top;
      const timelineWidth = timelineRect.width;
      const layerHeight = 80;
      const newStartTime = (x / timelineWidth) * totalDuration;
      
      // Calculate target layer index - account for the main component layer (first layer)
      // Main component layer: 80px
      // Each media layer: 44px header + 64px content + 16px mb-4 = 124px total
      const mainLayerHeight = 80; // Height of main component layer
      const mediaLayerHeight = 124; // 44px header + 64px content + 16px mb-4
      const adjustedY = y - mainLayerHeight;
      const targetLayerIndex = Math.max(0, Math.floor(adjustedY / mediaLayerHeight));
      
        console.log('Media drag drop - Y:', y, 'AdjustedY:', adjustedY, 'TargetLayerIndex:', targetLayerIndex, 'TimelineLayers.length:', timelineLayers.length);
        console.log('Layer calculation: mainLayerHeight:', mainLayerHeight, 'mediaLayerHeight:', mediaLayerHeight);
        console.log('Available layers:', timelineLayers.map((l, i) => ({ index: i, id: l.id, name: l.name })));
      
      // Use the snapped time from drag preview if available
      let finalStartTime = newStartTime;
      if (dragPreview) {
        // When snapping, use the exact snap position without click offset
        finalStartTime = dragPreview.time;
      } else {
        // Ensure the item doesn't go negative or extend beyond total duration
        const clampedStartTime = Math.max(0, Math.min(newStartTime, totalDuration - draggedMediaItem.duration));
        
        // Apply snap to grid if enabled
        finalStartTime = snapToGrid ? Math.round(clampedStartTime * 4) / 4 : clampedStartTime;
      
        // Account for click offset to maintain the clip's start position (only when not snapping)
      const clickOffset = draggedMediaItem.clickOffset || 0;
      const offsetTime = (clickOffset / timelineWidth) * totalDuration;
      finalStartTime = Math.max(0, finalStartTime - offsetTime);
      }
      
      setTimelineLayers(prev => {
        const newLayers = [...prev];
        
        // Find source layer
        const sourceLayerIndex = newLayers.findIndex(layer => layer.id === draggedMediaItem.layerId);
        
        if (sourceLayerIndex !== -1) {
          console.log('Source layer found at index:', sourceLayerIndex, 'Layer ID:', draggedMediaItem.layerId);
          console.log('Target layer index:', targetLayerIndex, 'Available layers:', newLayers.length);
          
          // Check if moving within the same layer
          if (targetLayerIndex >= 0 && targetLayerIndex < newLayers.length && 
              newLayers[targetLayerIndex].id === draggedMediaItem.layerId) {
            console.log('Same layer move - updating position');
            // Same layer - just update the position
            newLayers[sourceLayerIndex] = {
              ...newLayers[sourceLayerIndex],
              items: newLayers[sourceLayerIndex].items.map(item => 
                item.id === draggedMediaItem.id
                  ? { ...item, start_time: finalStartTime }
                  : item
              )
            };
          } else {
            console.log('Different layer move - removing from source and adding to target');
            // Different layer - remove from source and add to target
            newLayers[sourceLayerIndex] = {
              ...newLayers[sourceLayerIndex],
              items: newLayers[sourceLayerIndex].items.filter(item => item.id !== draggedMediaItem.id)
            };
            
            // Add to target layer (or create new layer if needed)
            if (targetLayerIndex >= 0 && targetLayerIndex < newLayers.length) {
              console.log('Adding to existing layer at index:', targetLayerIndex);
              const targetLayer = newLayers[targetLayerIndex];
              newLayers[targetLayerIndex] = {
                ...targetLayer,
                items: [
                  ...targetLayer.items,
                  { ...draggedMediaItem, start_time: finalStartTime, layerId: targetLayer.id }
                ]
              };
            } else {
              console.log('Creating new layer - targetLayerIndex:', targetLayerIndex, 'newLayers.length:', newLayers.length);
              // If dropping outside existing layers, create a new layer
              const newLayerId = `layer_${Date.now()}`;
              newLayers.push({
                id: newLayerId,
                name: `Layer ${newLayers.length + 1}`,
                visible: true,
                items: [{ ...draggedMediaItem, start_time: finalStartTime, layerId: newLayerId }]
              });
            }
          }
        }
        
        return newLayers;
      });
      
      setDraggedMediaItem(null);
    }
  };

  const removeFromTimeline = (itemId: string) => {
    const newTimeline = timeline.filter(item => item.id !== itemId);
    setTimeline(newTimeline);
    calculateTotalDuration(newTimeline);
    if (selectedTimelineItem?.id === itemId) {
      setSelectedTimelineItem(null);
    }
  };

  const updateTimelineItem = (itemId: string, updates: Partial<TimelineItem>) => {
    const newTimeline = timeline.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ).sort((a, b) => a.start_time - b.start_time);
    setTimeline(newTimeline);
    calculateTotalDuration(newTimeline);
    
    // Update selected item if it's the one being modified
    if (selectedTimelineItem?.id === itemId) {
      setSelectedTimelineItem({ ...selectedTimelineItem, ...updates });
    }
  };

  const saveProject = async () => {
    if (!project) return;

    setLoading(true);
    try {
      // Include component properties in the timeline items from both old timeline and new timelineLayers
      const timelineWithProperties = timeline.map(item => ({
        ...item,
            properties: item.component?.id ? componentProperties[item.component.id] || {} : {}
      }));

      // Also include component properties from timelineLayers
      const timelineLayersWithProperties = timelineLayers.map(layer => ({
        ...layer,
        items: layer.items.map(item => ({
          ...item,
          properties: isComponentItem(item) && item.component?.id 
            ? componentProperties[item.component.id] || {} 
            : {}
        }))
      }));

      const projectData = {
        name: project.name,
        description: project.description,
        timeline: timelineWithProperties,
        settings: {
          mediaAssets,
          timelineLayers: timelineLayersWithProperties,
          timelineTabs, // Save timeline tabs for group persistence
          timelineZoom,
          mediaProperties,
          componentProperties // Also save componentProperties separately for easier access
        },
        status: 'in_progress'
      };
      
      console.log('Saving project with data:', projectData);
      await apiEndpoints.updateProject(project.id, projectData);
      
      // Refresh project data
      await loadProject();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateTimeMarkers = () => {
    const markers = [];
    // Adjust interval based on zoom level - more granular when zoomed in
    let interval = totalDuration > 60 ? 10 : 5;
    if (timelineZoom >= 2) {
      interval = 1; // 1 second intervals when zoomed in
    } else if (timelineZoom >= 1.5) {
      interval = 2; // 2 second intervals
    } else if (timelineZoom <= 0.5) {
      interval = totalDuration > 60 ? 30 : 15; // Larger intervals when zoomed out
    }
    
    for (let i = 0; i <= totalDuration; i += interval) {
      const isMinute = i % 60 === 0 && i > 0;
      markers.push({
        time: i,
        position: (i / totalDuration) * 100,
        isMinute,
        label: isMinute ? `${Math.floor(i / 60)}m` : `${i}s`
      });
    }
    
    return markers;
  };

  // Find snap targets for smart snapping
  const findSnapTargets = (time: number) => {
    const snapThreshold = 0.1; // 0.1 second threshold
    const targets = [];
    
    // Add 0s mark
    if (Math.abs(time - 0) < snapThreshold) {
      targets.push({ time: 0, type: 'start', label: '0s' });
    }
    
    // Add current scrubber position
    if (Math.abs(time - currentTime) < snapThreshold) {
      targets.push({ time: currentTime, type: 'scrubber', label: 'Current' });
    }
    
    // Add timeline item boundaries
    timeline.forEach(item => {
      if (Math.abs(time - item.start_time) < snapThreshold) {
        targets.push({ time: item.start_time, type: 'start', label: `${item.component.name} start` });
      }
      if (Math.abs(time - (item.start_time + item.duration)) < snapThreshold) {
        targets.push({ time: item.start_time + item.duration, type: 'end', label: `${item.component.name} end` });
      }
    });
    
    // Add media item boundaries
    timelineLayers.forEach(layer => {
      layer.items.forEach((item: any) => {
        if (Math.abs(time - item.start_time) < snapThreshold) {
          targets.push({ time: item.start_time, type: 'start', label: `${isMediaItem(item) ? item.asset.name : isComponentItem(item) ? item.component.name : 'Item'} start` });
        }
        if (Math.abs(time - (item.start_time + item.duration)) < snapThreshold) {
          targets.push({ time: item.start_time + item.duration, type: 'end', label: `${isMediaItem(item) ? item.asset.name : isComponentItem(item) ? item.component.name : 'Item'} end` });
        }
      });
    });
    
    return targets;
  };

  // Function to create and configure a Lottie instance for video rendering
  const createVideoLottieInstance = (lottieData: any, properties: any) => {
    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Helper function to update background color
    const updateCustomerBgColor = (layers: any[], backgroundColor: string) => {
      layers.forEach(layer => {
        if (layer.nm === 'CustomerBg') {
          if (backgroundColor === 'transparent') {
            layer.ks.o.k = 0;
          } else {
            layer.ks.o.k = 100;
            if (layer.shapes) {
              layer.shapes.forEach((shape: any) => {
                if (shape.ty === 'gr' && shape.it) {
                  shape.it.forEach((item: any) => {
                    if (item.ty === 'fl' && item.c) {
                      const rgb = hexToRgb(backgroundColor);
                      if (rgb) {
                        item.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
                      }
                    }
                  });
                } else if (shape.ty === 'fl' && shape.c) {
                  const rgb = hexToRgb(backgroundColor);
                  if (rgb) {
                    shape.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
                  }
                }
              });
            }
          }
        }
        if (layer.layers) {
          updateCustomerBgColor(layer.layers, backgroundColor);
        }
      });
    };

    // Apply properties to the Lottie data
    const updatedData = JSON.parse(JSON.stringify(lottieData));
    
    // Update background color
    if (properties.backgroundColor) {
      updateCustomerBgColor(updatedData.layers, properties.backgroundColor);
    }

    // Update logo if provided
    if (properties.customerLogo && properties.customerLogo.data) {
      const logoAsset = updatedData.assets.find((asset: any) => asset.id === '1');
      if (logoAsset) {
        logoAsset.p = properties.customerLogo.data;
      }
    }

    // Create a hidden container for the Lottie instance
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1920px';
    container.style.height = '1080px';
    container.style.visibility = 'visible'; // Make visible for initialization
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    // Create Lottie instance
    console.log('Creating Lottie instance for video rendering with data:', {
      width: updatedData.w,
      height: updatedData.h,
      frames: updatedData.op - updatedData.ip,
      containerSize: `${container.offsetWidth}x${container.offsetHeight}`
    });
    
    const lottieInstance = lottie.loadAnimation({
      container: container,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData: updatedData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: true
      }
    });

    // Force render the first frame to ensure canvas is populated
    lottieInstance.addEventListener('DOMLoaded', () => {
      console.log('Lottie DOM loaded, forcing first frame render');
      lottieInstance.goToAndStop(0, true);
      
      // Check if canvas has content after forcing render
      setTimeout(() => {
        console.log('Checking Lottie renderer after DOMLoaded:', {
          hasRenderer: !!lottieInstance.renderer,
          rendererType: lottieInstance.renderer?.type,
          hasCanvas: !!lottieInstance.renderer?.canvas,
          canvasSize: lottieInstance.renderer?.canvas ? `${lottieInstance.renderer.canvas.width}x${lottieInstance.renderer.canvas.height}` : 'N/A',
          rendererKeys: lottieInstance.renderer ? Object.keys(lottieInstance.renderer) : 'N/A'
        });
        
        const canvas = lottieInstance.renderer?.canvas;
        if (canvas) {
          const testCtx = canvas.getContext('2d');
          const imageData = testCtx.getImageData(0, 0, Math.min(10, canvas.width), Math.min(10, canvas.height));
          const hasContent = imageData.data.some((pixel: number) => pixel !== 0);
          console.log('Canvas content check after forced render:', hasContent);
        } else {
          console.warn('Canvas not available after DOMLoaded event');
        }
      }, 100);
    });

    // Add more debugging events
    lottieInstance.addEventListener('error', (error) => {
      console.error('Lottie instance error:', error);
    });

    lottieInstance.addEventListener('complete', () => {
      console.log('Lottie animation complete');
    });

    lottieInstance.addEventListener('loopComplete', () => {
      console.log('Lottie loop complete');
    });

    // Add debugging
    lottieInstance.addEventListener('DOMLoaded', () => {
      // Use setTimeout to ensure renderer is fully initialized
      setTimeout(() => {
        if (lottieInstance.renderer && lottieInstance.renderer.canvas) {
          console.log('Lottie instance loaded for video rendering, canvas size:', lottieInstance.renderer.canvas.width, 'x', lottieInstance.renderer.canvas.height);
        } else {
          console.log('Lottie instance loaded for video rendering, but renderer not ready yet');
        }
      }, 50);
    });

    lottieInstance.addEventListener('data_ready', () => {
      console.log('Lottie data ready for video rendering');
    });

    // Debug renderer immediately after creation
    setTimeout(() => {
      console.log('Immediate renderer check after Lottie creation:', {
        hasInstance: !!lottieInstance,
        hasRenderer: !!lottieInstance.renderer,
        rendererType: lottieInstance.renderer?.type,
        hasCanvas: !!lottieInstance.renderer?.canvas,
        canvasSize: lottieInstance.renderer?.canvas ? `${lottieInstance.renderer.canvas.width}x${lottieInstance.renderer.canvas.height}` : 'N/A',
        rendererKeys: lottieInstance.renderer ? Object.keys(lottieInstance.renderer) : 'N/A'
      });
    }, 50);

    return { lottieInstance, container };
  };

  const downloadVideo = async () => {
    if (timeline.length === 0) {
      alert('No components in timeline to render');
      return;
    }

    setIsRendering(true);
    try {
      console.log('Starting video rendering...');
      
      // Create a high-resolution canvas for rendering
      // Canvas maintains 16:9 aspect ratio (1920x1080) to match preview
      // This ensures video exports match the preview aspect ratio and cropping behavior
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Set up MediaRecorder for video capture
      const stream = canvas.captureStream(60); // 60fps for smoother video
      
      // Determine MIME type based on user selection and browser support
      let mimeType = 'video/webm;codecs=vp8';
      let fileExtension = 'webm';
      
      if (videoFormat === 'mp4') {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          mimeType = 'video/mp4;codecs=h264';
          fileExtension = 'mp4';
          console.log('Using MP4 H.264 format');
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
          fileExtension = 'mp4';
          console.log('Using MP4 format (no codec specified)');
        } else {
          console.log('MP4 not supported, falling back to WebM');
          mimeType = 'video/webm;codecs=vp8';
          fileExtension = 'webm';
        }
      } else if (videoFormat === 'mov') {
        // MOV is not directly supported by MediaRecorder, so we'll use MP4 and rename
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          mimeType = 'video/mp4;codecs=h264';
          fileExtension = 'mov';
          console.log('Using MP4 H.264 format for MOV export');
        } else {
          console.log('MP4 not supported for MOV, falling back to WebM');
          mimeType = 'video/webm;codecs=vp8';
          fileExtension = 'webm';
        }
      } else { // webm
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
          fileExtension = 'webm';
          console.log('Using WebM VP9 format');
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
          fileExtension = 'webm';
          console.log('Using WebM VP8 format');
        } else {
          console.log('WebM not supported, using fallback');
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name || 'video'}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRendering(false);
        console.log(`Video rendering complete! Format: ${mimeType}, Extension: ${fileExtension}`);
      };

      // Start recording
      mediaRecorder.start();
      console.log('MediaRecorder started');

      // Pre-load all images for synchronous rendering
      const imagePromises: Promise<HTMLImageElement>[] = [];
      const loadedImages: { [key: string]: HTMLImageElement } = {};
      
      timeline.forEach(item => {
        const properties = componentProperties[item.component.id] || {};
        if (properties.customerLogo && properties.customerLogo.data) {
          const img = new Image();
          const promise = new Promise<HTMLImageElement>((resolve) => {
            img.onload = () => resolve(img);
            img.src = properties.customerLogo.data;
          });
          imagePromises.push(promise);
          loadedImages[item.component.id] = img;
        }
      });

      // Wait for all images to load before starting video rendering
      Promise.all(imagePromises).then(() => {
        // Using CSS-only approach - no Lottie data needed
        console.log('Starting video rendering with CSS-based approach');

        // Start CSS-based frame-by-frame rendering
            console.log('Starting frame-by-frame rendering...');
        const fps = 60;
        const frameDuration = 1000 / fps;
            let currentFrame = 0;
            const totalFrames = Math.ceil(totalDuration * fps);

          const renderFrame = () => {
            if (currentFrame >= totalFrames) {
              mediaRecorder.stop();
              return;
            }

            const currentTime = (currentFrame / fps);
            const currentItem = timeline.find(item => 
              currentTime >= item.start_time && currentTime < item.start_time + item.duration
            );

            // Clear canvas
            if (hasAlphaChannel) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (currentItem) {
              const component = currentItem.component;
              const properties = componentProperties[component.id] || {};
              
              if (!hasAlphaChannel) {
                ctx.fillStyle = properties.backgroundColor || '#fca5a5';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              
              if (component.type === 'customer_logo_split') {
                const progress = Math.min(1, (currentTime - currentItem.start_time) / currentItem.duration);
              const totalFrames = 300;
                const frame = Math.floor(progress * totalFrames);
                renderLogoSplitFrame(ctx, frame, totalFrames, componentProperties[component.id] || {}, loadedImages, component);
              } else {
                ctx.fillStyle = '#ffffff';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(component.name, canvas.width / 2, canvas.height / 2);
              }
            }

            currentFrame++;
            setTimeout(() => {
              requestAnimationFrame(renderFrame);
          }, Math.max(0, frameDuration - 16));
          };

          renderFrame();
      });

    } catch (error) {
      console.error('Error rendering video:', error);
      setIsRendering(false);
      alert('Error rendering video. Please try again.');
    }
  };

  const getCurrentComponent = () => {
    // Find the component that should be playing at current time
    const currentItem = timeline.find(item => 
      currentTime >= item.start_time && currentTime < item.start_time + item.duration
    );
    return currentItem?.component || null;
  };

  const getCurrentTimelineItem = () => {
    // Find the timeline item that should be playing at current time
    const currentItem = timeline.find(item => 
      currentTime >= item.start_time && currentTime < item.start_time + item.duration
    );
    
    // Debug logging
    console.log('getCurrentTimelineItem - currentTime:', currentTime);
    console.log('Timeline items:', timeline.map(item => ({
      id: item.id,
      type: item.component?.type,
      start_time: item.start_time,
      duration: item.duration,
      isActive: currentTime >= item.start_time && currentTime < item.start_time + item.duration
    })));
    console.log('Current item found:', currentItem);
    
    return currentItem || null;
  };

  // CSS-based logo split animation rendering
  const renderLogoSplitFrame = (ctx: CanvasRenderingContext2D, frame: number, totalFrames: number, properties: any, loadedImages: { [key: string]: HTMLImageElement }, component: any) => {
    const progress = frame / totalFrames;
    const backgroundColor = properties.backgroundColor || '#fca5a5';
    const salesforceColor = 'rgb(0, 162, 225)'; // Salesforce blue
    
    // Debug logging
    if (frame % 30 === 0) { // Log every 0.5 seconds
      console.log(`Frame ${frame}/${totalFrames}, Progress: ${progress.toFixed(3)}`);
    }
    
    // Calculate animation phases - matching CSS component timing exactly
    const customerBgPhase = Math.min(1, progress * 3.57); // Customer background completes in first 0.7s (14% of timeline) - much slower growth
    const customerLogoPhase = Math.min(1, progress * 7.14); // Customer logo - faster growth, original speed
    const salesforceBgPhase = Math.min(1, Math.max(0, (progress - 0.01) * 10)); // Salesforce background starts at 0.05s - leads the logo, starts much earlier
    const salesforceLogoPhase = Math.min(1, Math.max(0, (progress - 0.06) * 8.33)); // Salesforce logo starts at 0.3s - follows the background, moved back by 0.05s
    const holdPhase = Math.min(1, Math.max(0, (progress - 0.16) * 2.5)); // Hold from 0.16s to 0.56s
    const outPhase = Math.min(1, Math.max(0, (progress - 0.56) * 3.125)); // Out phase from 0.56s - 25% faster
    const customerOutPhase = Math.min(1, Math.max(0, (progress - 0.53) * 3.125)); // Customer logo exit starts at 0.53s - 25% faster
    const customerBgOutPhase = Math.min(1, Math.max(0, (progress - 0.56) * 3.125)); // Customer background exit starts at 0.56s - 25% faster
    
    // Draw customer background circle - grows slower, similar speed to white circle
    if (customerBgPhase > 0) {
      const easedScale = 1 - Math.pow(1 - customerBgPhase, 2); // Ease-out quadratic
      const customerX = ctx.canvas.width * 0.25; // 25% from left
      const customerY = ctx.canvas.height * 0.5;
      const customerRadius = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.4 * easedScale;
      
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      ctx.arc(customerX, customerY, customerRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw Salesforce background circle - quick fly-in with easing, smaller from start
    if (salesforceBgPhase > 0) {
      const easedPhase = 1 - Math.pow(1 - salesforceBgPhase, 3); // Ease-out cubic
      const salesforceX = ctx.canvas.width * 0.75; // 75% from left
      const salesforceY = ctx.canvas.height * 0.5;
      const salesforceRadius = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.4 * 0.5; // 1/2 smaller from start
      
      ctx.fillStyle = salesforceColor;
      ctx.beginPath();
      ctx.arc(salesforceX, salesforceY, salesforceRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw customer logo circle - grows with easing, similar speed to background
    if (customerLogoPhase > 0) {
      const easedScale = 1 - Math.pow(1 - customerLogoPhase, 2); // Ease-out quadratic
      const logoX = ctx.canvas.width * 0.25;
      const logoY = ctx.canvas.height * 0.5;
      // Use width-based radius for proper horizontal spacing, height will match (smaller circles)
      const logoRadius = ctx.canvas.width * 0.078125 * easedScale; // 15vw equivalent
      
      // White circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Customer logo image
      if (properties.customerLogo && properties.customerLogo.data) {
        // Use preloaded image if available
        const img = loadedImages[component.id];
        if (img && img.complete && img.naturalWidth > 0) {
          // Draw the customer logo image scaled to fit the circle
          const logoScale = properties.logoScale || 1;
          const scaledRadius = logoRadius * 0.6 * logoScale; // 60% of circle radius, scaled by user setting
          ctx.save();
          ctx.beginPath();
          ctx.arc(logoX, logoY, logoRadius, 0, 2 * Math.PI);
          ctx.clip(); // Clip to circle
          ctx.drawImage(img, logoX - scaledRadius, logoY - scaledRadius, scaledRadius * 2, scaledRadius * 2);
          ctx.restore();
        } else {
          // Fallback text if image not ready
          ctx.fillStyle = '#333';
          ctx.font = 'bold 48px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Customer', logoX, logoY - 20);
          ctx.fillText('Logo', logoX, logoY + 20);
        }
      } else {
        // Fallback text if no image
        ctx.fillStyle = '#333';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Customer', logoX, logoY - 20);
        ctx.fillText('Logo', logoX, logoY + 20);
      }
    }
    
    // Draw Salesforce logo circle - follows background, starts full size, lands at 75%
    if (salesforceLogoPhase > 0) {
      const easedPhase = 1 - Math.pow(1 - salesforceLogoPhase, 3); // Ease-out cubic
      const logoX = ctx.canvas.width * 0.75; // 75% from left
      const logoY = ctx.canvas.height * 0.5;
      // Use width-based radius for proper horizontal spacing, height will match (smaller circles)
      const logoRadius = ctx.canvas.width * 0.078125; // Always full size
      
      // White circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Logo text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Salesforce', logoX, logoY - 20);
      ctx.fillText('Logo', logoX, logoY + 20);
    }
    
    // Handle customer logo exit phase (starts at 0.53s)
    if (customerOutPhase > 0) {
      const customerSlideOffset = customerOutPhase * ctx.canvas.width * 2; // Customer logo speed
      
      // Redraw customer logo only
      ctx.save();
      ctx.translate(-customerSlideOffset, 0);
      
      const customerX = ctx.canvas.width * 0.25;
      const customerY = ctx.canvas.height * 0.5;
      const logoRadius = ctx.canvas.width * 0.078125;
      
      // White circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(customerX, customerY, logoRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Customer logo image
      if (properties.customerLogo && properties.customerLogo.data) {
        const img = loadedImages[component.id];
        if (img && img.complete && img.naturalWidth > 0) {
          const logoScale = properties.logoScale || 1;
          const scaledRadius = logoRadius * 0.6 * logoScale;
          ctx.save();
          ctx.beginPath();
          ctx.arc(customerX, customerY, logoRadius, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(img, customerX - scaledRadius, customerY - scaledRadius, scaledRadius * 2, scaledRadius * 2);
          ctx.restore();
        } else {
          ctx.fillStyle = '#333';
          ctx.font = 'bold 48px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Customer', customerX, customerY - 20);
          ctx.fillText('Logo', customerX, customerY + 20);
        }
      } else {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Customer', customerX, customerY - 20);
        ctx.fillText('Logo', customerX, customerY + 20);
      }
      
      ctx.restore();
    }

    // Handle customer background slide out (starts same time as blue circle)
    if (customerBgOutPhase > 0) {
      const customerX = ctx.canvas.width * 0.25;
      const customerY = ctx.canvas.height * 0.5;
      const customerRadius = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.4;
      
      // Slide the green circle out to the left
      const customerBgSlideOffset = customerBgOutPhase * ctx.canvas.width * 2; // Same speed as blue circle
      
      ctx.save();
      ctx.translate(-customerBgSlideOffset, 0);
      
      // Draw circle (not rectangle)
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      ctx.arc(customerX, customerY, customerRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
    }

    // Handle out phase (slide out) - faster exit speeds
    if (outPhase > 0) {
      // Apply different slide out speeds for different elements
      const salesforceBgSlideOffset = outPhase * ctx.canvas.width * 2; // Blue bg 2x faster
      const salesforceLogoSlideOffset = outPhase * ctx.canvas.width * 6; // Salesforce logo 2x faster
      
      // Redraw Salesforce side with different slide speed
      ctx.save();
      ctx.translate(-salesforceBgSlideOffset, 0);
      
      const salesforceX = ctx.canvas.width * 0.75;
      const salesforceY = ctx.canvas.height * 0.5;
      const salesforceRadius = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.4 * 0.5; // 1/2 smaller
      
      ctx.fillStyle = salesforceColor;
      ctx.beginPath();
      ctx.arc(salesforceX, salesforceY, salesforceRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
      
      // Redraw Salesforce logo with barely trailing speed
      ctx.save();
      ctx.translate(-salesforceLogoSlideOffset, 0);
      
      const logoRadius = ctx.canvas.width * 0.078125;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(salesforceX, salesforceY, logoRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
    }
  };

  const handlePlayPause = () => {
    if (totalDuration === 0) {
      // No duration set, can't play
      return;
    }

    if (isPlaying) {
      // Pause
      if (playbackInterval) {
        clearInterval(playbackInterval);
        setPlaybackInterval(null);
      }
      setIsPlaying(false);
    } else {
      // If this is the first time playing, start from the beginning
      if (!hasPlayedBefore) {
        setCurrentTime(0);
        setHasPlayedBefore(true);
      }
      // If we're at the end, reset to beginning
      else if (currentTime >= totalDuration) {
        setCurrentTime(0);
      }
      
      // Play from current position
      setIsPlaying(true);
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.033; // Update every 33ms (~30fps)
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            clearInterval(interval);
            setPlaybackInterval(null);
            return totalDuration;
          }
          return newTime;
        });
      }, 33);
      setPlaybackInterval(interval);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDownloadModal(true)}
            disabled={isRendering || timeline.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {isRendering ? 'Rendering...' : 'Download Video'}
          </button>
          <button
            onClick={saveProject}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-100">
            <div 
              className="w-full h-full max-w-6xl relative" 
              style={{ aspectRatio: '16/9' }}
            >
              {/* Render media layers first (background) */}
              {timelineLayers.map((layer, layerIndex) => {
                // Check if this layer is hidden by a group
                const groupLayer = timelineLayers.find(l => l.id === 'group-layer');
                const isHiddenByGroup = groupLayer?.items.some(groupItem => {
                  if (!(groupItem as any).isGroup) return false;
                  const groupItems = (groupItem as any).items || [];
                  return layer.items.some(item => groupItems.includes(item.id)) && !groupLayer.visible;
                });
                
                if (!layer.visible || isHiddenByGroup) return null;
                
                return layer.items.map((mediaItem) => {
                  // Skip group items in preview - they don't render content
                  if ((mediaItem as any).isGroup) return null;
                  
                  // Check if this item is within a group's display boundaries
                  const groupLayer = timelineLayers.find(l => l.id === 'group-layer');
                  const containingGroup = groupLayer?.items.find(groupItem => {
                    if (!(groupItem as any).isGroup) return false;
                    const groupItems = (groupItem as any).items || [];
                    return groupItems.includes(mediaItem.id);
                  });
                  
                  // If item is in a group, check if current time is within group's display boundaries
                  if (containingGroup) {
                    const groupStart = containingGroup.start_time;
                    const groupEnd = containingGroup.start_time + containingGroup.duration;
                    if (currentTime < groupStart || currentTime >= groupEnd) {
                      return null; // Don't show content outside group boundaries
                    }
                  }
                  
                  const isActive = currentTime >= mediaItem.start_time && currentTime < mediaItem.start_time + mediaItem.duration;
                  if (!isActive) return null;
                  
                  const mediaProps = mediaProperties[mediaItem.id] || {
                    scale: 1,
                    x: 0,
                    y: 0,
                    opacity: 1,
                    rotation: 0
                  };
                  
                  return (
                    <div
                      key={mediaItem.id}
                      className="absolute inset-0 w-full h-full overflow-hidden"
                      style={{ 
                        zIndex: timelineLayers.length - layerIndex
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{ 
                          transform: `translate(${mediaProps.x}px, ${mediaProps.y}px) scale(${mediaProps.scale}) rotate(${mediaProps.rotation}deg)`,
                          opacity: mediaProps.opacity
                        }}
                        onMouseEnter={() => console.log('Video transform applied:', {
                          x: mediaProps.x,
                          y: mediaProps.y,
                          scale: mediaProps.scale,
                          rotation: mediaProps.rotation,
                          opacity: mediaProps.opacity
                        })}
                      >
                      {isMediaItem(mediaItem) && mediaItem.asset.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <VideoTimelineControl
                              src={isMediaItem(mediaItem) ? mediaItem.asset.data : ''}
                              startTime={mediaItem.start_time}
                              duration={mediaItem.duration}
                              currentTime={currentTime}
                              isPlaying={isPlaying}
                              className="w-full h-full object-contain rounded-lg"
                              videoStartTime={(mediaItem as any).videoStartTime || 0}
                              videoEndTime={(mediaItem as any).videoEndTime}
                              freezeFrame={(mediaItem as any).freezeFrame || false}
                              freezeFrameTime={(mediaItem as any).freezeFrameTime || 0}
                            />
                          </div>
                        ) : isMediaItem(mediaItem) ? (
                          <img
                          src={isMediaItem(mediaItem) ? mediaItem.asset.data : ''}
                          alt={isMediaItem(mediaItem) ? mediaItem.asset.name : ''}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : isComponentItem(mediaItem) ? (
                          <ComponentRenderer
                            component={mediaItem.component}
                            properties={componentProperties[mediaItem.component.id] || {}}
                            currentTime={Math.min(
                              currentTime - mediaItem.start_time,
                              mediaItem.duration
                            )}
                            isPlaying={isPlaying}
                            mode="preview"
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                });
              })}
              
              {/* Render components on top */}
              {getCurrentTimelineItem() ? (
                <div className="absolute inset-0 w-full h-full" style={{ zIndex: timelineLayers.length + 100 }}>
                  <ComponentRenderer
                    component={getCurrentTimelineItem()!.component}
                    properties={componentProperties[getCurrentTimelineItem()!.component.id] || {}}
                    currentTime={Math.min(
                      currentTime - getCurrentTimelineItem()!.start_time,
                      getCurrentTimelineItem()!.duration
                    )}
                    isPlaying={isPlaying && currentTime < getCurrentTimelineItem()!.start_time + getCurrentTimelineItem()!.duration}
                    mode="preview"
                    timelineItem={getCurrentTimelineItem()!}
                  />
                </div>
              ) : timelineLayers.length === 0 ? (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PlayIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No components in timeline</p>
                    <p className="text-sm">Drag components from the sidebar to get started</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  disabled={totalDuration === 0}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    totalDuration === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <PauseIcon className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Play
                    </>
                  )}
                </button>
                <div className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  title="Open fullscreen preview"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4 mr-1.5" />
                  Preview
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  title="Copy watch link for customers"
                >
                  <ShareIcon className="h-4 w-4 mr-1.5" />
                  Share
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Total Duration: {formatTime(totalDuration)}
              </div>
            </div>
            
            {/* Timeline Scrubber */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={totalDuration}
                step="0.033"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / totalDuration) * 100}%, #e5e7eb ${(currentTime / totalDuration) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Timeline Controls */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Zoom:</span>
                  <input
                    type="range"
                    min="0.25"
                    max="4"
                    step="0.25"
                    value={timelineZoom}
                    onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((timelineZoom - 0.25) / 3.75) * 100}%, #e5e7eb ${((timelineZoom - 0.25) / 3.75) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-sm text-gray-700 min-w-12 text-center">
                    {Math.round(timelineZoom * 100)}%
                  </span>
                <button
                  onClick={() => setTimelineZoom(1)}
                  className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  title="Reset zoom (0 key)"
                >
                  Reset
                </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                      className="rounded"
                    />
                    <span>Snap to Grid</span>
                  </label>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Duration: {formatTime(totalDuration)}
              </div>
            </div>

            {/* Timeline Tracks */}
            <div
              ref={timelineRef}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-x-auto relative"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleTimelineClick}
            >
              {/* Drag Outline Preview */}
              {dragOutline && (
                <div
                  className="absolute pointer-events-none z-30"
                  style={{ 
                    left: `${(dragOutline.time / totalDuration) * 100}%`,
                    top: `${dragOutline.targetTop || (80 + (dragOutline.layer * 124) + 44)}px`,
                    width: `${(dragOutline.width / (timelineRef.current?.getBoundingClientRect().width || 1)) * 100}%`,
                    height: '64px'
                  }}
                >
                  <div className="w-full h-full border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-blue-700 font-medium">
                      {dragOutline.item.asset?.name || 'Media Item'}
                    </span>
                  </div>
                </div>
              )}

              {/* Placeholder Layer Preview */}
              {(dragPreview?.isPlaceholder || dragOutline?.isPlaceholder) && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: '0%',
                    top: (dragPreview?.layer === -1 || dragOutline?.layer === -1) 
                      ? '60px' // Above zone - show between tab and first layer
                      : `${80 + 44 + ((dragPreview?.layer || dragOutline?.layer || 0) * 124)}px`, // Normal positioning
                    width: '100%',
                    height: '64px' // Just the content area height
                  }}
                >
                  <div className="w-full h-full border-2 border-dashed border-green-500 bg-green-100 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-green-700 font-medium">New Layer</div>
                      <div className="text-xs text-green-600">
                        {(dragPreview?.layer === -1 || dragOutline?.layer === -1) 
                          ? 'Drop here to create above' 
                          : 'Drop here to create'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Timeline Content with Zoom Scaling */}
              <div 
              style={{ 
                width: `${100 * timelineZoom}%`,
                minWidth: '100%'
              }}
              onClick={handleTimelineClick}
              >
                {/* Time Markers */}
                <div className="relative h-8 mb-2 border-b border-gray-200">
                  {generateTimeMarkers().map((marker) => (
                    <div
                      key={marker.time}
                      className="absolute top-0 h-full flex flex-col items-center"
                      style={{ left: `${marker.position}%` }}
                    >
                      <div className={`w-px h-4 ${marker.isMinute ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                      <div className={`text-xs mt-1 ${marker.isMinute ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {marker.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vertical Indicator Line for Current Time */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                  style={{
                    left: `${(currentTime / totalDuration) * 100 * timelineZoom}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                </div>

                {/* Drag Preview Indicator */}
                {dragPreview && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-400 pointer-events-none z-20 opacity-60"
                    style={{
                      left: `${(dragPreview.time / totalDuration) * 100 * timelineZoom}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400 rounded-full"></div>
                    <div className="absolute top-2 -left-8 text-xs bg-blue-400 text-white px-1 rounded whitespace-nowrap">
                      {formatTime(dragPreview.time)}
                      {dragPreview.snapTarget && (
                        <div className="text-xs text-blue-100 mt-1">
                          {dragPreview.snapTarget}
                        </div>
                      )}
                    </div>
                  </div>
                )}


              {/* Timeline Tabs */}
                <div className="mb-4">
                <div className="flex items-center space-x-1 border-b border-gray-200">
                  {timelineTabs.map((tab) => (
                    <div key={tab.id} className="relative">
                      {editingTabId === tab.id ? (
                        <input
                          type="text"
                          value={editingTabName}
                          onChange={(e) => setEditingTabName(e.target.value)}
                          onBlur={finishEditingTab}
                          onKeyDown={handleTabKeyDown}
                          className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600 bg-transparent outline-none min-w-0"
                          autoFocus
                        />
                      ) : (
                        <div className="group relative">
                          <button
                            onClick={() => setCurrentActiveTab(tab.id)}
                            onDoubleClick={() => startEditingTab(tab.id, tab.name)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              currentActiveTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {tab.name}
                          </button>
                          {tab.type === 'group' && currentActiveTab === tab.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete group "${tab.name}"?`)) {
                                  ungroupGroup(tab.id);
                                }
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center justify-center hover:bg-red-600"
                              title="Delete group"
                            >
                              ×
                            </button>
                          )}
                      </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Media Layers */}
              {timelineLayers
                .map((layer, layerIndex) => {
                  const activeTabData = timelineTabs.find(tab => tab.id === currentActiveTab);
                  if (!activeTabData) return null;
                  
                  // Filter items within the layer based on current tab
                  let filteredItems = layer.items;
                  
                  if (activeTabData.type === 'main') {
                    // Main video shows items that are not in any group
                    const itemsInGroups = timelineTabs
                      .filter(tab => tab.type === 'group')
                      .flatMap(tab => (tab as any).items || []);
                    filteredItems = layer.items.filter(item => !itemsInGroups.includes(item.id));
                  } else {
                    // Group tabs show only items in that group
                    const groupItems = (activeTabData as any).items || [];
                    filteredItems = layer.items.filter(item => groupItems.includes(item.id));
                  }
                  
                  // Only show layer if it has visible items
                  if (filteredItems.length === 0) return null;
                  
                  return (
                <div key={layer.id} className="mb-4">
                  <div 
                    className="flex items-center mb-2 cursor-move hover:bg-gray-50 p-2 rounded"
                    draggable
                    onDragStart={(e) => handleLayerDragStart(e, layer)}
                  >
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    
                    {/* Editable layer name */}
                    {editingLayerName === layer.id ? (
                      <input
                        type="text"
                        value={editingLayerValue}
                        onChange={(e) => setEditingLayerValue(e.target.value)}
                        onBlur={() => {
                          setTimelineLayers(prev => prev.map(l => 
                            l.id === layer.id ? { ...l, name: editingLayerValue } : l
                          ));
                          setEditingLayerName(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setTimelineLayers(prev => prev.map(l => 
                              l.id === layer.id ? { ...l, name: editingLayerValue } : l
                            ));
                            setEditingLayerName(null);
                          } else if (e.key === 'Escape') {
                            setEditingLayerName(null);
                          }
                        }}
                        className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none"
                        autoFocus
                      />
                    ) : (
                      <h4 
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                        onDoubleClick={() => {
                          setEditingLayerName(layer.id);
                          setEditingLayerValue(layer.name);
                        }}
                      >
                        {layer.name}
                      </h4>
                    )}
                    
                    <div className="ml-2 w-3 h-3 bg-green-500 rounded"></div>
                    
                    {/* Eye icon toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimelineLayers(prev => prev.map(l => 
                          l.id === layer.id ? { ...l, visible: !l.visible } : l
                        ));
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setTimelineLayers(prev => prev.filter(l => l.id !== layer.id));
                      }}
                      className="ml-auto text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="relative h-16" data-layer-content>
                    {filteredItems.map((item: any, itemIndex: number) => {
                      const isGroup = item.isGroup;
                      return (
                        <div
                          key={`${layer.id}-${item.id}-${itemIndex}`}
                          data-group-id={isGroup ? item.id : undefined}
                          draggable={!isGroup}
                          onDragStart={!isGroup ? (e) => handleMediaItemDragStart(e, item, layer.id) : undefined}
                          onMouseDown={!isGroup ? (e) => handleItemMouseDown(e, item, layer.id) : undefined}
                          onClick={(e) => {
                            // Skip click action if we just finished dragging
                            if (justDragged) {
                              return;
                            }
                            
                            if (isGroup) {
                              // For groups, single click selects, double click opens
                              if (e.detail === 2) {
                                handleGroupDoubleClick(item.id);
                              } else {
                                toggleItemSelection(item.id, e);
                              }
                            } else {
                              // Move scrubber to clicked position
                              handleItemClick(item, e);
                              
                              // Check if item is currently selected before toggling
                              const wasSelected = selectedItems.has(item.id);
                              
                              // Toggle selection (this will deselect if already selected)
                              toggleItemSelection(item.id, e);
                              
                              if (wasSelected) {
                                // If it was selected, now it's deselected - clear selection
                                setSelectedMediaItem(null);
                                setSelectedTimelineItem(null);
                              } else {
                                // If it wasn't selected, now it's selected - set as selected media item
                          setSelectedMediaItem(item);
                          setSelectedTimelineItem(null);
                          setShowComponentLibrary(false);
                          setShowMediaLibrary(false);
                              }
                            }
                          }}
                          onMouseEnter={() => {
                            if (!isGroup) {
                              setHoveredItem({itemId: item.id, layerId: layer.id});
                              // Show scissors if scrubber is within this item
                              const scrubberInItem = currentTime >= item.start_time && currentTime <= item.start_time + item.duration;
                              setShowScissors(scrubberInItem);
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredItem(null);
                            setShowScissors(false);
                        }}
                        className={`absolute top-0 h-full rounded-lg p-3 cursor-move transition-colors group ${
                            isGroup 
                              ? selectedItems.has(item.id)
                                ? 'bg-purple-300 text-purple-900 border-2 border-purple-500'
                                : 'bg-purple-100 text-purple-900 hover:bg-purple-200 border-2 border-purple-300'
                              : selectedItems.has(item.id)
                                ? 'bg-blue-300 text-blue-900 border-2 border-blue-500'
                                : selectedMediaItem?.id === item.id 
                            ? 'bg-green-300 text-green-900' 
                            : 'bg-green-100 text-green-900 hover:bg-green-200'
                        }`}
                        style={{
                          left: `${(item.start_time / totalDuration) * 100}%`,
                          width: `${(item.duration / totalDuration) * 100}%`,
                          minWidth: '120px'
                        }}
                      >
                          {isGroup ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <input
                                  type="text"
                                  className="group-name bg-transparent border-none outline-none text-sm font-medium truncate"
                                  value={item.name}
                                  onChange={(e) => handleGroupNameEdit(item.id, e.target.value)}
                                  onBlur={(e) => handleGroupNameEdit(item.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                />
                              </div>
                              <div className="text-xs opacity-75">
                                {item.items?.length || 0} items
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm font-medium truncate">
                                {isMediaItem(item) ? item.asset.name : isComponentItem(item) ? item.component.name : 'Unknown Item'}
                              </div>
                        <div className="text-xs opacity-75">
                          {formatTime(item.start_time)} - {formatTime(item.start_time + item.duration)}
                        </div>
                            </>
                          )}
                        
                        
                        {/* Freeze frame indicator - show where freeze frame starts */}
                        {!isGroup && isMediaItem(item) && item.asset.type === 'video' && (item as any).freezeFrame && (
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-purple-400 border-l border-purple-500"
                            style={{
                              left: `${((item as any).freezeFrameTime / item.duration) * 100}%`
                            }}
                            title={`Freeze frame starts at ${formatTime(item.start_time + (item as any).freezeFrameTime)}`}
                          />
                        )}

                        {/* Group content boundaries - show where actual content starts/ends */}
                        {isGroup && (() => {
                          const groupTiming = calculateGroupDuration((item as any).items || []);
                          const contentStartPercent = ((groupTiming.startTime - item.start_time) / item.duration) * 100;
                          const contentEndPercent = ((groupTiming.startTime + groupTiming.duration - item.start_time) / item.duration) * 100;
                          
                          // Debug logging
                          console.log('Group boundaries:', {
                            groupId: item.id,
                            groupStart: item.start_time,
                            groupDuration: item.duration,
                            contentStart: groupTiming.startTime,
                            contentDuration: groupTiming.duration,
                            contentStartPercent,
                            contentEndPercent
                          });
                          
                          return (
                            <>
                              {/* Content start boundary */}
                              {contentStartPercent > 0 && (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-blue-400 border-l border-blue-500 z-10"
                                  style={{ left: `${contentStartPercent}%` }}
                                  title={`Content starts at ${formatTime(groupTiming.startTime)}`}
                                />
                              )}
                              
                              {/* Content end boundary */}
                              {contentEndPercent < 100 && (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-blue-400 border-l border-blue-500 z-10"
                                  style={{ left: `${contentEndPercent}%` }}
                                  title={`Content ends at ${formatTime(groupTiming.startTime + groupTiming.duration)}`}
                                />
                              )}
                              
                              {/* Dimmed area before content */}
                              {contentStartPercent > 0 && (
                                <div
                                  className="absolute top-0 bottom-0 bg-gray-300 opacity-30 z-5"
                                  style={{ 
                                    left: '0%', 
                                    width: `${contentStartPercent}%` 
                                  }}
                                  title="No content in this area"
                                />
                              )}
                              
                              {/* Dimmed area after content */}
                              {contentEndPercent < 100 && (
                                <div
                                  className="absolute top-0 bottom-0 bg-gray-300 opacity-30 z-5"
                                  style={{ 
                                    left: `${contentEndPercent}%`, 
                                    width: `${100 - contentEndPercent}%` 
                                  }}
                                  title="No content in this area"
                                />
                              )}
                            </>
                          );
                        })()}
                        
                        {/* Start resize handle for images and videos */}
                        {!isGroup && isMediaItem(item) && (item.asset.type === 'image' || item.asset.type === 'video') && (
                          <div
                            className={`absolute left-0 top-0 w-2 h-full opacity-0 group-hover:opacity-100 cursor-ew-resize transition-opacity ${
                              isOptionHeld && item.asset.type === 'video' 
                                ? 'bg-purple-500 hover:bg-purple-600' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                            onMouseDown={(e) => handleMediaResize(e, item, layer.id, 'start')}
                            title={isOptionHeld && item.asset.type === 'video' ? "Hold Option + drag for freeze-frame" : "Drag to resize start"}
                          >
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white rounded-sm opacity-50" />
                            {isOptionHeld && item.asset.type === 'video' && (
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 text-xs text-white font-bold">
                                ⏸️
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* End resize handle for images and videos */}
                        {!isGroup && isMediaItem(item) && (item.asset.type === 'image' || item.asset.type === 'video') && (
                          <div
                            className={`absolute right-0 top-0 w-2 h-full opacity-0 group-hover:opacity-100 cursor-ew-resize transition-opacity ${
                              isOptionHeld && item.asset.type === 'video' 
                                ? 'bg-purple-500 hover:bg-purple-600' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                            onMouseDown={(e) => handleMediaResize(e, item, layer.id, 'end')}
                            title={isOptionHeld && item.asset.type === 'video' ? "Hold Option + drag for freeze-frame" : "Drag to resize end"}
                          >
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white rounded-sm opacity-50" />
                            {isOptionHeld && item.asset.type === 'video' && (
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 text-xs text-white font-bold">
                                ⏸️
                          </div>
                        )}
                      </div>
                        )}

                        {/* Group resize handles */}
                        {isGroup && (
                          <>
                            {/* Start resize handle for groups */}
                            <div
                              className="absolute left-0 top-0 w-2 h-full opacity-0 group-hover:opacity-100 cursor-ew-resize transition-opacity bg-green-500 hover:bg-green-600"
                              onMouseDown={(e) => handleGroupResize(e, item, layer.id, 'start')}
                              title="Drag to resize group start"
                            >
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white rounded-sm opacity-50" />
                            </div>
                            
                            {/* End resize handle for groups */}
                            <div
                              className="absolute right-0 top-0 w-2 h-full opacity-0 group-hover:opacity-100 cursor-ew-resize transition-opacity bg-green-500 hover:bg-green-600"
                              onMouseDown={(e) => handleGroupResize(e, item, layer.id, 'end')}
                              title="Drag to resize group end"
                            >
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white rounded-sm opacity-50" />
                            </div>
                          </>
                        )}
                        
                        {/* Scissors icon for clip splitting */}
                        {!isGroup && showScissors && hoveredItem?.itemId === item.id && hoveredItem?.layerId === layer.id && (
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors z-50"
                            style={{
                              left: `${((currentTime - item.start_time) / item.duration) * 100}%`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              splitClip(item.id, layer.id, currentTime);
                            }}
                            title="Split clip at current time"
                          >
                            <ScissorsIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    );
                    })}
                    
                    {/* Drag Preview */}
                    {dragPreview && dragPreview.layerId === layer.id && dragPreview.startTime !== undefined && dragPreview.duration !== undefined && (
                      <div
                        className="absolute top-0 h-full rounded-lg p-3 pointer-events-none z-50"
                        style={{
                          left: `${(dragPreview.startTime / totalDuration) * 100}%`,
                          width: `${(dragPreview.duration / totalDuration) * 100}%`,
                          minWidth: '120px',
                          backgroundColor: dragPreview.swapTarget ? 'rgba(255, 165, 0, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                          border: `2px dashed ${dragPreview.swapTarget ? '#f59e0b' : '#3b82f6'}`,
                        }}
                      >
                        <div className="text-sm font-medium truncate text-blue-900">
                          {dragPreview.swapTarget ? 'Swap Position' : 'Drop Here'}
                        </div>
                        <div className="text-xs opacity-75 text-blue-700">
                          {formatTime(dragPreview.startTime)} - {formatTime(dragPreview.startTime + dragPreview.duration)}
                        </div>
                      </div>
                    )}
                    
                    {filteredItems.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        <p>Drag media here to add to this layer</p>
                      </div>
                    )}
                  </div>
                </div>
                );
                })
                .filter(Boolean)}
              </div> {/* End of Timeline Content with Zoom Scaling */}

              {/* Smart Layer Creation Info */}
              <div className="mt-4 text-center">
                <div className="text-xs text-gray-500">
                  💡 Drag items above or below existing layers to create new layers automatically
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Library & Properties Sidebar */}
        <div className="w-96 border-l border-gray-200 overflow-y-auto bg-white">
          <div className="p-6">
            {/* Toggle between Component Library, Media Library and Properties */}
            <div className="flex mb-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowComponentLibrary(true);
                  setShowMediaLibrary(false);
                  setSelectedTimelineItem(null);
                }}
                className={`flex-1 px-2 py-2 text-xs font-medium ${
                  showComponentLibrary && !showMediaLibrary
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Components
              </button>
              <button
                onClick={() => {
                  setShowComponentLibrary(false);
                  setShowMediaLibrary(true);
                  setSelectedTimelineItem(null);
                }}
                className={`flex-1 px-2 py-2 text-xs font-medium ${
                  showMediaLibrary
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Media
              </button>
              <button
                onClick={() => {
                  setShowComponentLibrary(false);
                  setShowMediaLibrary(false);
                }}
                className={`flex-1 px-2 py-2 text-xs font-medium ${
                  !showComponentLibrary && !showMediaLibrary
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Properties
              </button>
            </div>

            {showComponentLibrary ? (
              // Component Library
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Components</h3>
                
                <div className="space-y-2">
                  {/* iPhone SMS Component - Hardcoded for now */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, {
                      id: 'iphone_sms_component',
                      name: 'iPhone SMS Conversation',
                      type: 'iphone_sms',
                      category: 'UI Component',
                      duration: 10,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      metadata: {}
                    })}
                    className="p-4 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">iPhone SMS Conversation</h4>
                    <p className="text-sm text-gray-500">iphone_sms</p>
                    <p className="text-xs text-gray-400 mt-1">Interactive SMS conversation in iPhone interface</p>
                  </div>
                  
                  {components.map((component) => (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, component)}
                      className="p-4 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{component.name}</h4>
                      <p className="text-sm text-gray-500">{component.type}</p>
                      <p className="text-xs text-gray-400 mt-1">{component.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : showMediaLibrary ? (
              // Media Library
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Media Assets</h3>
                
                {/* Upload Button */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept="video/*,image/*"
                    multiple
                    onChange={handleMediaUpload}
                    className="hidden"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-center block"
                  >
                    Upload Media
                  </label>
                </div>
                
                {/* Media Assets List */}
                <div className="space-y-2">
                  {mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => handleMediaDragStart(e, asset)}
                      className="p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {asset.type === 'video' ? (
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                          <p className="text-xs text-gray-500">{asset.type} • {formatTime(asset.duration)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {mediaAssets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm">No media assets uploaded yet</p>
                      <p className="text-xs text-gray-400 mt-1">Upload videos or images to get started</p>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedTimelineItem ? (
              // Component Properties Panel
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedTimelineItem.component.name} Properties
                </h3>
                
                {(() => {
                  const schema = getComponentSchema(selectedTimelineItem.component.type);
                  if (!schema) {
                    return (
                      <div className="text-center text-gray-500 py-8">
                        <p>No properties schema found for component type: {selectedTimelineItem.component.type}</p>
                      </div>
                    );
                  }
                  
                  return (
                    <ComponentPropertiesPanel
                      schema={schema}
                      properties={componentProperties[selectedTimelineItem.component.id] || {}}
                      onPropertyChange={(propertyId, value) => {
                        setComponentProperties(prev => ({
                          ...prev,
                          [selectedTimelineItem.component.id]: {
                            ...prev[selectedTimelineItem.component.id],
                            [propertyId]: value
                          }
                        }));
                      }}
                    />
                  );
                })()}

                <button
                  onClick={() => removeFromTimeline(selectedTimelineItem.id)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 mt-4"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Remove from Timeline
                </button>
              </div>
            ) : selectedMediaItem ? (
              // Media/Component Properties Panel
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedMediaItem.asset?.name || selectedMediaItem.component?.name || 'Item'} Properties
                </h3>
                
                <div className="space-y-4">
                  {/* Component Properties */}
                  {selectedMediaItem.component && (
                    <div className="border-b border-gray-200 pb-4">
                      {getComponentSchema(selectedMediaItem.component.type) && (
                        <ComponentPropertiesPanel
                          schema={getComponentSchema(selectedMediaItem.component.type)!}
                          properties={componentProperties[selectedMediaItem.component.id] || {}}
                          onPropertyChange={(propertyId, value) => {
                            setComponentProperties(prev => ({
                              ...prev,
                              [selectedMediaItem.component.id]: {
                                ...prev[selectedMediaItem.component.id],
                                [propertyId]: value
                              }
                            }));
                          }}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Media Properties */}
                  {selectedMediaItem.asset && (
                  <div className="border-b border-gray-200 pb-4">
                    <div className="space-y-4">
                      {/* Scale */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scale
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={mediaProperties[selectedMediaItem.id]?.scale || 1}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  scale: value
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={mediaProperties[selectedMediaItem.id]?.scale || 1}
                            onChange={(e) => {
                              const value = Math.max(0.1, Math.min(5, parseFloat(e.target.value) || 1));
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  scale: value
                                }
                              }));
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          {(mediaProperties[selectedMediaItem.id]?.scale || 1).toFixed(1)}x
                        </div>
                      </div>

                      {/* Position X */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position X
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="-2000"
                            max="2000"
                            step="10"
                            value={mediaProperties[selectedMediaItem.id]?.x || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  x: value
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="-2000"
                            max="2000"
                            step="1"
                            value={mediaProperties[selectedMediaItem.id]?.x || 0}
                            onChange={(e) => {
                              const value = Math.max(-2000, Math.min(2000, parseInt(e.target.value) || 0));
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  x: value
                                }
                              }));
                            }}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          {mediaProperties[selectedMediaItem.id]?.x || 0}px
                        </div>
                      </div>

                      {/* Position Y */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position Y
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="-2000"
                            max="2000"
                            step="10"
                            value={mediaProperties[selectedMediaItem.id]?.y || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  y: value
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="-2000"
                            max="2000"
                            step="1"
                            value={mediaProperties[selectedMediaItem.id]?.y || 0}
                            onChange={(e) => {
                              const value = Math.max(-2000, Math.min(2000, parseInt(e.target.value) || 0));
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  y: value
                                }
                              }));
                            }}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          {mediaProperties[selectedMediaItem.id]?.y || 0}px
                        </div>
                      </div>

                      {/* Opacity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opacity
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={mediaProperties[selectedMediaItem.id]?.opacity || 1}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  opacity: value
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={mediaProperties[selectedMediaItem.id]?.opacity || 1}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(1, parseFloat(e.target.value) || 1));
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  opacity: value
                                }
                              }));
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          {Math.round((mediaProperties[selectedMediaItem.id]?.opacity || 1) * 100)}%
                        </div>
                      </div>

                      {/* Rotation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rotation
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="-360"
                            max="360"
                            step="1"
                            value={mediaProperties[selectedMediaItem.id]?.rotation || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  rotation: value
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="-360"
                            max="360"
                            step="1"
                            value={mediaProperties[selectedMediaItem.id]?.rotation || 0}
                            onChange={(e) => {
                              const value = Math.max(-360, Math.min(360, parseInt(e.target.value) || 0));
                              setMediaProperties(prev => ({
                                ...prev,
                                [selectedMediaItem.id]: {
                                  ...prev[selectedMediaItem.id],
                                  rotation: value
                                }
                              }));
                            }}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          {mediaProperties[selectedMediaItem.id]?.rotation || 0}°
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  <button
                    onClick={() => {
                      // Remove media item from timeline
                      setTimelineLayers(prev => prev.map(layer => ({
                        ...layer,
                        items: layer.items.filter(item => item.id !== selectedMediaItem.id)
                      })));
                      setSelectedMediaItem(null);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Remove from Timeline
                  </button>
                </div>
              </div>
            ) : (
              // No selection
              <div className="text-center text-gray-500 py-8">
                <p>Select a component or media item from the timeline to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Video</h3>
            
            <div className="space-y-4">
              {/* Video Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Format
                </label>
                <select
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value as 'mp4' | 'webm' | 'mov')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={isRendering}
                >
                  <option value="mp4">MP4 (H.264) - Most Compatible</option>
                  <option value="webm">WebM (VP9) - Web Optimized</option>
                  <option value="mov">MOV (H.264) - Professional</option>
                </select>
              </div>

              {/* Alpha Channel Option */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasAlphaChannel}
                    onChange={(e) => setHasAlphaChannel(e.target.checked)}
                    disabled={isRendering}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Transparent Background (Alpha Channel)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {hasAlphaChannel 
                    ? 'Video will have transparent background - ideal for overlays'
                    : 'Video will have solid background color'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                disabled={isRendering}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  downloadVideo();
                }}
                disabled={isRendering || timeline.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRendering ? 'Rendering...' : `Download ${videoFormat.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview */}
      {showPreviewModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black z-60">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-full max-w-none relative" style={{ aspectRatio: '16/9' }}>
              {/* Render media layers first (background) */}
              {timelineLayers.map((layer, layerIndex) => {
                // Check if this layer is hidden by a group
                const groupLayer = timelineLayers.find(l => l.id === 'group-layer');
                const isHiddenByGroup = groupLayer?.items.some(groupItem => {
                  if (!(groupItem as any).isGroup) return false;
                  const groupItems = (groupItem as any).items || [];
                  return layer.items.some(item => groupItems.includes(item.id)) && !groupLayer.visible;
                });
                
                if (!layer.visible || isHiddenByGroup) return null;
                
                return layer.items.map((mediaItem) => {
                  // Skip group items in preview - they don't render content
                  if ((mediaItem as any).isGroup) return null;
                  
                  // Check if this item is within a group's display boundaries
                  const groupLayer = timelineLayers.find(l => l.id === 'group-layer');
                  const containingGroup = groupLayer?.items.find(groupItem => {
                    if (!(groupItem as any).isGroup) return false;
                    const groupItems = (groupItem as any).items || [];
                    return groupItems.includes(mediaItem.id);
                  });
                  
                  // If item is in a group, check if current time is within group's display boundaries
                  if (containingGroup) {
                    const groupStart = containingGroup.start_time;
                    const groupEnd = containingGroup.start_time + containingGroup.duration;
                    if (currentTime < groupStart || currentTime >= groupEnd) {
                      return null; // Don't show content outside group boundaries
                    }
                  }
                  
                  const isActive = currentTime >= mediaItem.start_time && currentTime < mediaItem.start_time + mediaItem.duration;
                  if (!isActive) return null;
                  
                  const mediaProps = mediaProperties[mediaItem.id] || {
                    scale: 1,
                    x: 0,
                    y: 0,
                    opacity: 1,
                    rotation: 0
                  };
                  
                  return (
                    <div
                      key={mediaItem.id}
                      className="absolute inset-0 w-full h-full overflow-hidden"
                      style={{ 
                        zIndex: timelineLayers.length - layerIndex
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{ 
                          transform: `translate(${mediaProps.x}px, ${mediaProps.y}px) scale(${mediaProps.scale}) rotate(${mediaProps.rotation}deg)`,
                          opacity: mediaProps.opacity
                        }}
                      >
                      {isMediaItem(mediaItem) && mediaItem.asset.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <VideoTimelineControl
                              src={isMediaItem(mediaItem) ? mediaItem.asset.data : ''}
                              startTime={mediaItem.start_time}
                              duration={mediaItem.duration}
                              currentTime={currentTime}
                              isPlaying={isPlaying}
                              className="w-full h-full object-contain rounded-lg"
                              videoStartTime={(mediaItem as any).videoStartTime || 0}
                              videoEndTime={(mediaItem as any).videoEndTime}
                              freezeFrame={(mediaItem as any).freezeFrame || false}
                              freezeFrameTime={(mediaItem as any).freezeFrameTime || 0}
                            />
                          </div>
                        ) : isMediaItem(mediaItem) ? (
                          <img
                          src={isMediaItem(mediaItem) ? mediaItem.asset.data : ''}
                          alt={isMediaItem(mediaItem) ? mediaItem.asset.name : ''}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : isComponentItem(mediaItem) ? (
                          <ComponentRenderer
                            component={mediaItem.component}
                            properties={componentProperties[mediaItem.component.id] || {}}
                            currentTime={Math.min(
                              currentTime - mediaItem.start_time,
                              mediaItem.duration
                            )}
                            isPlaying={isPlaying && currentTime < mediaItem.start_time + mediaItem.duration}
                            mode="preview"
                            timelineItem={mediaItem}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                });
              })}
              
              {/* Render components on top */}
              {getCurrentTimelineItem() ? (
                <div className="absolute inset-0 w-full h-full" style={{ zIndex: timelineLayers.length + 100 }}>
                  <ComponentRenderer
                    component={getCurrentTimelineItem()!.component}
                    properties={componentProperties[getCurrentTimelineItem()!.component.id] || {}}
                    currentTime={Math.min(
                      currentTime - getCurrentTimelineItem()!.start_time,
                      getCurrentTimelineItem()!.duration
                    )}
                    isPlaying={isPlaying && currentTime < getCurrentTimelineItem()!.start_time + getCurrentTimelineItem()!.duration}
                    mode="preview"
                    timelineItem={getCurrentTimelineItem()!}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal Overlay */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        hideCloseButton={searchParams.get('view') === 'preview'}
        currentTime={currentTime}
        totalDuration={totalDuration}
        onSeek={handleSeek}
        onSkipBackward={handleSkipBackward}
        onSkipForward={handleSkipForward}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
