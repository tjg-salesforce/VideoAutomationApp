'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export default function PreviewModal({
  isOpen,
  onClose,
  isPlaying,
  onPlayPause
}: PreviewModalProps) {
  const [showControls, setShowControls] = useState(true);
  const [mouseTimeout, setMouseTimeout] = useState<NodeJS.Timeout | null>(null);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-transparent overflow-hidden z-70"
      onMouseMove={handleMouseMove}
    >
      {/* Close button */}
      {showControls && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          style={{ zIndex: 9999 }}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      )}

      {/* Center play/pause button */}
      {showControls && (
        <button
          onClick={onPlayPause}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          style={{ zIndex: 9999 }}
        >
          {isPlaying ? (
            <PauseIcon className="h-12 w-12" />
          ) : (
            <PlayIcon className="h-12 w-12" />
          )}
        </button>
      )}
    </div>
  );
}