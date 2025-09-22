import React, { useState } from 'react';
import { ComponentSchema, componentSchemas } from '@/lib/componentSchemas';

interface ComponentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onComponentCreated: (component: ComponentSchema) => void;
}

const ComponentCreator: React.FC<ComponentCreatorProps> = ({
  isOpen,
  onClose,
  onComponentCreated
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  if (!isOpen) return null;

  const handleCreateComponent = () => {
    if (!selectedType) return;
    
    const baseSchema = componentSchemas[selectedType];
    if (!baseSchema) return;

    const customSchema: ComponentSchema = {
      ...baseSchema,
      name: customName || baseSchema.name,
      description: customDescription || baseSchema.description
    };

    onComponentCreated(customSchema);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Create New Component</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Component Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Component Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(componentSchemas).map((schema) => (
                <div
                  key={schema.type}
                  onClick={() => setSelectedType(schema.type)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedType === schema.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{schema.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{schema.description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Category: {schema.category} • Duration: {schema.duration}s
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Name (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter custom name for this component instance"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Custom Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Description (Optional)
            </label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Enter custom description for this component instance"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Component Preview */}
          {selectedType && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Component Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Type:</strong> {componentSchemas[selectedType]?.type}</p>
                  <p><strong>Name:</strong> {customName || componentSchemas[selectedType]?.name}</p>
                  <p><strong>Description:</strong> {customDescription || componentSchemas[selectedType]?.description}</p>
                  <p><strong>Properties:</strong> {componentSchemas[selectedType]?.properties.length} configurable properties</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateComponent}
            disabled={!selectedType}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create Component
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentCreator;
