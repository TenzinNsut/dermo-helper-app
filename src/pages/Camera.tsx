
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, CheckCircle, X } from 'lucide-react';
import Layout from '@/components/Layout';
import ActionButton from '@/components/ActionButton';
import { useDeviceCamera } from '@/hooks/useDeviceCamera';
import ImagePreview from '@/components/ImagePreview';

const CameraPage: React.FC = () => {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const {
    videoRef,
    isLoading,
    error,
    startCamera,
    stopCamera,
    switchCameraFacing,
    capturePhoto
  } = useDeviceCamera({ facingMode: 'environment' });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleCapture = () => {
    const image = capturePhoto();
    if (image) {
      setCapturedImage(image);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      navigate('/results', { state: { imageData: capturedImage } });
    }
  };

  return (
    <Layout hideHeader fullHeight className="p-0 justify-between">
      <div className="absolute top-0 left-0 w-full z-10">
        <div className="p-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 focus-ring"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          
          {!capturedImage && (
            <button 
              onClick={switchCameraFacing}
              className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 focus-ring"
              aria-label="Switch camera"
              disabled={isLoading}
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {error ? (
          <div className="text-center p-6 bg-destructive/10 rounded-lg max-w-sm mx-auto">
            <p className="text-destructive mb-4">{error}</p>
            <ActionButton onClick={() => startCamera()}>
              Try Again
            </ActionButton>
          </div>
        ) : capturedImage ? (
          <div className="w-full h-full">
            <ImagePreview src={capturedImage} className="w-full h-full" />
          </div>
        ) : (
          <div className="relative w-full h-full bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
              </div>
            )}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="p-6 bg-background">
        {capturedImage ? (
          <div className="flex items-center justify-between gap-4">
            <ActionButton 
              onClick={handleRetake}
              variant="outline"
              className="flex-1"
            >
              Retake
            </ActionButton>
            
            <ActionButton 
              onClick={handleConfirm}
              icon={<CheckCircle className="w-5 h-5" />}
              className="flex-1"
            >
              Use Photo
            </ActionButton>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-primary bg-white focus-ring flex items-center justify-center relative"
              disabled={isLoading}
              aria-label="Take photo"
            >
              <div className="absolute inset-3 rounded-full bg-primary"></div>
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CameraPage;
