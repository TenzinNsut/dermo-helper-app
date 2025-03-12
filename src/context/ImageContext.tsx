
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ImageContextType = {
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  analysisResult: null | {
    prediction: string;
    confidence: number;
  };
  setAnalysisResult: (result: null | { prediction: string; confidence: number }) => void;
  resetState: () => void;
};

const defaultContext: ImageContextType = {
  capturedImage: null,
  setCapturedImage: () => {},
  analysisResult: null,
  setAnalysisResult: () => {},
  resetState: () => {},
};

const ImageContext = createContext<ImageContextType>(defaultContext);

export const useImageContext = () => useContext(ImageContext);

export const ImageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<null | { prediction: string; confidence: number }>(null);

  const resetState = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  return (
    <ImageContext.Provider
      value={{
        capturedImage,
        setCapturedImage,
        analysisResult,
        setAnalysisResult,
        resetState,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
};
