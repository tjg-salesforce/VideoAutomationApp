import React, { useState, useEffect } from 'react';
import { XMarkIcon, CogIcon } from '@heroicons/react/24/outline';
import { Project } from '@/types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (settings: {
    name: string;
    description: string;
    duration: number;
  }) => Promise<void>;
  isTemplate?: boolean; // Flag to indicate if editing a template
}

export default function ProjectSettingsModal({ 
  isOpen, 
  onClose, 
  project, 
  onSave,
  isTemplate = false
}: ProjectSettingsModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);

  // Update form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setDuration(project.settings?.duration || 5);
    }
  }, [project]);

  const handleSave = async () => {
    if (!project) return;
    
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        duration: Math.max(1, duration) // Ensure minimum 1 second
      });
      onClose();
    } catch (error) {
      console.error('Error saving project settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{isTemplate ? 'Template' : 'Project'} Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project name"
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project description"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="1"
                  max="300"
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-sm font-medium text-gray-700 text-right">
                  {formatTime(duration)}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-500">seconds</span>
              </div>
              <p className="text-xs text-gray-500">
                Adjusting the duration will extend or trim the timeline. Existing content will be preserved.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
