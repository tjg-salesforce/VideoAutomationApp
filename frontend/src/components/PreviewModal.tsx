'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/outline';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  hideCloseButton?: boolean;
  currentTime?: number;
  totalDuration?: number;
  onSeek?: (time: number) => void;
  onSkipBackward?: () => void;
  onSkipForward?: () => void;
}

export default function PreviewModal({
  isOpen,
  onClose,
  isPlaying,
  onPlayPause,
  hideCloseButton = false,
  currentTime = 0,
  totalDuration = 0,
  onSeek,
  onSkipBackward,
  onSkipForward
}: PreviewModalProps) {
  const [showControls, setShowControls] = useState(true);
  const [mouseTimeout, setMouseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle timeline scrubber click and drag
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || totalDuration === 0 || isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * totalDuration;
    
    onSeek(Math.max(0, Math.min(newTime, totalDuration)));
  };

  // Handle mouse down on timeline scrubber
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || totalDuration === 0) return;
    
    setIsDragging(true);
    setShowControls(true); // Keep controls visible while dragging
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * totalDuration;
    
    onSeek(Math.max(0, Math.min(newTime, totalDuration)));
  };

  // Handle mouse move during drag
  const handleTimelineMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !onSeek || totalDuration === 0 || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = mouseX / rect.width;
    const newTime = percentage * totalDuration;
    
    onSeek(Math.max(0, Math.min(newTime, totalDuration)));
  }, [isDragging, onSeek, totalDuration]);

  // Handle mouse up to end drag
  const handleTimelineMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse tracking for controls visibility
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (mouseTimeout) {
      clearTimeout(mouseTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 2000);
    
    setMouseTimeout(timeout);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mouseTimeout) {
        clearTimeout(mouseTimeout);
      }
    };
  }, [mouseTimeout]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle global mouse events for timeline dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleTimelineMouseMove);
      document.addEventListener('mouseup', handleTimelineMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleTimelineMouseMove);
        document.removeEventListener('mouseup', handleTimelineMouseUp);
      };
    }
  }, [isDragging, handleTimelineMouseMove, handleTimelineMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-transparent overflow-hidden z-70"
      onMouseMove={handleMouseMove}
    >
      {/* Close button */}
      {showControls && !hideCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-red-500 bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-all"
          style={{ zIndex: 9999 }}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      )}

      {/* Center play/pause button - 2x larger */}
      {showControls && (
        <button
          onClick={onPlayPause}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          style={{ zIndex: 9999 }}
        >
          {isPlaying ? (
            <PauseIcon className="h-24 w-24" />
          ) : (
            <PlayIcon className="h-24 w-24" />
          )}
        </button>
      )}

      {/* Skip backward button */}
      {showControls && onSkipBackward && (
        <button
          onClick={onSkipBackward}
          className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all flex flex-col items-center justify-center"
          style={{ zIndex: 9999 }}
          title="Skip back 10 seconds"
        >
          <BackwardIcon className="h-5 w-5" />
          <span className="text-xs mt-0.5">10s</span>
        </button>
      )}

      {/* Skip forward button */}
      {showControls && onSkipForward && (
        <button
          onClick={onSkipForward}
          className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all flex flex-col items-center justify-center"
          style={{ zIndex: 9999 }}
          title="Skip forward 10 seconds"
        >
          <ForwardIcon className="h-5 w-5" />
          <span className="text-xs mt-0.5">10s</span>
        </button>
      )}

      {/* Timeline scrubber at bottom */}
      {showControls && onSeek && totalDuration > 0 && (
        <div className="absolute bottom-8 left-8 right-8" style={{ zIndex: 9999 }}>
          <div className="flex items-center space-x-4">
            {/* Current time */}
            <div className="text-white text-sm font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
              {formatTime(currentTime)}
            </div>
            
            {/* Timeline scrubber */}
            <div 
              ref={timelineRef}
              className="timeline-scrubber flex-1 h-2 bg-gray-600 bg-opacity-50 rounded-full cursor-pointer hover:bg-opacity-70 transition-all select-none"
              onClick={handleTimelineClick}
              onMouseDown={handleTimelineMouseDown}
            >
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>
            
            {/* Total duration */}
            <div className="text-white text-sm font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
              {formatTime(totalDuration)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}