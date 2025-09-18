'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlayIcon, PauseIcon, TrashIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Project, Component, TimelineItem } from '@/types';
import { apiEndpoints } from '@/lib/api';
import ComponentRenderer from '@/components/ComponentRenderer';
import lottie from 'lottie-web';

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<Component | null>(null);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm' | 'mov'>('mp4');
  const [hasAlphaChannel, setHasAlphaChannel] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [lottieData, setLottieData] = useState<any>(null);
  
  // Component properties state
  const [componentProperties, setComponentProperties] = useState<{[key: string]: any}>({});
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProject();
    loadComponents();
    loadLottieData();
  }, [projectId]);

  const loadLottieData = async () => {
    try {
      const response = await fetch('/CustomerLogoSplit.json');
      const data = await response.json();
      setLottieData(data);
    } catch (error) {
      console.error('Error loading Lottie data:', error);
    }
  };

  useEffect(() => {
    if (project) {
      setTimeline(project.timeline || []);
      calculateTotalDuration(project.timeline || []);
    }
  }, [project]);

  const loadProject = async () => {
    try {
      const response = await apiEndpoints.getProject(projectId);
      const projectData = response.data.data;
      setProject(projectData);
      
      // Restore component properties if they exist
      if (projectData.componentProperties) {
        setComponentProperties(projectData.componentProperties);
      } else if (projectData.timeline) {
        // Extract properties from timeline items if they exist
        const properties: { [key: string]: any } = {};
        projectData.timeline.forEach((item: any) => {
          if (item.properties) {
            properties[item.component.id] = item.properties;
          }
        });
        setComponentProperties(properties);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadComponents = async () => {
    try {
      const response = await apiEndpoints.getComponents();
      setComponents(response.data.data || []);
    } catch (error) {
      console.error('Error loading components:', error);
    }
  };

  const calculateTotalDuration = (timelineItems: TimelineItem[]) => {
    const maxEndTime = Math.max(...timelineItems.map(item => item.start_time + item.duration), 0);
    setTotalDuration(maxEndTime);
  };

  const handleDragStart = (e: React.DragEvent, component: Component) => {
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedComponent) return;

    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const x = e.clientX - timelineRect.left;
    const timePerPixel = totalDuration / timelineRect.width;
    const startTime = Math.max(0, Math.min(totalDuration, x * timePerPixel));

    const newItem: TimelineItem = {
      id: `timeline_${Date.now()}`,
      component_id: draggedComponent.id,
      component: draggedComponent,
      start_time: startTime,
      duration: draggedComponent.duration || 5,
      order: timeline.length
    };

    // Set default properties for the component
    setComponentProperties(prev => ({
      ...prev,
      [draggedComponent.id]: {
        backgroundColor: '#184cb4', // Default blue background
        logoScale: 1,
        customerLogo: null
      }
    }));

    const newTimeline = [...timeline, newItem].sort((a, b) => a.start_time - b.start_time);
    setTimeline(newTimeline);
    calculateTotalDuration(newTimeline);
    setDraggedComponent(null);
  };

  const removeFromTimeline = (itemId: string) => {
    const newTimeline = timeline.filter(item => item.id !== itemId);
    setTimeline(newTimeline);
    calculateTotalDuration(newTimeline);
    if (selectedTimelineItem?.id === itemId) {
      setSelectedTimelineItem(null);
    }
  };

  const updateTimelineItem = (itemId: string, updates: Partial<TimelineItem>) => {
    const newTimeline = timeline.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ).sort((a, b) => a.start_time - b.start_time);
    setTimeline(newTimeline);
    calculateTotalDuration(newTimeline);
    
    // Update selected item if it's the one being modified
    if (selectedTimelineItem?.id === itemId) {
      setSelectedTimelineItem({ ...selectedTimelineItem, ...updates });
    }
  };

  const saveProject = async () => {
    if (!project) return;

    setLoading(true);
    try {
      // Include component properties in the timeline items
      const timelineWithProperties = timeline.map(item => ({
        ...item,
        properties: componentProperties[item.component.id] || {}
      }));

      const projectData = {
        name: project.name,
        description: project.description,
        timeline: timelineWithProperties,
        status: 'in_progress'
      };
      
      console.log('Saving project with data:', projectData);
      await apiEndpoints.updateProject(project.id, projectData);
      
      // Refresh project data
      await loadProject();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to create and configure a Lottie instance for video rendering
  const createVideoLottieInstance = (lottieData: any, properties: any) => {
    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Helper function to update background color
    const updateCustomerBgColor = (layers: any[], backgroundColor: string) => {
      layers.forEach(layer => {
        if (layer.nm === 'CustomerBg') {
          if (backgroundColor === 'transparent') {
            layer.ks.o.k = 0;
          } else {
            layer.ks.o.k = 100;
            if (layer.shapes) {
              layer.shapes.forEach((shape: any) => {
                if (shape.ty === 'gr' && shape.it) {
                  shape.it.forEach((item: any) => {
                    if (item.ty === 'fl' && item.c) {
                      const rgb = hexToRgb(backgroundColor);
                      if (rgb) {
                        item.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
                      }
                    }
                  });
                } else if (shape.ty === 'fl' && shape.c) {
                  const rgb = hexToRgb(backgroundColor);
                  if (rgb) {
                    shape.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
                  }
                }
              });
            }
          }
        }
        if (layer.layers) {
          updateCustomerBgColor(layer.layers, backgroundColor);
        }
      });
    };

    // Apply properties to the Lottie data
    const updatedData = JSON.parse(JSON.stringify(lottieData));
    
    // Update background color
    if (properties.backgroundColor) {
      updateCustomerBgColor(updatedData.layers, properties.backgroundColor);
    }

    // Update logo if provided
    if (properties.customerLogo && properties.customerLogo.data) {
      const logoAsset = updatedData.assets.find((asset: any) => asset.id === '1');
      if (logoAsset) {
        logoAsset.p = properties.customerLogo.data;
      }
    }

    // Create a hidden container for the Lottie instance
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1920px';
    container.style.height = '1080px';
    container.style.visibility = 'visible'; // Make visible for initialization
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    // Create Lottie instance
    console.log('Creating Lottie instance for video rendering with data:', {
      width: updatedData.w,
      height: updatedData.h,
      frames: updatedData.op - updatedData.ip,
      containerSize: `${container.offsetWidth}x${container.offsetHeight}`
    });
    
    const lottieInstance = lottie.loadAnimation({
      container: container,
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

    // Force render the first frame to ensure canvas is populated
    lottieInstance.addEventListener('DOMLoaded', () => {
      console.log('Lottie DOM loaded, forcing first frame render');
      lottieInstance.goToAndStop(0, true);
      
      // Check if canvas has content after forcing render
      setTimeout(() => {
        console.log('Checking Lottie renderer after DOMLoaded:', {
          hasRenderer: !!lottieInstance.renderer,
          rendererType: lottieInstance.renderer?.type,
          hasCanvas: !!lottieInstance.renderer?.canvas,
          canvasSize: lottieInstance.renderer?.canvas ? `${lottieInstance.renderer.canvas.width}x${lottieInstance.renderer.canvas.height}` : 'N/A',
          rendererKeys: lottieInstance.renderer ? Object.keys(lottieInstance.renderer) : 'N/A'
        });
        
        const canvas = lottieInstance.renderer?.canvas;
        if (canvas) {
          const testCtx = canvas.getContext('2d');
          const imageData = testCtx.getImageData(0, 0, Math.min(10, canvas.width), Math.min(10, canvas.height));
          const hasContent = imageData.data.some(pixel => pixel !== 0);
          console.log('Canvas content check after forced render:', hasContent);
        } else {
          console.warn('Canvas not available after DOMLoaded event');
        }
      }, 100);
    });

    // Add more debugging events
    lottieInstance.addEventListener('error', (error) => {
      console.error('Lottie instance error:', error);
    });

    lottieInstance.addEventListener('complete', () => {
      console.log('Lottie animation complete');
    });

    lottieInstance.addEventListener('loopComplete', () => {
      console.log('Lottie loop complete');
    });

    // Add debugging
    lottieInstance.addEventListener('DOMLoaded', () => {
      // Use setTimeout to ensure renderer is fully initialized
      setTimeout(() => {
        if (lottieInstance.renderer && lottieInstance.renderer.canvas) {
          console.log('Lottie instance loaded for video rendering, canvas size:', lottieInstance.renderer.canvas.width, 'x', lottieInstance.renderer.canvas.height);
        } else {
          console.log('Lottie instance loaded for video rendering, but renderer not ready yet');
        }
      }, 50);
    });

    lottieInstance.addEventListener('data_ready', () => {
      console.log('Lottie data ready for video rendering');
    });

    // Debug renderer immediately after creation
    setTimeout(() => {
      console.log('Immediate renderer check after Lottie creation:', {
        hasInstance: !!lottieInstance,
        hasRenderer: !!lottieInstance.renderer,
        rendererType: lottieInstance.renderer?.type,
        hasCanvas: !!lottieInstance.renderer?.canvas,
        canvasSize: lottieInstance.renderer?.canvas ? `${lottieInstance.renderer.canvas.width}x${lottieInstance.renderer.canvas.height}` : 'N/A',
        rendererKeys: lottieInstance.renderer ? Object.keys(lottieInstance.renderer) : 'N/A'
      });
    }, 50);

    return { lottieInstance, container };
  };

  const downloadVideo = async () => {
    if (timeline.length === 0) {
      alert('No components in timeline to render');
      return;
    }

    setIsRendering(true);
    try {
      console.log('Starting video rendering...');
      
      // Create a high-resolution canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Set up MediaRecorder for video capture
      const stream = canvas.captureStream(60); // 60fps for smoother video
      
      // Determine MIME type based on user selection and browser support
      let mimeType = 'video/webm;codecs=vp8';
      let fileExtension = 'webm';
      
      if (videoFormat === 'mp4') {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          mimeType = 'video/mp4;codecs=h264';
          fileExtension = 'mp4';
          console.log('Using MP4 H.264 format');
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
          fileExtension = 'mp4';
          console.log('Using MP4 format (no codec specified)');
        } else {
          console.log('MP4 not supported, falling back to WebM');
          mimeType = 'video/webm;codecs=vp8';
          fileExtension = 'webm';
        }
      } else if (videoFormat === 'mov') {
        // MOV is not directly supported by MediaRecorder, so we'll use MP4 and rename
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          mimeType = 'video/mp4;codecs=h264';
          fileExtension = 'mov';
          console.log('Using MP4 H.264 format for MOV export');
        } else {
          console.log('MP4 not supported for MOV, falling back to WebM');
          mimeType = 'video/webm;codecs=vp8';
          fileExtension = 'webm';
        }
      } else { // webm
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
          fileExtension = 'webm';
          console.log('Using WebM VP9 format');
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
          fileExtension = 'webm';
          console.log('Using WebM VP8 format');
        } else {
          console.log('WebM not supported, using fallback');
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name || 'video'}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRendering(false);
        console.log(`Video rendering complete! Format: ${mimeType}, Extension: ${fileExtension}`);
      };

      // Start recording
      mediaRecorder.start();
      console.log('MediaRecorder started');

      // Pre-load all images for synchronous rendering
      const imagePromises: Promise<HTMLImageElement>[] = [];
      const loadedImages: { [key: string]: HTMLImageElement } = {};
      
      timeline.forEach(item => {
        const properties = componentProperties[item.component.id] || {};
        if (properties.customerLogo && properties.customerLogo.data) {
          const img = new Image();
          const promise = new Promise<HTMLImageElement>((resolve) => {
            img.onload = () => resolve(img);
            img.src = properties.customerLogo.data;
          });
          imagePromises.push(promise);
          loadedImages[item.component.id] = img;
        }
      });

      // Wait for all images to load before starting video rendering
      Promise.all(imagePromises).then(() => {
        // Check if Lottie data is loaded
        if (!lottieData) {
          console.error('Lottie data not loaded, cannot render video');
          alert('Animation data not loaded. Please refresh and try again.');
          setIsRendering(false);
          return;
        }

        console.log('Starting video rendering with Lottie data:', {
          width: lottieData.w,
          height: lottieData.h,
          frames: lottieData.op - lottieData.ip,
          layers: lottieData.layers?.length || 0
        });

        // Create Lottie instances for each component that needs them
        const lottieInstances: { [key: string]: { lottieInstance: any, container: HTMLElement } } = {};
        
        timeline.forEach(item => {
          if (item.component.type === 'customer_logo_split' && lottieData) {
            const properties = componentProperties[item.component.id] || {};
            const { lottieInstance, container } = createVideoLottieInstance(lottieData, properties);
            lottieInstances[item.component.id] = { lottieInstance, container };
          }
        });

        // Wait for all Lottie instances to be ready
        const lottieReadyPromises = Object.values(lottieInstances).map(({ lottieInstance, container }, index) => {
          return new Promise<void>((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait time
            
            const checkReady = () => {
              attempts++;
              console.log(`Checking Lottie instance ${index + 1}, attempt ${attempts}/${maxAttempts}`);

              // Simple check - just see if the instance exists and has a renderer
              const isReady = lottieInstance && lottieInstance.renderer;

              if (isReady) {
                console.log(`Lottie instance ${index + 1} ready`);
                console.log('Renderer details:', {
                  hasRenderer: !!lottieInstance.renderer,
                  rendererType: lottieInstance.renderer?.type,
                  hasCanvas: !!lottieInstance.renderer?.canvas,
                  canvasSize: lottieInstance.renderer?.canvas ? `${lottieInstance.renderer.canvas.width}x${lottieInstance.renderer.canvas.height}` : 'N/A',
                  rendererKeys: lottieInstance.renderer ? Object.keys(lottieInstance.renderer) : 'N/A'
                });
                resolve();
              } else if (attempts >= maxAttempts) {
                console.error(`Lottie instance ${index + 1} failed to initialize after ${maxAttempts} attempts`);
                console.log('Lottie instance state:', {
                  hasInstance: !!lottieInstance,
                  hasRenderer: !!(lottieInstance && lottieInstance.renderer),
                  containerSize: `${container.offsetWidth}x${container.offsetHeight}`
                });
                reject(new Error(`Lottie instance ${index + 1} failed to initialize`));
              } else {
                console.log(`Lottie instance ${index + 1} not ready yet, checking again...`);
                setTimeout(checkReady, 100);
              }
            };
            
            // Start checking immediately
            checkReady();
          });
        });

        Promise.all(lottieReadyPromises).then(() => {
          // Add a delay to ensure Lottie instances are fully rendered
          setTimeout(() => {
            console.log('Starting frame-by-frame rendering...');
            // Render timeline components frame by frame
            const fps = 60; // Match the capture stream fps
            const frameDuration = 1000 / fps; // ms per frame
            let currentFrame = 0;
            const totalFrames = Math.ceil(totalDuration * fps);

          const renderFrame = () => {
            if (currentFrame >= totalFrames) {
              // Clean up Lottie instances
              Object.values(lottieInstances).forEach(({ lottieInstance, container }) => {
                lottieInstance.destroy();
                document.body.removeChild(container);
              });
              mediaRecorder.stop();
              return;
            }

            const currentTime = (currentFrame / fps);
            const currentItem = timeline.find(item => 
              currentTime >= item.start_time && currentTime < item.start_time + item.duration
            );

            // Clear canvas
            if (hasAlphaChannel) {
              // Transparent background for alpha channel
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
              // White background for standard video
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (currentItem) {
              // Render the current component
              const component = currentItem.component;
              const properties = componentProperties[component.id] || {};
              
              // Set background color (only if not using alpha channel)
              if (!hasAlphaChannel) {
                ctx.fillStyle = properties.backgroundColor || '#184cb4';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              
              // For Lottie components, render the actual animation
              if (component.type === 'customer_logo_split' && lottieInstances[component.id]) {
                const { lottieInstance } = lottieInstances[component.id];
                
                // Check if Lottie instance is fully ready
                if (!lottieInstance || !lottieInstance.renderer) {
                  console.warn(`Lottie instance not ready for component ${component.id}`);
                  // Draw a placeholder to indicate the issue
                  ctx.fillStyle = '#ff0000';
                  ctx.font = '48px Arial';
                  ctx.textAlign = 'center';
                  ctx.fillText(`Lottie Not Ready: ${component.name}`, canvas.width / 2, canvas.height / 2);
                } else {
                  // Calculate the frame number within the Lottie animation
                  const progress = Math.min(1, (currentTime - currentItem.start_time) / currentItem.duration);
                  const lottieFrame = Math.floor(progress * (lottieData.op - lottieData.ip)); // op = out point, ip = in point
                  
                  // Go to the specific frame
                  lottieInstance.goToAndStop(lottieFrame, true);
                  
                  // Force a render first to ensure canvas is populated
                  // Note: Lottie doesn't have a direct render() method, goToAndStop should trigger rendering
                  
                  // Try multiple ways to get the canvas
                  let lottieCanvas = lottieInstance.renderer.canvas;
                  
                  // If canvas is not available through renderer, try to find it in the container
                  if (!lottieCanvas) {
                    const container = lottieInstance.renderer.element;
                    lottieCanvas = container?.querySelector('canvas');
                  }
                  
                  // If still not found, try to find it in the renderer element
                  if (!lottieCanvas && lottieInstance.renderer.element) {
                    lottieCanvas = lottieInstance.renderer.element.querySelector('canvas');
                  }
                  
                  // Debug the renderer state
                  console.log(`Frame ${lottieFrame} - Renderer state:`, {
                    hasRenderer: !!lottieInstance.renderer,
                    rendererType: lottieInstance.renderer?.type,
                    hasCanvas: !!lottieCanvas,
                    canvasSize: lottieCanvas ? `${lottieCanvas.width}x${lottieCanvas.height}` : 'N/A',
                    rendererKeys: lottieInstance.renderer ? Object.keys(lottieInstance.renderer) : 'N/A',
                    rendererCanvas: lottieInstance.renderer?.canvas,
                    rendererElement: lottieInstance.renderer?.element
                  });
                  
                  if (lottieCanvas && lottieCanvas.width > 0 && lottieCanvas.height > 0) {
                    console.log(`Drawing Lottie frame ${lottieFrame} at time ${currentTime}, canvas size: ${lottieCanvas.width}x${lottieCanvas.height}`);

                    try {
                      ctx.drawImage(lottieCanvas, 0, 0, canvas.width, canvas.height);
                      console.log(`Successfully drew Lottie canvas for frame ${lottieFrame}`);
                    } catch (error) {
                      console.error(`Error drawing Lottie canvas:`, error);
                      // Draw a placeholder to indicate the issue
                      ctx.fillStyle = '#ff0000';
                      ctx.font = '48px Arial';
                      ctx.textAlign = 'center';
                      ctx.fillText(`Draw Error: ${component.name}`, canvas.width / 2, canvas.height / 2);
                    }
                  } else {
                    console.warn(`Lottie canvas not ready for component ${component.id}, frame ${lottieFrame}, canvas:`, lottieCanvas);
                    // Draw a placeholder to indicate the issue
                    ctx.fillStyle = '#ff0000';
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Lottie Error: ${component.name}`, canvas.width / 2, canvas.height / 2);
                  }
                }
              } else {
                // For other component types, render a placeholder
                ctx.fillStyle = '#ffffff';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(component.name, canvas.width / 2, canvas.height / 2);
              }
            }

            currentFrame++;
            // Use requestAnimationFrame for smoother timing, but cap at our target fps
            setTimeout(() => {
              requestAnimationFrame(renderFrame);
            }, Math.max(0, frameDuration - 16)); // 16ms is ~60fps, so we don't go faster than that
          };

          // Start rendering
          renderFrame();
          }, 500); // 500ms delay to ensure Lottie instances are ready
        }).catch((error) => {
          console.error('Failed to initialize Lottie instances:', error);
          alert('Failed to initialize animation. Please try again.');
          setIsRendering(false);
        });
      });

    } catch (error) {
      console.error('Error rendering video:', error);
      setIsRendering(false);
      alert('Error rendering video. Please try again.');
    }
  };

  const getCurrentComponent = () => {
    // Find the component that should be playing at current time
    const currentItem = timeline.find(item => 
      currentTime >= item.start_time && currentTime < item.start_time + item.duration
    );
    return currentItem?.component || null;
  };

  const getCurrentTimelineItem = () => {
    // Find the timeline item that should be playing at current time
    const currentItem = timeline.find(item => 
      currentTime >= item.start_time && currentTime < item.start_time + item.duration
    );
    
    // If no current item but we have components in timeline, show the last component
    if (!currentItem && timeline.length > 0) {
      return timeline[timeline.length - 1];
    }
    
    return currentItem || null;
  };

  const handlePlayPause = () => {
    if (timeline.length === 0) {
      // No components in timeline, can't play
      return;
    }

    if (isPlaying) {
      // Pause
      if (playbackInterval) {
        clearInterval(playbackInterval);
        setPlaybackInterval(null);
      }
      setIsPlaying(false);
    } else {
      // If we're at the end, reset to beginning
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
      }
      
      // Play
      setIsPlaying(true);
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.033; // Update every 33ms (~30fps)
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            clearInterval(interval);
            setPlaybackInterval(null);
            return totalDuration;
          }
          return newTime;
        });
      }, 33);
      setPlaybackInterval(interval);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDownloadModal(true)}
            disabled={isRendering || timeline.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {isRendering ? 'Rendering...' : 'Download Video'}
          </button>
          <button
            onClick={saveProject}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-100">
            <div className="w-full h-full max-w-6xl" style={{ aspectRatio: '16/9' }}>
              {getCurrentTimelineItem() ? (
                <ComponentRenderer
                  component={getCurrentTimelineItem()!.component}
                  properties={componentProperties[getCurrentTimelineItem()!.component.id] || {}}
                  currentTime={Math.min(
                    currentTime - getCurrentTimelineItem()!.start_time,
                    getCurrentTimelineItem()!.duration
                  )}
                  isPlaying={isPlaying && currentTime < getCurrentTimelineItem()!.start_time + getCurrentTimelineItem()!.duration}
                  mode="preview"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PlayIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No components in timeline</p>
                    <p className="text-sm">Drag components from the sidebar to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  disabled={timeline.length === 0}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    timeline.length === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <PauseIcon className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Play
                    </>
                  )}
                </button>
                <div className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Total Duration: {formatTime(totalDuration)}
              </div>
            </div>
            
            {/* Timeline Scrubber */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={totalDuration}
                step="0.033"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / totalDuration) * 100}%, #e5e7eb ${(currentTime / totalDuration) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Timeline Tracks */}
            <div 
              ref={timelineRef}
              className="h-24 border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-x-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex space-x-2 h-full">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedTimelineItem(item);
                      setShowComponentLibrary(false);
                    }}
                    className={`min-w-32 h-full rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedTimelineItem?.id === item.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    }`}
                    style={{
                      width: `${(item.duration / totalDuration) * 100}%`,
                      minWidth: '120px'
                    }}
                  >
                    <div className="text-sm font-medium truncate">{item.component.name}</div>
                    <div className="text-xs opacity-75">
                      {formatTime(item.start_time)} - {formatTime(item.start_time + item.duration)}
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>Drag components here to add them to the timeline</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Component Library & Properties Sidebar */}
        <div className="w-80 border-l border-gray-200 overflow-y-auto bg-white">
          <div className="p-6">
            {/* Toggle between Component Library and Properties */}
            <div className="flex mb-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowComponentLibrary(true);
                  setSelectedTimelineItem(null);
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  showComponentLibrary
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Components
              </button>
              <button
                onClick={() => setShowComponentLibrary(false)}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  !showComponentLibrary
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Properties
              </button>
            </div>

            {showComponentLibrary ? (
              // Component Library
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Components</h3>
                
                <div className="space-y-2">
                  {components.map((component) => (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, component)}
                      className="p-4 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{component.name}</h4>
                      <p className="text-sm text-gray-500">{component.type}</p>
                      <p className="text-xs text-gray-400 mt-1">{component.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedTimelineItem ? (
              // Component Properties Panel
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedTimelineItem.component.name} Properties
                </h3>
                
                <div className="space-y-4">
                  {/* Component Properties */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Component Settings</h4>
                    <div className="space-y-3">
                      {/* Logo Upload - First */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Logo Upload
                        </label>
                        <input
                          key={`file-input-${selectedTimelineItem.component.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const newProps = {
                                  ...componentProperties,
                                  [selectedTimelineItem.component.id]: {
                                    ...componentProperties[selectedTimelineItem.component.id],
                                    customerLogo: {
                                      name: file.name,
                                      data: event.target?.result as string
                                    }
                                  }
                                };
                                setComponentProperties(newProps);
                              };
                              reader.readAsDataURL(file);
                            }
                            // Reset the input value to allow re-uploading the same file
                            e.target.value = '';
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        {componentProperties[selectedTimelineItem.component.id]?.customerLogo && (
                          <div className="text-xs text-gray-500 mt-1">
                            Current: {componentProperties[selectedTimelineItem.component.id].customerLogo.name}
                          </div>
                        )}
                      </div>

                      {/* Background Color - Second */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={componentProperties[selectedTimelineItem.component.id]?.backgroundColor || '#184cb4'}
                          onChange={(e) => {
                            const newProps = {
                              ...componentProperties,
                              [selectedTimelineItem.component.id]: {
                                ...componentProperties[selectedTimelineItem.component.id],
                                backgroundColor: e.target.value
                              }
                            };
                            setComponentProperties(newProps);
                          }}
                          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                      </div>
                      
                      {/* Logo Scale - Third */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Logo Scale
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="2"
                          step="0.1"
                          value={componentProperties[selectedTimelineItem.component.id]?.logoScale || 1}
                          onChange={(e) => {
                            const newProps = {
                              ...componentProperties,
                              [selectedTimelineItem.component.id]: {
                                ...componentProperties[selectedTimelineItem.component.id],
                                logoScale: parseFloat(e.target.value)
                              }
                            };
                            setComponentProperties(newProps);
                          }}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">
                          {componentProperties[selectedTimelineItem.component.id]?.logoScale || 1}x
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromTimeline(selectedTimelineItem.id)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Remove from Timeline
                  </button>
                </div>
              </div>
            ) : (
              // No selection
              <div className="text-center text-gray-500 py-8">
                <p>Select a component from the timeline to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Video</h3>
            
            <div className="space-y-4">
              {/* Video Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Format
                </label>
                <select
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value as 'mp4' | 'webm' | 'mov')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={isRendering}
                >
                  <option value="mp4">MP4 (H.264) - Most Compatible</option>
                  <option value="webm">WebM (VP9) - Web Optimized</option>
                  <option value="mov">MOV (H.264) - Professional</option>
                </select>
              </div>

              {/* Alpha Channel Option */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasAlphaChannel}
                    onChange={(e) => setHasAlphaChannel(e.target.checked)}
                    disabled={isRendering}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Transparent Background (Alpha Channel)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {hasAlphaChannel 
                    ? 'Video will have transparent background - ideal for overlays'
                    : 'Video will have solid background color'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                disabled={isRendering}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  downloadVideo();
                }}
                disabled={isRendering || timeline.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRendering ? 'Rendering...' : `Download ${videoFormat.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
