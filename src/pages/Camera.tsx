
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image, RefreshCw, CheckCircle, X } from 'lucide-react';
import Layout from '@/components/Layout';
import ActionButton from '@/components/ActionButton';
import { useCapacitorCamera } from '@/hooks/useCapacitorCamera';
import ImagePreview from '@/components/ImagePreview';
import { useToast } from '@/hooks/use-toast';

const CameraPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    capturedImage,
    isLoading,
    error,
    takePicture,
    selectFromGallery,
    resetImage
  } = useCapacitorCamera();

  React.useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error
      });
    }
  }, [error, toast]);

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
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {capturedImage ? (
          <div className="w-full h-full">
            <ImagePreview src={capturedImage} className="w-full h-full" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-8">
            <div className="p-6 rounded-full bg-primary/10 animate-pulse">
              <Camera size={64} className="text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Use the buttons below to take a picture or select from your gallery
            </p>
          </div>
        )}
      </div>

      <div className="p-6 bg-background">
        {capturedImage ? (
          <div className="flex items-center justify-between gap-4">
            <ActionButton 
              onClick={resetImage}
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
          <div className="flex flex-col gap-3">
            <ActionButton 
              onClick={takePicture}
              loading={isLoading}
              icon={<Camera className="w-5 h-5" />}
              className="w-full"
            >
              Take Photo
            </ActionButton>
            
            <ActionButton 
              onClick={selectFromGallery}
              loading={isLoading}
              variant="outline"
              icon={<Image className="w-5 h-5" />}
              className="w-full"
            >
              Select from Gallery
            </ActionButton>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CameraPage;
