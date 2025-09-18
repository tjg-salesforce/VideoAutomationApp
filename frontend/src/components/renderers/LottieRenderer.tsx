'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import lottie from 'lottie-web';
import { Component } from '@/types';

interface LottieRendererProps {
  component: Component;
  properties?: {
    backgroundColor?: string;
    customerLogo?: {
      name: string;
      data: string;
    };
    logoScale?: number;
    [key: string]: any;
  };
  currentTime: number;
  isPlaying: boolean;
  mode?: 'preview' | 'fullscreen';
  onPropertyChange?: (property: string, value: any) => void;
}

// Performance optimization: Debounce updates
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

const updateCustomerBgColor = (layers: any[], backgroundColor: string) => {
  console.log('updateCustomerBgColor called with:', backgroundColor);
  layers.forEach(layer => {
    console.log('Checking layer:', layer.nm, 'type:', layer.ty);
    // Check if this layer is "CustomerBg"
    if (layer.nm === 'CustomerBg') {
      console.log('Found CustomerBg layer, updating color to:', backgroundColor);
      if (backgroundColor === 'transparent') {
        layer.ks.o.k = 0;
      } else {
        layer.ks.o.k = 100;
        if (layer.shapes) {
          layer.shapes.forEach((shape: any) => {
            // Check if it's a group shape (gr) with items
            if (shape.ty === 'gr' && shape.it) {
              shape.it.forEach((item: any) => {
                if (item.ty === 'fl' && item.c) {
                  const rgb = hexToRgb(backgroundColor);
                  if (rgb) {
                    console.log('Updating group shape color from', item.c.k, 'to', [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1]);
                    item.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
                  }
                }
              });
            }
            // Also check direct fill shapes
            else if (shape.ty === 'fl' && shape.c) {
              const rgb = hexToRgb(backgroundColor);
              if (rgb) {
                console.log('Updating direct shape color from', shape.c.k, 'to', [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1]);
                shape.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
              }
            }
          });
        }
      }
    }
    
    // Recursively search nested layers
    if (layer.layers) {
      updateCustomerBgColor(layer.layers, backgroundColor);
    }
  });
};

const updateCustomerLogo = (layers: any[], customerLogo: any, logoScale: number = 1, assets: any[]) => {
  // Update the asset first - be more careful about asset structure
  if (customerLogo && customerLogo.data) {
    const logoAsset = assets.find(asset => asset.id === '1'); // Customer logo asset ID
    if (logoAsset) {
      console.log('Updating logo asset with new data');
      // Ensure the asset has the right structure
      logoAsset.p = customerLogo.data;
      // Make sure it's marked as an image asset
      if (!logoAsset.ty) {
        logoAsset.ty = 2; // Image asset type
      }
    } else {
      console.log('Logo asset not found! Available assets:', assets.map(a => a.id));
    }
  }

  layers.forEach(layer => {
    if (layer.nm === 'CustomerLogo') {
      console.log('Found CustomerLogo layer, updating scale to:', logoScale);
      // Update scale - handle animated keyframes properly
      if (logoScale && layer.ks && layer.ks.s) {
        try {
          // Check if it's animated keyframes (array of keyframe objects)
          if (Array.isArray(layer.ks.s.k) && layer.ks.s.k.length > 0 && typeof layer.ks.s.k[0] === 'object') {
            // Animated scale - update each keyframe
            layer.ks.s.k.forEach((keyframe: any, index: number) => {
              if (keyframe && keyframe.s && Array.isArray(keyframe.s) && keyframe.s.length >= 2) {
                const originalScaleX = keyframe.s[0] || 100;
                const originalScaleY = keyframe.s[1] || 100;
                const avgOriginalScale = (originalScaleX + originalScaleY) / 2;
                const newScale = Math.max(0, avgOriginalScale * logoScale);
                keyframe.s = [newScale, newScale];
                console.log(`Updated animated scale keyframe ${index} to:`, keyframe.s);
              }
            });
          } else if (Array.isArray(layer.ks.s.k) && layer.ks.s.k.length >= 2 && typeof layer.ks.s.k[0] === 'number') {
            // Static scale - direct array
            const originalScaleX = layer.ks.s.k[0] || 100;
            const originalScaleY = layer.ks.s.k[1] || 100;
            const avgOriginalScale = (originalScaleX + originalScaleY) / 2;
            const newScale = Math.max(0, avgOriginalScale * logoScale);
            layer.ks.s.k = [newScale, newScale];
            console.log('Updated static scale to:', layer.ks.s.k);
          }
        } catch (error) {
          console.error('Error updating logo scale:', error);
        }
      }
    }
    if (layer.layers) {
      updateCustomerLogo(layer.layers, customerLogo, logoScale, assets);
    }
  });
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export default function LottieRenderer({ 
  component, 
  properties = {}, 
  currentTime, 
  isPlaying, 
  mode = 'preview',
  onPropertyChange 
}: LottieRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieInstanceRef = useRef<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);

  // Load Lottie data once
  useEffect(() => {
    const loadLottieData = async () => {
      try {
        const response = await fetch('/CustomerLogoSplit.json');
        const data = await response.json();
        setLottieData(data);
      } catch (error) {
        console.error('Error loading Lottie data:', error);
      }
    };

    loadLottieData();
  }, []);

  // Initialize and update Lottie instance
  useEffect(() => {
    if (!lottieData || !containerRef.current) return;

    // Clean up existing instance
    if (lottieInstanceRef.current) {
      lottieInstanceRef.current.destroy();
    }

    // Create updated data
    const updatedData = JSON.parse(JSON.stringify(lottieData));
    
    // Update background color
    const bgColor = properties.backgroundColor || '#184cb4';
    updateCustomerBgColor(updatedData.layers, bgColor);
    
    // Update customer logo
    if (properties.customerLogo && properties.customerLogo.data) {
      updateCustomerLogo(updatedData.layers, properties.customerLogo, properties.logoScale, updatedData.assets);
    }

    // Create new instance
    lottieInstanceRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData: updatedData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: true,
        hideOnTransparent: false
      }
    });

    // Set initial frame
    lottieInstanceRef.current.goToAndStop(0, true);

    return () => {
      if (lottieInstanceRef.current) {
        lottieInstanceRef.current.destroy();
        lottieInstanceRef.current = null;
      }
    };
  }, [lottieData, properties.backgroundColor, properties.customerLogo, properties.logoScale]);

  // Handle playback
  useEffect(() => {
    if (!lottieInstanceRef.current) return;

    if (isPlaying) {
      lottieInstanceRef.current.play();
    } else {
      lottieInstanceRef.current.pause();
    }
  }, [isPlaying]);

  // Handle current time changes with smooth scrubbing
  useEffect(() => {
    if (!lottieInstanceRef.current) return;

    const totalFrames = lottieInstanceRef.current.totalFrames;
    const frame = (currentTime / 5) * totalFrames; // Assuming 5 second duration
    lottieInstanceRef.current.goToAndStop(Math.min(frame, totalFrames - 1), true);
  }, [currentTime]);

  if (!lottieData) {
    return (
      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading animation...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${mode === 'preview' ? 'rounded-lg' : ''}`}
      style={{ 
        width: '100%', 
        height: '100%'
      }}
    />
  );
}
