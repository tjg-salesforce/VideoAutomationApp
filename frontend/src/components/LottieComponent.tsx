'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PlayIcon, CogIcon } from '@heroicons/react/24/outline';
import lottie from 'lottie-web';

interface CustomerLogoSplitProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (componentData: any) => void;
}

export default function CustomerLogoSplit({ isOpen, onClose, onSave }: CustomerLogoSplitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieInstanceRef = useRef<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(3);
  const [speed, setSpeed] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [mergeFields, setMergeFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load the CustomerLogoSplit.json file on component mount
  useEffect(() => {
    const loadCustomerLogoSplit = async () => {
      try {
        const response = await fetch('/CustomerLogoSplit.json');
        const data = await response.json();
        setLottieData(data);
        console.log('CustomerLogoSplit.json loaded successfully:', data);
      } catch (error) {
        console.error('Error loading CustomerLogoSplit.json:', error);
      }
    };

    loadCustomerLogoSplit();
  }, []);

  // Function to update the CustomerBg layer color
  const updateCustomerBgColor = (lottieData: any, color: string) => {
    if (!lottieData || !lottieData.layers) return lottieData;

    // Convert hex color to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Create a deep copy of the lottie data
    const updatedData = JSON.parse(JSON.stringify(lottieData));

    // Find and update CustomerBg layers
    const updateLayerColor = (layers: any[]) => {
      layers.forEach(layer => {
        if (layer.nm === 'CustomerBg') {
          // Update the layer's color properties
          if (layer.shapes) {
            layer.shapes.forEach((shape: any) => {
              if (shape.ty === 'gr' && shape.it) {
                shape.it.forEach((item: any) => {
                  if (item.ty === 'fl' && item.c) {
                    // Update fill color
                    item.c.k = [r, g, b, 1];
                  }
                });
              }
            });
          }
        }
        // Recursively check nested layers
        if (layer.layers) {
          updateLayerColor(layer.layers);
        }
      });
    };

    updateLayerColor(updatedData.layers);
    return updatedData;
  };

  const loadLottieAnimation = () => {
    if (!lottieData || !containerRef.current) return;

    // Destroy existing animation
    if (lottieInstanceRef.current) {
      lottieInstanceRef.current.destroy();
    }

    // Update the lottie data with the current background color
    const updatedLottieData = updateCustomerBgColor(lottieData, backgroundColor);

    // Create new Lottie animation
    lottieInstanceRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData: updatedLottieData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: true,
        progressiveLoad: false,
        hideOnTransparent: false
      }
    });

    // Set speed
    lottieInstanceRef.current.setSpeed(speed);
  };

  useEffect(() => {
    loadLottieAnimation();
  }, [lottieData, speed, backgroundColor]);

  useEffect(() => {
    if (lottieInstanceRef.current) {
      if (isPlaying) {
        lottieInstanceRef.current.play();
      } else {
        lottieInstanceRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (lottieInstanceRef.current) {
        lottieInstanceRef.current.destroy();
      }
    };
  }, []);


  const handleSave = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataURL = canvas.toDataURL('image/png');
      
      const componentData = {
        name: 'Customer Logo Split',
        type: 'customer_logo_split',
        category: 'animation',
        duration: duration,
        metadata: {
          lottieData: lottieData,
          backgroundColor: backgroundColor,
          mergeFields: mergeFields,
          previewImage: dataURL,
          settings: {
            frameRate: lottieData?.fr || 100,
            width: lottieData?.w || 1920,
            height: lottieData?.h || 1080,
            totalFrames: lottieData ? lottieData.op - lottieData.ip : 300,
            speed: speed
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
          <h2 className="text-2xl font-semibold text-gray-900">Customer Logo Split</h2>
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
              <h3 className="text-lg font-medium text-gray-900">Animation Preview</h3>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                {isPlaying ? 'Stop' : 'Play'}
              </button>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <div
                ref={containerRef}
                className="w-full h-48 border border-gray-200 rounded"
                style={{ 
                  maxWidth: '600px', 
                  maxHeight: '200px',
                  backgroundColor: backgroundColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!lottieData && (
                  <div className="text-center text-gray-500">
                    <CogIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Loading Customer Logo Split...</p>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Customer Logo Split Animation</p>
              <p>• Real-time preview</p>
              <p>• Background color controls CustomerBg layer</p>
              <p>• Duration: {duration} seconds</p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color (Controls CustomerBg Layer)
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
              <p className="text-xs text-gray-500 mt-1">
                This color will be applied to the CustomerBg layer in the animation
              </p>
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speed: {speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
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

            {/* Merge Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merge Fields
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Text to replace"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Replacement text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={loading || !lottieData}
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
