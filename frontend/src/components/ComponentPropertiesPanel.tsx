import React from 'react';
import { ComponentProperty, ComponentSchema } from '@/lib/componentSchemas';

interface ComponentPropertiesPanelProps {
  schema: ComponentSchema;
  properties: Record<string, any>;
  onPropertyChange: (propertyId: string, value: any) => void;
}

const ComponentPropertiesPanel: React.FC<ComponentPropertiesPanelProps> = ({
  schema,
  properties,
  onPropertyChange
}) => {
  const renderProperty = (property: ComponentProperty) => {
    const value = properties[property.id] ?? property.defaultValue;

    switch (property.type) {
      case 'text':
        return (
          <div key={property.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mb-2">{property.description}</p>
            )}
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onPropertyChange(property.id, e.target.value)}
              placeholder={property.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={property.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mb-2">{property.description}</p>
            )}
            <textarea
              value={value || ''}
              onChange={(e) => onPropertyChange(property.id, e.target.value)}
              placeholder={property.placeholder}
              rows={property.rows || 3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        );

      case 'number':
        return (
          <div key={property.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mb-2">{property.description}</p>
            )}
            <input
              type="number"
              min={property.min}
              max={property.max}
              step={property.step}
              value={value || property.defaultValue || 0}
              onChange={(e) => onPropertyChange(property.id, parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        );

      case 'range':
        return (
          <div key={property.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mb-2">{property.description}</p>
            )}
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min={property.min}
                max={property.max}
                step={property.step}
                value={value || property.defaultValue || 0}
                onChange={(e) => onPropertyChange(property.id, parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
                {((value || property.defaultValue || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        );

      case 'color':
        return (
          <div key={property.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mb-2">{property.description}</p>
            )}
            <input
              type="color"
              value={value || property.defaultValue || '#000000'}
              onChange={(e) => onPropertyChange(property.id, e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
        );

      case 'select':
        return (
          <div key={property.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mb-2">{property.description}</p>
            )}
            <select
              value={value || property.defaultValue || ''}
              onChange={(e) => onPropertyChange(property.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {property.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'file':
        return (
          <div key={property.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mb-2">{property.description}</p>
            )}
            <input
              type="file"
              accept={property.accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    onPropertyChange(property.id, {
                      name: file.name,
                      data: event.target?.result as string
                    });
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = '';
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {value && (
              <div className="text-xs text-gray-500 mt-1">
                Current: {value.name || 'File uploaded'}
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={property.id} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => onPropertyChange(property.id, e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                {property.label}
                {property.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {property.description && (
              <p className="text-xs text-gray-500 mt-1">{property.description}</p>
            )}
          </div>
        );

      case 'array':
        return (
          <div key={property.id} className="mb-4">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {property.label}
                {property.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {property.description && (
                <p className="text-xs text-gray-500 mt-1">{property.description}</p>
              )}
            </div>
            
            <div className="space-y-3">
              {(value || []).map((item: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      {property.label.slice(0, -1)} {index + 1}
                    </span>
                    <button
                      onClick={() => {
                        const currentArray = value || [];
                        const newArray = currentArray.filter((_: any, i: number) => i !== index);
                        onPropertyChange(property.id, newArray);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      × Delete
                    </button>
                  </div>
                  
                  {property.arrayItemSchema && (
                    <div className="space-y-2">
                      {property.arrayItemSchema.properties?.map((subProp) => (
                        <div key={subProp.id}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {subProp.label}
                          </label>
                          {subProp.type === 'select' ? (
                            <select
                              value={item[subProp.id] || subProp.defaultValue || ''}
                              onChange={(e) => {
                                const currentArray = value || [];
                                const newArray = [...currentArray];
                                newArray[index] = { ...newArray[index], [subProp.id]: e.target.value };
                                onPropertyChange(property.id, newArray);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                              {subProp.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : subProp.type === 'textarea' ? (
                            <textarea
                              value={item[subProp.id] || ''}
                              onChange={(e) => {
                                const currentArray = value || [];
                                const newArray = [...currentArray];
                                newArray[index] = { ...newArray[index], [subProp.id]: e.target.value };
                                onPropertyChange(property.id, newArray);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              rows={subProp.rows || 2}
                            />
                          ) : (
                            <input
                              type={subProp.type === 'number' ? 'number' : 'text'}
                              value={item[subProp.id] || ''}
                              onChange={(e) => {
                                const currentArray = value || [];
                                const newArray = [...currentArray];
                                newArray[index] = { 
                                  ...newArray[index], 
                                  [subProp.id]: subProp.type === 'number' 
                                    ? parseFloat(e.target.value) || 0 
                                    : e.target.value 
                                };
                                onPropertyChange(property.id, newArray);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder={subProp.placeholder}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add button moved below the messages */}
              <button
                onClick={() => {
                  const currentArray = value || [];
                  
                  // Determine the next sender based on the last message
                  let nextSender = 'agent'; // default - agent starts the conversation
                  if (currentArray.length > 0) {
                    const lastMessage = currentArray[currentArray.length - 1];
                    // If last message was from customer, next should be agent, and vice versa
                    nextSender = lastMessage.sender === 'customer' ? 'agent' : 'customer';
                  }
                  
                  // Create new item with proper defaults from schema
                  const newItem: any = {};
                  if (property.arrayItemSchema?.properties) {
                    property.arrayItemSchema.properties.forEach((subProp) => {
                      // Override the sender with the calculated next sender
                      if (subProp.id === 'sender') {
                        newItem[subProp.id] = nextSender;
                      } else {
                        newItem[subProp.id] = subProp.defaultValue || '';
                      }
                    });
                  }
                  // Add unique ID for React key
                  newItem.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  onPropertyChange(property.id, [...currentArray, newItem]);
                }}
                className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors"
              >
                + Add {property.label.slice(0, -1)}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Component Settings</h4>
        <div className="space-y-3">
          {schema.properties.map(renderProperty)}
        </div>
      </div>
    </div>
  );
};

export default ComponentPropertiesPanel;
