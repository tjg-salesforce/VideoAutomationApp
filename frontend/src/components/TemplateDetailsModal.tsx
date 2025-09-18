'use client';

import { XMarkIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { Template } from '@/types';

interface TemplateDetailsModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: Template) => void;
}

export default function TemplateDetailsModal({ template, isOpen, onClose, onUseTemplate }: TemplateDetailsModalProps) {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{template.name}</h2>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TagIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Category:</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{template.category || 'N/A'}</span>
            </div>
            
            {template.duration && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium text-gray-900">{template.duration} seconds</span>
              </div>
            )}

            <div className="pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Template Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(template.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Ready to Use</h3>
              <p className="text-sm text-blue-700 mb-4">
                This template is ready to be used for creating videos. Click below to start a new project with this template.
              </p>
              <button
                onClick={() => onUseTemplate(template)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Use This Template
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Template Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Professional video structure</li>
                <li>• Customizable merge fields</li>
                <li>• Pre-configured timeline</li>
                <li>• Asset management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
