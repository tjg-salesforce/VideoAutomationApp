'use client';

import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Template } from '@/types';

interface DeleteTemplateModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteTemplateModal({ template, isOpen, onClose, onConfirm }: DeleteTemplateModalProps) {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Delete Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-start space-x-3 mb-6">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Are you sure you want to delete "{template.name}"?
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone. The template will be permanently removed.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete Template
          </button>
        </div>
      </div>
    </div>
  );
}
