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
  const [displaySrc, setDisplaySrc] = useState<string>('');
  
  // Reset loaded state when src changes
  useEffect(() => {
    setIsLoaded(false);
    
    // Validate and process the image source
    if (src && typeof src === 'string') {
      // Add timestamp to force refresh (helps with Android caching issues)
      const timestamp = new Date().getTime();
      // Make sure the src is a valid data URL
      if (src.startsWith('data:image/')) {
        setDisplaySrc(`${src}`);
      } else if (src.startsWith('file://') || src.startsWith('content://')) {
        // Handle Android file/content URIs by marking it as loaded
        // The actual src will be used directly
        setDisplaySrc(src);
        // For Android file/content URIs, we assume it's loaded already
        // as we can't reliably detect load events for these
        setIsLoaded(true);
      } else {
        // For web URLs, add cache breaking
        setDisplaySrc(`${src}?t=${timestamp}`);
      }
      
      console.log('Image preview source processed:', src.substring(0, 30) + '...');
    } else {
      console.error('Invalid image source provided to ImagePreview');
      setDisplaySrc('');
    }
  }, [src]);

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setIsLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Error loading image:', e);
    setIsLoaded(false);
  };

  return (
    <div className={`relative rounded-lg overflow-hidden bg-muted/30 ${className}`}>
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted-foreground/20"></div>
        </div>
      )}
      
      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
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
