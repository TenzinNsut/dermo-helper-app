import { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

type CapacitorCameraHookReturn = {
  capturedImage: string | null;
  isLoading: boolean;
  error: string | null;
  takePicture: () => Promise<void>;
  selectFromGallery: () => Promise<void>;
  resetImage: () => void;
};

export function useCapacitorCamera(): CapacitorCameraHookReturn {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const takePicture = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1200,
        height: 1200,
        correctOrientation: true,
        preserveAspectRatio: true
      });
      
      if (image.dataUrl) {
        console.log('Camera image captured successfully');
        setCapturedImage(image.dataUrl);
      } else {
        console.error('No dataUrl in camera result');
        setError('Could not process the captured image');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error taking photo:', err);
      setError('Could not take photo. Please ensure camera permissions are granted.');
      setIsLoading(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1200,
        height: 1200,
        correctOrientation: true,
        preserveAspectRatio: true
      });
      
      if (image.dataUrl) {
        console.log('Gallery image selected successfully');
        setCapturedImage(image.dataUrl);
      } else {
        console.error('No dataUrl in gallery result');
        setError('Could not process the selected image');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error selecting from gallery:', err);
      setError('Could not select photo from gallery.');
      setIsLoading(false);
    }
  };

  const resetImage = () => {
    setCapturedImage(null);
  };

  return {
    capturedImage,
    isLoading,
    error,
    takePicture,
    selectFromGallery,
    resetImage
  };
}
