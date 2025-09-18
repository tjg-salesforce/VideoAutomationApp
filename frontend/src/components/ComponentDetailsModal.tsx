'use client';

import { XMarkIcon, ClockIcon, TagIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Component } from '@/types';

interface ComponentDetailsModalProps {
  component: Component | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ComponentDetailsModal({ component, isOpen, onClose }: ComponentDetailsModalProps) {
  if (!isOpen || !component) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{component.name}</h2>
            <p className="text-gray-600 mt-1">Component Type: {component.type}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Component Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TagIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Category:</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{component.category || 'N/A'}</span>
            </div>
            
            {component.duration && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium text-gray-900">{component.duration} seconds</span>
              </div>
            )}

            {component.file_path && (
              <div className="flex items-center space-x-2">
                <DocumentIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">File Path:</span>
                <span className="text-sm font-medium text-gray-900 break-all">{component.file_path}</span>
              </div>
            )}

            <div className="pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Component Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(component.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Component Preview */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Component Preview</h3>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {component.type} component
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Preview not available
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Usage</h3>
              <p className="text-sm text-blue-700">
                This component can be used in video projects to enhance the visual experience. 
                It will be automatically included when using compatible templates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
