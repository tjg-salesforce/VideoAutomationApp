'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PlayIcon, StopIcon, CogIcon } from '@heroicons/react/24/outline';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState('#184cb4');
  const [customerLogo, setCustomerLogo] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Load the CustomerLogoSplit.json file on component mount
  useEffect(() => {
    const loadCustomerLogoSplit = async () => {
      try {
        const response = await fetch('/CustomerLogoSplit.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLottieData(data);
      } catch (error) {
        console.error('Error loading CustomerLogoSplit.json:', error);
      }
    };

    if (isOpen) {
      loadCustomerLogoSplit();
    }
  }, [isOpen]);

  // Function to update the CustomerBg layer color
  const updateCustomerBgColor = (lottieData: any, color: string) => {
    if (!lottieData || !lottieData.layers) return lottieData;

    // Create a deep copy of the lottie data
    const updatedData = JSON.parse(JSON.stringify(lottieData));

    // Handle transparent background
    if (color === 'transparent') {
      // Find and hide CustomerBg layers
      const updateLayerColor = (layers: any[]) => {
        layers.forEach(layer => {
          if (layer.nm === 'CustomerBg') {
            // Hide the layer by setting opacity to 0
            if (layer.ks && layer.ks.o) {
              layer.ks.o.k = 0;
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
    }

    // Convert hex color to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Find and update CustomerBg layers
    const updateLayerColor = (layers: any[]) => {
      layers.forEach(layer => {
        if (layer.nm === 'CustomerBg') {
          // Show the layer by setting opacity to 100
          if (layer.ks && layer.ks.o) {
            layer.ks.o.k = 100;
          }
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

  // Function to update the CustomerLogo layer with uploaded image
  // This function ensures the uploaded logo scales properly without cropping
  // by maintaining aspect ratio and scaling both the logo and its circular constraint
  const updateCustomerLogo = (lottieData: any, logoUrl: string, scale: number) => {
    if (!lottieData || !lottieData.layers || !logoUrl) return lottieData;

    // Create a deep copy of the lottie data
    const updatedData = JSON.parse(JSON.stringify(lottieData));

    // Find and update CustomerLogo layers and their circular constraint
    const updateLayerLogo = (layers: any[]) => {
      layers.forEach(layer => {
        if (layer.nm === 'CustomerLogo') {
          // Update the layer's transform properties
          if (layer.ks && layer.ks.s) {
            // Handle animated scale property
            if (Array.isArray(layer.ks.s.k)) {
              // It's animated, update all keyframes
              layer.ks.s.k.forEach((keyframe: any) => {
                if (keyframe.s && Array.isArray(keyframe.s)) {
                  const originalScaleX = keyframe.s[0];
                  const originalScaleY = keyframe.s[1];
                  
                  // For the first keyframe (usually [0,0]), keep it as is
                  // For other keyframes, scale proportionally
                  if (originalScaleX === 0 && originalScaleY === 0) {
                    // Keep the initial keyframe as [0,0] for the animation effect
                    keyframe.s[0] = 0;
                    keyframe.s[1] = 0;
                  } else {
                    // For non-zero keyframes, scale proportionally
                    // Use the maximum of both dimensions to ensure the logo fits within the circle
                    // This prevents cropping by ensuring the larger dimension determines the scale
                    const maxOriginalScale = Math.max(originalScaleX, originalScaleY);
                    const newScale = Math.max(0, maxOriginalScale * scale); // Ensure scale is never negative
                    
                    // Apply the same scale to both dimensions to maintain aspect ratio
                    keyframe.s[0] = newScale;
                    keyframe.s[1] = newScale;
                  }
                }
              });
            } else {
              // It's a static value - preserve aspect ratio
              const currentScale = layer.ks.s.k || [100, 100, 100];
              // Use the maximum of both dimensions to ensure the logo fits within the circle
              const maxOriginalScale = Math.max(currentScale[0], currentScale[1]);
              const newScale = Math.max(0, maxOriginalScale * scale); // Ensure scale is never negative
              layer.ks.s.k = [newScale, newScale, 100];
            }
          }
          
          // Update asset reference if it exists
          if (layer.refId) {
            // Find the asset and update its path
            if (updatedData.assets) {
              updatedData.assets.forEach((asset: any) => {
                if (asset.id === layer.refId) {
                  asset.p = logoUrl;
                }
              });
            }
          }
        }
        
        // Keep the WhiteCircleCustomer layer (circular constraint) at original size
        // Only scale the CustomerLogo layer, not the circle container
        
        // Recursively check nested layers
        if (layer.layers) {
          updateLayerLogo(layer.layers);
        }
      });
    };

    updateLayerLogo(updatedData.layers);
    return updatedData;
  };

  // Handle file upload for customer logo
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomerLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadLottieAnimation = (preserveFramePosition = false) => {
    if (!lottieData || !containerRef.current) {
      return;
    }

    // Store current frame position if we want to preserve it
    const currentFramePosition = preserveFramePosition && lottieInstanceRef.current 
      ? lottieInstanceRef.current.currentFrame 
      : 0;

    // Destroy existing animation
    if (lottieInstanceRef.current) {
      lottieInstanceRef.current.destroy();
    }

    // Update the lottie data with the current background color and logo
    let updatedLottieData = updateCustomerBgColor(lottieData, backgroundColor);
    if (customerLogo) {
      updatedLottieData = updateCustomerLogo(updatedLottieData, customerLogo, logoScale);
    }

      // Remove watermark metadata and layers
      if (updatedLottieData.metadata) {
        // Remove generator info that's clearly from Lottie Lab
        if (updatedLottieData.metadata.generator && 
            updatedLottieData.metadata.generator.toLowerCase().includes('lottie lab')) {
          delete updatedLottieData.metadata.generator;
        }
        if (updatedLottieData.metadata.author && 
            updatedLottieData.metadata.author.toLowerCase().includes('lottie lab')) {
          delete updatedLottieData.metadata.author;
        }
      }

      // Remove watermark layers conservatively - only remove obvious watermarks
      const removeWatermarkLayers = (layers: any[]): any[] => {
        return layers.filter(layer => {
          // Only remove layers that are clearly watermarks
          const isWatermark = layer.nm && (
            layer.nm.toLowerCase().includes('watermark') ||
            layer.nm.toLowerCase().includes('made with lottie') ||
            layer.nm.toLowerCase().includes('lottie lab') ||
            layer.nm.toLowerCase().includes('credit') ||
            layer.nm.toLowerCase().includes('powered by lottie') ||
            layer.nm.toLowerCase().includes('created with lottie')
          );

          // Check if it's a text layer with watermark content
          const isTextWatermark = layer.ty === 5 && layer.t?.d?.k?.[0]?.s?.t && (
            layer.t.d.k[0].s.t.toLowerCase().includes('made with lottie') ||
            layer.t.d.k[0].s.t.toLowerCase().includes('lottie lab') ||
            layer.t.d.k[0].s.t.toLowerCase().includes('powered by lottie') ||
            layer.t.d.k[0].s.t.toLowerCase().includes('created with lottie')
          );

          // Recursively check nested layers
          if (layer.layers) {
            layer.layers = removeWatermarkLayers(layer.layers);
          }

          return !isWatermark && !isTextWatermark;
        });
      };

      // Apply watermark removal to layers
      if (updatedLottieData.layers) {
        updatedLottieData.layers = removeWatermarkLayers(updatedLottieData.layers);
      }

      // Remove watermark assets conservatively
      if (updatedLottieData.assets) {
        updatedLottieData.assets = updatedLottieData.assets.filter((asset: any) => 
          !asset.p || !(
            asset.p.toLowerCase().includes('watermark') ||
            asset.p.toLowerCase().includes('lottie lab') ||
            asset.p.toLowerCase().includes('credit') ||
            asset.p.toLowerCase().includes('powered by lottie') ||
            asset.p.toLowerCase().includes('created with lottie')
          )
        );
      }

    // Create new Lottie animation
    try {
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
      
      // Set up event listeners
      if (lottieInstanceRef.current) {
        lottieInstanceRef.current.addEventListener('complete', () => {
          setIsPlaying(false);
        });
        
        lottieInstanceRef.current.addEventListener('loopComplete', () => {
          setIsPlaying(false);
        });
        
        lottieInstanceRef.current.addEventListener('enterFrame', () => {
          if (lottieInstanceRef.current) {
            setCurrentFrame(Math.round(lottieInstanceRef.current.currentFrame));
          }
        });
        
        // Ensure we show the first frame
        lottieInstanceRef.current.goToAndStop(0, true);
        setTotalFrames(lottieInstanceRef.current.totalFrames);
        setCurrentFrame(0);
      }
      
    } catch (error) {
      console.error('Error creating Lottie animation:', error);
    }

    // Disable watermark if possible
    if (lottieInstanceRef.current && lottieInstanceRef.current.renderer) {
      lottieInstanceRef.current.renderer.renderConfig = {
        ...lottieInstanceRef.current.renderer.renderConfig,
        hideOnTransparent: false,
        clearCanvas: true
      };
    }


    // Set speed
    lottieInstanceRef.current.setSpeed(speed);

    // Set total frames
    setTotalFrames(lottieInstanceRef.current.totalFrames);

    // Restore frame position if preserving
    if (preserveFramePosition && currentFramePosition > 0) {
      lottieInstanceRef.current.goToAndStop(currentFramePosition, true);
      setCurrentFrame(Math.floor(currentFramePosition));
    } else {
      setCurrentFrame(0);
    }

    // Add event listeners for animation state
    lottieInstanceRef.current.addEventListener('complete', () => {
      setIsPlaying(false);
    });

    lottieInstanceRef.current.addEventListener('loopComplete', () => {
      setIsPlaying(false);
    });

    // Add frame update listener for scrubbing
    lottieInstanceRef.current.addEventListener('enterFrame', () => {
      if (!isDragging) {
        setCurrentFrame(Math.floor(lottieInstanceRef.current.currentFrame));
      }
    });
  };

  useEffect(() => {
    if (lottieData) {
      loadLottieAnimation();
    }
  }, [lottieData, speed]);

  // Preserve frame position when making changes (logo upload, bg color, logo size)
  useEffect(() => {
    if (lottieInstanceRef.current) {
      loadLottieAnimation(true);
    }
  }, [backgroundColor, customerLogo, logoScale]);

  // Ensure animation shows first frame on load
  useEffect(() => {
    if (lottieInstanceRef.current && totalFrames > 0) {
      lottieInstanceRef.current.goToAndStop(0, true);
      setCurrentFrame(0);
    }
  }, [totalFrames]);

  // Initialize animation when component opens
  useEffect(() => {
    if (isOpen && lottieData && containerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        loadLottieAnimation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, lottieData]);

  useEffect(() => {
    if (lottieInstanceRef.current) {
      if (isPlaying) {
        lottieInstanceRef.current.play();
      } else {
        lottieInstanceRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle play/stop toggle with replay functionality
  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (lottieInstanceRef.current) {
        lottieInstanceRef.current.pause();
      }
    } else {
      // If animation is complete, restart it
      if (lottieInstanceRef.current && lottieInstanceRef.current.currentFrame >= lottieInstanceRef.current.totalFrames - 1) {
        lottieInstanceRef.current.goToAndStop(0, true);
        setCurrentFrame(0);
      }
      setIsPlaying(true);
    }
  };

  // Handle timeline scrubbing
  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value);
    setCurrentFrame(frame);
    if (lottieInstanceRef.current) {
      lottieInstanceRef.current.goToAndStop(frame, true);
    }
  };

  // Handle timeline drag start
  const handleTimelineMouseDown = () => {
    setIsDragging(true);
    setIsPlaying(false);
    if (lottieInstanceRef.current) {
      lottieInstanceRef.current.pause();
    }
  };

  // Handle timeline drag end
  const handleTimelineMouseUp = () => {
    setIsDragging(false);
  };

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
        metadata: {
          lottieData: lottieData,
          backgroundColor: backgroundColor,
          customerLogo: customerLogo,
          logoScale: logoScale,
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col h-screen">
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-2xl font-semibold text-gray-900">Customer Logo Split</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col bg-gray-100 min-h-0">
          {/* Preview Controls */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayToggle}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isPlaying ? (
                  <>
                    <StopIcon className="h-5 w-5 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Play
                  </>
                )}
              </button>
              <div className="text-sm text-gray-600">
                Frame: {currentFrame} / {totalFrames}
              </div>
            </div>
          </div>

          {/* Preview Canvas - Responsive 16:9 aspect ratio */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <div className="w-full h-full flex items-center justify-center">
              <div 
                className="relative w-full h-full max-w-full max-h-full"
                style={{ aspectRatio: '16/9' }}
              >
                {/* Transparent background checker pattern */}
                {backgroundColor === 'transparent' && (
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #ccc 75%), 
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                )}
                <div
                  ref={containerRef}
                  className="w-full h-full relative z-10"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent'
                  }}
                >
                  {!lottieData && (
                    <div className="text-center text-gray-500">
                      <CogIcon className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg">Loading Customer Logo Split...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Scrubber - Pinned at bottom */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Timeline Scrubber
                </label>
                <div className="text-sm text-gray-600">
                  {Math.round((currentFrame / (totalFrames - 1)) * 100)}%
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={totalFrames - 1}
                  value={currentFrame}
                  onChange={handleTimelineChange}
                  onMouseDown={handleTimelineMouseDown}
                  onMouseUp={handleTimelineMouseUp}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentFrame / (totalFrames - 1)) * 100}%, #e5e7eb ${(currentFrame / (totalFrames - 1)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Start</span>
                  <span>End</span>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500">
                Drag to scrub through the animation
              </div>
            </div>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color (Controls CustomerBg Layer)
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    value={backgroundColor === 'transparent' ? '#184cb4' : backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm flex-1"
                    placeholder="Enter color or 'transparent'"
                  />
                </div>
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

            {/* Customer Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Logo (Replaces CustomerLogo Layer)
              </label>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  {customerLogo ? 'Change Logo' : 'Upload Logo'}
                </button>
                {customerLogo && (
                  <div className="text-sm text-green-600">
                    ✓ Logo uploaded successfully
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload an image to replace the CustomerLogo layer in the animation
              </p>
            </div>

            {/* Logo Scale */}
            {customerLogo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Size: {Math.round(logoScale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={logoScale}
                  onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Adjust the size of the uploaded logo
                </p>
              </div>
            )}

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
