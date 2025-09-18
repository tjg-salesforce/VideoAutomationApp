'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CloudArrowUpIcon, EyeIcon } from '@heroicons/react/24/outline';

interface LogoBlendComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (componentData: any) => void;
}

export default function LogoBlendComponent({ isOpen, onClose, onSave }: LogoBlendComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [customerLogo, setCustomerLogo] = useState<File | null>(null);
  const [customerLogoUrl, setCustomerLogoUrl] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [blendMode, setBlendMode] = useState('multiply');
  const [opacity, setOpacity] = useState(0.8);
  const [duration, setDuration] = useState(3);
  const [loading, setLoading] = useState(false);

  // Salesforce logo (base64 encoded for demo)
  const salesforceLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDA5ZWRjIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnNhbGVzZm9yY2U8L3RleHQ+Cjwvc3ZnPg==';

  useEffect(() => {
    if (customerLogo) {
      const url = URL.createObjectURL(customerLogo);
      setCustomerLogoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [customerLogo]);

  useEffect(() => {
    drawCanvas();
  }, [customerLogoUrl, backgroundColor, blendMode, opacity]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw customer logo (left side) if available
    if (customerLogoUrl) {
      const customerImg = new Image();
      customerImg.onload = () => {
        // Calculate aspect ratio and size for customer logo
        const maxWidth = 120;
        const maxHeight = 80;
        const aspectRatio = customerImg.width / customerImg.height;
        
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        
        // If height exceeds max, scale down by height
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        // Center vertically and position on left
        const x = 50;
        const y = (canvas.height - height) / 2;
        
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
        ctx.drawImage(customerImg, x, y, width, height);
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        
        // Draw Salesforce logo (right side)
        const salesforceImg = new Image();
        salesforceImg.onload = () => {
          ctx.globalAlpha = 0.9;
          // Calculate size for Salesforce logo to match customer logo height
          const sfAspectRatio = 2; // 200x100
          const sfHeight = height;
          const sfWidth = sfHeight * sfAspectRatio;
          const sfX = canvas.width - sfWidth - 50;
          const sfY = (canvas.height - sfHeight) / 2;
          
          ctx.drawImage(salesforceImg, sfX, sfY, sfWidth, sfHeight);
        };
        salesforceImg.src = salesforceLogo;
      };
      customerImg.src = customerLogoUrl;
    } else {
      // Draw Salesforce logo (right side) only
      const salesforceImg = new Image();
      salesforceImg.onload = () => {
        ctx.globalAlpha = 0.9;
        const sfHeight = 80;
        const sfWidth = sfHeight * 2; // 2:1 aspect ratio
        const sfX = canvas.width - sfWidth - 50;
        const sfY = (canvas.height - sfHeight) / 2;
        
        ctx.drawImage(salesforceImg, sfX, sfY, sfWidth, sfHeight);
      };
      salesforceImg.src = salesforceLogo;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCustomerLogo(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert canvas to base64
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataURL = canvas.toDataURL('image/png');
      
      // Create component data
      const componentData = {
        name: 'Logo Blend Component',
        type: 'logo_blend',
        category: 'branding',
        duration: duration,
        metadata: {
          customerLogo: customerLogoUrl,
          backgroundColor: backgroundColor,
          blendMode: blendMode,
          opacity: opacity,
          previewImage: dataURL,
          settings: {
            salesforceLogo: salesforceLogo,
            canvasWidth: 400,
            canvasHeight: 200
          }
        }
      };

      onSave(componentData);
      onClose();
    } catch (error) {
      console.error('Error saving component:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Logo Blend Component Builder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Canvas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <canvas
                ref={canvasRef}
                className="w-full h-48 border border-gray-200 rounded"
                style={{ maxWidth: '600px', maxHeight: '200px' }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>• Left: Your customer logo</p>
              <p>• Right: Salesforce logo</p>
              <p>• Duration: {duration} seconds</p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Logo
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Upload Logo
                </label>
                {customerLogo && (
                  <span className="text-sm text-green-600">
                    ✓ {customerLogo.name}
                  </span>
                )}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Blend Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blend Mode
              </label>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="multiply">Multiply</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
                <option value="hard-light">Hard Light</option>
                <option value="color-burn">Color Burn</option>
                <option value="color-dodge">Color Dodge</option>
              </select>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Logo Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={loading || !customerLogo}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Component'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
