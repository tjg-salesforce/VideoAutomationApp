'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlayIcon, PauseIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Project, Component, TimelineItem } from '@/types';
import { apiEndpoints } from '@/lib/api';
import ComponentRenderer from '@/components/ComponentRenderer';

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<Component | null>(null);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  
  // Component properties state
  const [componentProperties, setComponentProperties] = useState<{[key: string]: any}>({});
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProject();
    loadComponents();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      setTimeline(project.timeline || []);
      calculateTotalDuration(project.timeline || []);
    }
  }, [project]);

  const loadProject = async () => {
    try {
      const response = await apiEndpoints.getProject(projectId);
      setProject(response.data.data);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadComponents = async () => {
    try {
      const response = await apiEndpoints.getComponents();
      setComponents(response.data.data || []);
    } catch (error) {
      console.error('Error loading components:', error);
    }
  };

  const calculateTotalDuration = (timelineItems: TimelineItem[]) => {
    const maxEndTime = Math.max(...timelineItems.map(item => item.start_time + item.duration), 0);
    setTotalDuration(maxEndTime);
  };

  const handleDragStart = (e: React.DragEvent, component: Component) => {
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedComponent) return;

    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const x = e.clientX - timelineRect.left;
    const timePerPixel = totalDuration / timelineRect.width;
    const startTime = Math.max(0, Math.min(totalDuration, x * timePerPixel));

    const newItem: TimelineItem = {
      id: `timeline_${Date.now()}`,
      component_id: draggedComponent.id,
      component: draggedComponent,
      start_time: startTime,
      duration: draggedComponent.duration || 5,
      order: timeline.length
    };

    const newTimeline = [...timeline, newItem].sort((a, b) => a.start_time - b.start_time);
    setTimeline(newTimeline);
    calculateTotalDuration(newTimeline);
    setDraggedComponent(null);
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
      await apiEndpoints.updateProject(project.id, {
        ...project,
        timeline,
        status: 'in_progress'
      });
      // Refresh project data
      await loadProject();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    return currentItem || null;
  };

  const handlePlayPause = () => {
    if (timeline.length === 0) {
      // No components in timeline, can't play
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
      // If we're at the end, reset to beginning
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
      }
      
      // Play
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
            <div className="w-full h-full max-w-6xl" style={{ aspectRatio: '16/9' }}>
              {getCurrentTimelineItem() ? (
                <ComponentRenderer
                  component={getCurrentTimelineItem()!.component}
                  properties={componentProperties[getCurrentTimelineItem()!.component.id] || {}}
                  currentTime={currentTime - getCurrentTimelineItem()!.start_time}
                  isPlaying={isPlaying}
                  mode="preview"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PlayIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No components in timeline</p>
                    <p className="text-sm">Drag components from the sidebar to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  disabled={timeline.length === 0}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    timeline.length === 0
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
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Timeline Tracks */}
            <div 
              ref={timelineRef}
              className="h-24 border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-x-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex space-x-2 h-full">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedTimelineItem(item);
                      setShowComponentLibrary(false);
                    }}
                    className={`min-w-32 h-full rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedTimelineItem?.id === item.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    }`}
                    style={{
                      width: `${(item.duration / totalDuration) * 100}%`,
                      minWidth: '120px'
                    }}
                  >
                    <div className="text-sm font-medium truncate">{item.component.name}</div>
                    <div className="text-xs opacity-75">
                      {formatTime(item.start_time)} - {formatTime(item.start_time + item.duration)}
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>Drag components here to add them to the timeline</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Component Library & Properties Sidebar */}
        <div className="w-80 border-l border-gray-200 overflow-y-auto bg-white">
          <div className="p-6">
            {/* Toggle between Component Library and Properties */}
            <div className="flex mb-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowComponentLibrary(true);
                  setSelectedTimelineItem(null);
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  showComponentLibrary
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Components
              </button>
              <button
                onClick={() => setShowComponentLibrary(false)}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  !showComponentLibrary
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
                  {components.map((component) => (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, component)}
                      className="p-4 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{component.name}</h4>
                      <p className="text-sm text-gray-500">{component.type}</p>
                      <p className="text-xs text-gray-400 mt-1">{component.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedTimelineItem ? (
              // Component Properties Panel
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedTimelineItem.component.name} Properties
                </h3>
                
                <div className="space-y-4">
                  {/* Timeline Properties */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Timeline</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time (seconds)
                        </label>
                        <input
                          type="number"
                          value={selectedTimelineItem.start_time}
                          onChange={(e) => updateTimelineItem(selectedTimelineItem.id, { 
                            start_time: parseFloat(e.target.value) || 0 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (seconds)
                        </label>
                        <input
                          type="number"
                          value={selectedTimelineItem.duration}
                          onChange={(e) => updateTimelineItem(selectedTimelineItem.id, { 
                            duration: parseFloat(e.target.value) || 1 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Component Properties */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Component Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={componentProperties[selectedTimelineItem.component.id]?.backgroundColor || '#184cb4'}
                          onChange={(e) => {
                            const newProps = {
                              ...componentProperties,
                              [selectedTimelineItem.component.id]: {
                                ...componentProperties[selectedTimelineItem.component.id],
                                backgroundColor: e.target.value
                              }
                            };
                            setComponentProperties(newProps);
                          }}
                          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Logo Scale
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="2"
                          step="0.1"
                          value={componentProperties[selectedTimelineItem.component.id]?.logoScale || 1}
                          onChange={(e) => {
                            const newProps = {
                              ...componentProperties,
                              [selectedTimelineItem.component.id]: {
                                ...componentProperties[selectedTimelineItem.component.id],
                                logoScale: parseFloat(e.target.value)
                              }
                            };
                            setComponentProperties(newProps);
                          }}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">
                          {componentProperties[selectedTimelineItem.component.id]?.logoScale || 1}x
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Logo Upload
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const newProps = {
                                  ...componentProperties,
                                  [selectedTimelineItem.component.id]: {
                                    ...componentProperties[selectedTimelineItem.component.id],
                                    customerLogo: {
                                      name: file.name,
                                      data: event.target?.result as string
                                    }
                                  }
                                };
                                setComponentProperties(newProps);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        {componentProperties[selectedTimelineItem.component.id]?.customerLogo && (
                          <div className="text-xs text-gray-500 mt-1">
                            Current: {componentProperties[selectedTimelineItem.component.id].customerLogo.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromTimeline(selectedTimelineItem.id)}
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
                <p>Select a component from the timeline to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
