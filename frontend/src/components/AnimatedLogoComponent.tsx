'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CloudArrowUpIcon, PlayIcon } from '@heroicons/react/24/outline';

interface AnimatedLogoComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (componentData: any) => void;
}

export default function AnimatedLogoComponent({ isOpen, onClose, onSave }: AnimatedLogoComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [customerLogo, setCustomerLogo] = useState<File | null>(null);
  const [customerLogoUrl, setCustomerLogoUrl] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [animationType, setAnimationType] = useState('fadeIn');
  const [duration, setDuration] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  // Salesforce logo
  const salesforceLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDA5ZWRjIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnNhbGVzZm9yY2U8L3RleHQ+Cjwvc3ZnPg==';

  useEffect(() => {
    if (customerLogo) {
      const url = URL.createObjectURL(customerLogo);
      setCustomerLogoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [customerLogo]);

  const animate = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate animation progress (0 to 1)
    const progress = Math.min((timestamp % (duration * 1000)) / (duration * 1000), 1);

    // Draw customer logo (left side) with animation
    if (customerLogoUrl) {
      const customerImg = new Image();
      customerImg.onload = () => {
        const maxWidth = 120;
        const maxHeight = 80;
        const aspectRatio = customerImg.width / customerImg.height;
        
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        const x = 50;
        const y = (canvas.height - height) / 2;
        
        // Apply animation based on type
        let alpha = 1;
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        
        switch (animationType) {
          case 'fadeIn':
            alpha = progress;
            break;
          case 'slideInLeft':
            alpha = 1;
            offsetX = -width * (1 - progress);
            break;
          case 'scaleIn':
            alpha = 1;
            scale = progress;
            break;
          case 'bounceIn':
            alpha = 1;
            scale = progress < 0.5 ? progress * 2 : 1;
            offsetY = progress < 0.5 ? -20 * (1 - progress * 2) : 0;
            break;
        }
        
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(x + width/2 + offsetX, y + height/2 + offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(customerImg, -width/2, -height/2, width, height);
        ctx.restore();
        ctx.globalAlpha = 1;
        
        // Draw Salesforce logo (right side) with delay
        const salesforceImg = new Image();
        salesforceImg.onload = () => {
          const sfAspectRatio = 2;
          const sfHeight = height;
          const sfWidth = sfHeight * sfAspectRatio;
          const sfX = canvas.width - sfWidth - 50;
          const sfY = (canvas.height - sfHeight) / 2;
          
          // Salesforce logo appears after 0.5 seconds
          const sfProgress = Math.max(0, (progress - 0.5) * 2);
          let sfAlpha = 1;
          let sfScale = 1;
          
          switch (animationType) {
            case 'fadeIn':
              sfAlpha = sfProgress;
              break;
            case 'slideInLeft':
              sfAlpha = 1;
              break;
            case 'scaleIn':
              sfAlpha = 1;
              sfScale = sfProgress;
              break;
            case 'bounceIn':
              sfAlpha = 1;
              sfScale = sfProgress < 0.5 ? sfProgress * 2 : 1;
              break;
          }
          
          ctx.globalAlpha = sfAlpha;
          ctx.save();
          ctx.translate(sfX + sfWidth/2, sfY + sfHeight/2);
          ctx.scale(sfScale, sfScale);
          ctx.drawImage(salesforceImg, -sfWidth/2, -sfHeight/2, sfWidth, sfHeight);
          ctx.restore();
          ctx.globalAlpha = 1;
        };
        salesforceImg.src = salesforceLogo;
      };
      customerImg.src = customerLogoUrl;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  const startAnimation = () => {
    setIsPlaying(true);
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }
    
    return () => stopAnimation();
  }, [isPlaying, customerLogoUrl, backgroundColor, animationType, duration]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCustomerLogo(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // For now, save as static image
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataURL = canvas.toDataURL('image/png');
      
      const componentData = {
        name: 'Animated Logo Component',
        type: 'animated_logo',
        category: 'branding',
        duration: duration,
        metadata: {
          customerLogo: customerLogoUrl,
          backgroundColor: backgroundColor,
          animationType: animationType,
          previewImage: dataURL,
          settings: {
            salesforceLogo: salesforceLogo,
            canvasWidth: 600,
            canvasHeight: 200,
            animationFrames: duration * 30 // 30 FPS
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
          <h2 className="text-2xl font-semibold text-gray-900">Animated Logo Component Builder</h2>
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                {isPlaying ? 'Stop' : 'Play'}
              </button>
            </div>
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
              <p>• Animation: {animationType}</p>
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

            {/* Animation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Animation Type
              </label>
              <select
                value={animationType}
                onChange={(e) => setAnimationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fadeIn">Fade In</option>
                <option value="slideInLeft">Slide In Left</option>
                <option value="scaleIn">Scale In</option>
                <option value="bounceIn">Bounce In</option>
              </select>
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
