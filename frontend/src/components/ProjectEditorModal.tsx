'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, PlayIcon, PauseIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Project, Component, TimelineItem } from '@/types';
import { apiEndpoints } from '@/lib/api';
import CustomerLogoSplit from './CustomerLogoSplit';

interface ProjectEditorModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  components: Component[];
}

export default function ProjectEditorModal({ 
  project, 
  isOpen, 
  onClose, 
  onProjectUpdated,
  components 
}: ProjectEditorModalProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<Component | null>(null);
  const [previewComponent, setPreviewComponent] = useState<Component | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project && isOpen) {
      setTimeline(project.timeline || []);
      calculateTotalDuration(project.timeline || []);
    }
  }, [project, isOpen]);

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

    // Add 1-second offset for logo split component
    const adjustedStartTime = draggedComponent.type === 'customer_logo_split' 
      ? startTime + 1 
      : startTime;

    const newItem: TimelineItem = {
      id: `timeline_${Date.now()}`,
      component_id: draggedComponent.id,
      component: draggedComponent,
      start_time: adjustedStartTime,
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
  };

  const updateTimelineItem = (itemId: string, updates: Partial<TimelineItem>) => {
    const newTimeline = timeline.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ).sort((a, b) => a.start_time - b.start_time);
    setTimeline(newTimeline);
    calculateTotalDuration(newTimeline);
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
      onProjectUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async () => {
    if (!project) return;

    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setLoading(true);
      try {
        await apiEndpoints.deleteProject(project.id);
        onProjectUpdated();
        onClose();
      } catch (error) {
        console.error('Error deleting project:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleComponentExpanded = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const previewComponentInTimeline = (component: Component) => {
    setPreviewComponent(component);
    setShowPreview(true);
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
          <p className="text-sm text-gray-500">{project.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={deleteProject}
            disabled={loading}
            className="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <TrashIcon className="h-4 w-4 inline mr-1" />
            Delete
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-100">
            {showPreview && previewComponent ? (
              <div className="w-full h-full max-w-4xl" style={{ aspectRatio: '16/9' }}>
                <CustomerLogoSplit
                  isOpen={true}
                  onClose={() => setShowPreview(false)}
                  onSave={() => {}}
                  componentData={previewComponent}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <PlayIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No preview selected</p>
                <p className="text-sm">Drag a component to the timeline or click preview</p>
              </div>
            )}
          </div>

          {/* Timeline Area */}
          <div className="h-48 border-t border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
              <div className="mt-4">
                <input
                  type="range"
                  min="0"
                  max={totalDuration}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Timeline Tracks */}
            <div 
              ref={timelineRef}
              className="flex-1 p-4 overflow-x-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="min-h-20 border-2 border-dashed border-gray-300 rounded-lg p-4">
                {timeline.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Drag components here to add them to the timeline</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeline.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.component.name}</h4>
                          <p className="text-sm text-gray-500">{item.component.type}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="text-xs text-gray-500">
                              Start: {formatTime(item.start_time)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Duration: {formatTime(item.duration)}
                            </div>
                            <div className="text-xs text-gray-500">
                              End: {formatTime(item.start_time + item.duration)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => previewComponentInTimeline(item.component)}
                            className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Preview
                          </button>
                          <input
                            type="number"
                            value={item.start_time}
                            onChange={(e) => updateTimelineItem(item.id, { 
                              start_time: parseFloat(e.target.value) || 0 
                            })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Start"
                          />
                          <input
                            type="number"
                            value={item.duration}
                            onChange={(e) => updateTimelineItem(item.id, { 
                              duration: parseFloat(e.target.value) || 1 
                            })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Duration"
                          />
                          <button
                            onClick={() => removeFromTimeline(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={saveProject}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>

        {/* Component Library Sidebar */}
        <div className="w-80 border-l border-gray-200 overflow-y-auto bg-white">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Components</h3>
            
            {/* Components Accordion */}
            <div className="space-y-2">
              {components.map((component) => (
                <div key={component.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleComponentExpanded(component.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{component.name}</h4>
                      <p className="text-sm text-gray-500">{component.type}</p>
                    </div>
                    {expandedComponents.has(component.id) ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedComponents.has(component.id) && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                      <div className="flex space-x-2">
                        <button
                          draggable
                          onDragStart={(e) => handleDragStart(e, component)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Drag to Timeline
                        </button>
                        <button
                          onClick={() => previewComponentInTimeline(component)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}