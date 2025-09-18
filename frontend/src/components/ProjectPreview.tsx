'use client';

import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { Component } from '@/types';

interface ProjectPreviewProps {
  component: Component;
  properties?: {
    backgroundColor?: string;
    customerLogo?: {
      name: string;
      data: string;
    };
    logoScale?: number;
  };
  currentTime: number;
  isPlaying: boolean;
}

export default function ProjectPreview({ 
  component, 
  properties = {}, 
  currentTime, 
  isPlaying 
}: ProjectPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieInstanceRef = useRef<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);

  // Load the Lottie data
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

  // Update component properties in Lottie data
  const updateLottieData = (data: any, props: any) => {
    if (!data) return data;
    
    const updatedData = JSON.parse(JSON.stringify(data)); // Deep copy

    // Update background color
    if (props.backgroundColor) {
      const updateCustomerBgColor = (layers: any[]) => {
        layers.forEach(layer => {
          if (layer.nm === 'CustomerBg') {
            if (props.backgroundColor === 'transparent') {
              layer.ks.o.k = 0;
            } else {
              layer.ks.o.k = 100;
              if (layer.shapes) {
                layer.shapes.forEach((shape: any) => {
                  if (shape.ty === 'fl' && shape.c) {
                    const rgb = hexToRgb(props.backgroundColor);
                    if (rgb) {
                      shape.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
                    }
                  }
                });
              }
            }
          }
          if (layer.layers) {
            updateCustomerBgColor(layer.layers);
          }
        });
      };

      updateCustomerBgColor(updatedData.layers);
    }

    // Update customer logo
    if (props.customerLogo && props.customerLogo.data) {
      const updateCustomerLogo = (layers: any[]) => {
        layers.forEach(layer => {
          if (layer.nm === 'CustomerLogo') {
            // Update asset reference
            if (updatedData.assets) {
              updatedData.assets.forEach((asset: any) => {
                if (asset.id === layer.refId) {
                  asset.p = props.customerLogo.data;
                }
              });
            }

            // Update scale
            if (props.logoScale && layer.ks && layer.ks.s) {
              if (Array.isArray(layer.ks.s.k)) {
                // Static scale
                const originalScaleX = layer.ks.s.k[0];
                const originalScaleY = layer.ks.s.k[1];
                const avgOriginalScale = (originalScaleX + originalScaleY) / 2;
                const newScale = avgOriginalScale * props.logoScale;
                layer.ks.s.k = [newScale, newScale];
              } else if (layer.ks.s.k && layer.ks.s.k.length > 0) {
                // Animated scale
                layer.ks.s.k.forEach((keyframe: any) => {
                  if (keyframe.s && keyframe.s.length >= 2) {
                    const originalScaleX = keyframe.s[0];
                    const originalScaleY = keyframe.s[1];
                    const avgOriginalScale = (originalScaleX + originalScaleY) / 2;
                    const newScale = avgOriginalScale * props.logoScale;
                    keyframe.s = [newScale, newScale];
                  }
                });
              }
            }
          }
          if (layer.layers) {
            updateCustomerLogo(layer.layers);
          }
        });
      };

      updateCustomerLogo(updatedData.layers);
    }

    return updatedData;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Load and update Lottie animation
  useEffect(() => {
    if (!lottieData || !containerRef.current) return;

    // Clean up existing instance
    if (lottieInstanceRef.current) {
      lottieInstanceRef.current.destroy();
    }

    // Update Lottie data with properties
    const updatedLottieData = updateLottieData(lottieData, properties);

    // Create new Lottie instance
    lottieInstanceRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData: updatedLottieData,
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
      }
    };
  }, [lottieData, properties]);

  // Handle playback
  useEffect(() => {
    if (!lottieInstanceRef.current) return;

    if (isPlaying) {
      lottieInstanceRef.current.play();
    } else {
      lottieInstanceRef.current.pause();
    }
  }, [isPlaying]);

  // Handle current time changes
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
    <div className="w-full h-full bg-gray-200 rounded-lg relative overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      />
    </div>
  );
}
