
import { useState, useEffect, useRef } from 'react';

type CameraOptions = {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
};

type CameraHookReturn = {
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoading: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCameraFacing: () => void;
  capturePhoto: () => string | null;
};

export function useDeviceCamera(options: CameraOptions = {}): CameraHookReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(options.facingMode || 'environment');

  const getConstraints = () => {
    return {
      audio: false,
      video: {
        facingMode: facingMode,
        width: options.width || { ideal: 1280 },
        height: options.height || { ideal: 720 },
      },
    };
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop any existing stream
      if (streamRef.current) {
        stopCamera();
      }
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(getConstraints());
      streamRef.current = stream;
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsLoading(false);
      return;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure camera permissions are granted.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCameraFacing = () => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  };
  
  const capturePhoto = (): string | null => {
    if (!videoRef.current) return null;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL - using JPEG for better compression
    return canvas.toDataURL('image/jpeg', 0.92);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  // Restart camera when facing mode changes
  useEffect(() => {
    if (streamRef.current) {
      startCamera();
    }
  }, [facingMode]);

  return {
    videoRef,
    isLoading,
    error,
    startCamera,
    stopCamera,
    switchCameraFacing,
    capturePhoto
  };
}
