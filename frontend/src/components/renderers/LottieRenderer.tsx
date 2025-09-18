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
  layers.forEach(layer => {
    // Check if this layer is "CustomerBg"
    if (layer.nm === 'CustomerBg') {
      if (backgroundColor === 'transparent') {
        layer.ks.o.k = 0;
      } else {
        layer.ks.o.k = 100;
        if (layer.shapes) {
          layer.shapes.forEach((shape: any) => {
            if (shape.ty === 'fl' && shape.c) {
              const rgb = hexToRgb(backgroundColor);
              if (rgb) {
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

const updateCustomerLogo = (layers: any[], customerLogo: any, logoScale: number = 1) => {
  layers.forEach(layer => {
    if (layer.nm === 'CustomerLogo') {
      // Update asset reference
      // Note: This would need to be handled by the parent component
      // as we can't modify assets directly here
      
      // Update scale
      if (logoScale && layer.ks && layer.ks.s) {
        if (Array.isArray(layer.ks.s.k)) {
          // Static scale
          const originalScaleX = layer.ks.s.k[0];
          const originalScaleY = layer.ks.s.k[1];
          const avgOriginalScale = (originalScaleX + originalScaleY) / 2;
          const newScale = avgOriginalScale * logoScale;
          layer.ks.s.k = [newScale, newScale];
        } else if (layer.ks.s.k && layer.ks.s.k.length > 0) {
          // Animated scale
          layer.ks.s.k.forEach((keyframe: any) => {
            if (keyframe.s && keyframe.s.length >= 2) {
              const originalScaleX = keyframe.s[0];
              const originalScaleY = keyframe.s[1];
              const avgOriginalScale = (originalScaleX + originalScaleY) / 2;
              const newScale = avgOriginalScale * logoScale;
              keyframe.s = [newScale, newScale];
            }
          });
        }
      }
    }
    if (layer.layers) {
      updateCustomerLogo(layer.layers, customerLogo, logoScale);
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
      updateCustomerLogo(updatedData.layers, properties.customerLogo, properties.logoScale);
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
