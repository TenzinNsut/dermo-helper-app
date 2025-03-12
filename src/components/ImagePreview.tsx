
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  onRemove?: () => void;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  src, 
  alt = "Preview image", 
  onRemove,
  className = "" 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Reset loaded state when src changes
  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <div className={`relative rounded-lg overflow-hidden bg-muted/30 ${className}`}>
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted-foreground/20"></div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
      />
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white focus-ring"
          aria-label="Remove image"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default ImagePreview;
