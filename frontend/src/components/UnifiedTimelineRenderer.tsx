import React from 'react';
import { TimelineItem } from '@/types/timeline';
import { getAssetDefinition } from '@/lib/assetRegistry';
import ComponentRenderer from './ComponentRenderer';

interface UnifiedTimelineRendererProps {
  item: TimelineItem;
  currentTime: number;
  isPlaying: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

const UnifiedTimelineRenderer: React.FC<UnifiedTimelineRendererProps> = ({
  item,
  currentTime,
  isPlaying,
  onPropertyChange
}) => {
  const assetDef = getAssetDefinition(item.assetType);
  
  if (!assetDef) {
    return (
      <div className="w-full h-full bg-red-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-800">
          <p className="text-lg font-medium">Unknown Asset Type</p>
          <p className="text-sm">No renderer found for: {item.assetType}</p>
        </div>
      </div>
    );
  }

  // Render based on asset type
  switch (assetDef.type) {
    case 'component':
      return (
        <ComponentRenderer
          component={{
            id: item.asset.id,
            name: item.asset.name,
            type: item.assetType,
            category: assetDef.category,
            duration: item.duration,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: item.asset.metadata
          }}
          properties={item.properties}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPropertyChange={onPropertyChange}
        />
      );

    case 'media':
      if (item.assetType === 'video') {
        return (
          <video
            src={item.asset.data}
            className="w-full h-full object-contain rounded-lg"
            style={{
              transform: `translate(${item.properties.x || 0}px, ${item.properties.y || 0}px) scale(${item.properties.scale || 1}) rotate(${item.properties.rotation || 0}deg)`,
              opacity: item.properties.opacity || 1
            }}
            muted
            loop
          />
        );
      } else if (item.assetType === 'image') {
        return (
          <img
            src={item.asset.data}
            alt={item.asset.name}
            className="w-full h-full object-contain rounded-lg"
            style={{
              transform: `translate(${item.properties.x || 0}px, ${item.properties.y || 0}px) scale(${item.properties.scale || 1}) rotate(${item.properties.rotation || 0}deg)`,
              opacity: item.properties.opacity || 1
            }}
          />
        );
      }
      break;

    case 'effect':
      // Effects would be applied as CSS or overlay
      return (
        <div 
          className="w-full h-full absolute inset-0 pointer-events-none"
          style={{
            opacity: item.properties.opacity || 1,
            // Effect-specific styles would go here
          }}
        />
      );

    case 'text':
      return (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${item.properties.x || 0}px, ${item.properties.y || 0}px) scale(${item.properties.scale || 1}) rotate(${item.properties.rotation || 0}deg)`,
            opacity: item.properties.opacity || 1
          }}
        >
          <span 
            className="text-white font-bold"
            style={{
              fontSize: item.properties.fontSize || '24px',
              color: item.properties.color || '#ffffff',
              textAlign: item.properties.align || 'center'
            }}
          >
            {item.properties.text || 'Sample Text'}
          </span>
        </div>
      );

    case 'audio':
      return (
        <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-blue-800">
            <p className="text-lg font-medium">Audio Track</p>
            <p className="text-sm">{item.asset.name}</p>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Unsupported Asset Type</p>
            <p className="text-sm">{item.assetType}</p>
          </div>
        </div>
      );
  }

  return null;
};

export default UnifiedTimelineRenderer;
