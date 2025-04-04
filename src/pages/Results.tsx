import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Share2, Download, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import ActionButton from '@/components/ActionButton';
import ImagePreview from '@/components/ImagePreview';
import { modelService, PredictionResult } from '@/services/modelService';
import { useToast } from '@/hooks/use-toast';
// Import pdfmake for PDF generation
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
// Import file-saver for downloading files on web
import { saveAs } from 'file-saver';
// Import Capacitor plugins for file operations
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isPlatform } from '@ionic/core';

// Initialize pdfMake with fonts (with type assertion)
(pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

// Path to the model - try both ONNX and TensorFlow.js formats
const MODEL_URL = '/models/student_model_quantized.onnx'; 
const TF_MODEL_URL = '/models/model.json'; // TensorFlow.js model path if converted

// Interface for analysis result
interface AnalysisResult {
  success: boolean;
  usingFallback: boolean;
}

// Helper to determine if we're running in a Capacitor app
const isCapacitorApp = () => {
  return Boolean(window.Capacitor?.isNativePlatform());
};

// Helper function to detect mobile browsers
const isMobileBrowser = () => {
  // If running in a Capacitor app, it's not a mobile browser
  if (isCapacitorApp()) return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Convert image data URL to base64 for PDF
  const getBase64FromDataUrl = (dataUrl: string): string => {
    // If already a data URL, extract the base64 part
    if (dataUrl.startsWith('data:')) {
      return dataUrl.split(',')[1];
    }
    return dataUrl;
  };

  // Convert WebP images to JPEG for better PDF compatibility
  const convertWebPToJpeg = async (imageData: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create an image element to load the WebP
        const img = new Image();
        img.onload = () => {
          // Create a canvas to draw and convert the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image on the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPEG format
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(jpegDataUrl);
        };
        
        img.onerror = (error) => {
          console.error('Error loading image for conversion:', error);
          // If conversion fails, return the original image
          resolve(imageData);
        };
        
        img.src = imageData;
      } catch (error) {
        console.error('Error in WebP conversion:', error);
        // If anything goes wrong, return the original
        resolve(imageData);
      }
    });
  };

  // Create simplified PDF definition - focus on minimal structure for maximum compatibility
  const createPdfDefinition = (results: PredictionResult, imageData: string) => {
    const imageBase64 = getBase64FromDataUrl(imageData);
    const currentDate = new Date().toLocaleString();
    const confidencePercentage = Math.round(results.confidence * 100);
    
    // Basic description text with no special formatting
    const getRiskDescription = () => {
      switch(results.riskLevel) {
        case 'low': 
          return 'The image appears to show characteristics consistent with benign skin conditions.';
        case 'medium': 
          return 'The image shows some concerning features that may require medical attention.';
        case 'high': 
          return 'The image shows features highly suggestive of a potential malignancy.';
        default: 
          return '';
      }
    };
    
    // Plain warning text (only for medium/high risk)
    const warningText = results.riskLevel !== 'low' 
      ? [{
          text: 'Please consult with a healthcare professional as soon as possible for a proper evaluation.',
          fontSize: 10,
          color: '#ff8f00',
          margin: [0, 5, 0, 15]
        }] 
      : [];
    
    // Create a very basic PDF document definition with minimal styling
    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: 'Skin Analysis Report',
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 15]
        },
        {
          image: 'data:image/jpeg;base64,' + imageBase64,
          width: 250,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        {
          table: {
            headerRows: 1,
            widths: ['40%', '*'],
            body: [
              ['Analysis Result:', results.prediction],
              ['Confidence:', `${confidencePercentage}%`],
              ['Risk Level:', `${results.riskLevel === 'low' ? 'Low' : results.riskLevel === 'medium' ? 'Medium' : 'High'} Risk`]
            ]
          },
          margin: [0, 0, 0, 20]
        },
        {
          text: getRiskDescription(),
          margin: [0, 0, 0, 10]
        },
        ...warningText,
        {
          text: `Report generated on ${currentDate}`,
          fontSize: 10,
          color: '#666666',
          margin: [0, 15, 0, 5]
        },
        {
          text: 'This is an AI-generated assessment and should not be considered as a medical diagnosis.',
          fontSize: 9,
          color: '#999999',
          alignment: 'center',
          margin: [0, 10, 0, 0]
        }
      ]
    };
  };

  // Save PDF to device (Android/iOS)
  const saveMobilePdf = async (results: PredictionResult, imageData: string, forSharing = false): Promise<{ uri: string; path?: string } | null> => {
    try {
      toast({
        title: 'Generating PDF',
        description: 'Please wait...',
      });
      
      // Ensure image is in compatible format
      const compatibleImage = await convertWebPToJpeg(imageData);
      
      // Generate PDF with pdfmake - using binary output for better compatibility
      const pdfDoc = pdfMake.createPdf(createPdfDefinition(results, compatibleImage));
      
      // Create filename
      const timestamp = new Date().getTime();
      const fileName = `skin-report-${timestamp}.pdf`;
      
      // Get PDF as Uint8Array
      const pdfBytes = await new Promise<Uint8Array>((resolve) => {
        pdfDoc.getBuffer((buffer) => {
          resolve(buffer);
        });
      });
      
      // Convert to base64 for Capacitor Filesystem
      const pdfBase64 = btoa(
        Array.from(new Uint8Array(pdfBytes))
          .map(b => String.fromCharCode(b))
          .join('')
      );
      
      // For sharing, use Cache directory
      if (forSharing) {
        try {
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Cache
          });
          
          return { uri: savedFile.uri, path: 'temporary storage' };
        } catch (error) {
          console.error("Error saving to cache:", error);
          throw error;
        }
      } else {
        try {
          // Try Documents directory first (Android 10+)
          try {
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: pdfBase64,
              directory: Directory.Documents
            });
            
            return { uri: savedFile.uri, path: 'Documents folder' };
          } catch (docError) {
            console.error("Error saving to Documents:", docError);
            
            // Try ExternalStorage with Download path
            try {
              const savedFile = await Filesystem.writeFile({
                path: `Download/${fileName}`,
                data: pdfBase64,
                directory: Directory.ExternalStorage
              });
              
              return { uri: savedFile.uri, path: 'Downloads folder' };
            } catch (downloadError) {
              console.error("Error saving to Downloads:", downloadError);
              
              // Last try - Data directory
              const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: pdfBase64,
                directory: Directory.Data
              });
              
              return { uri: savedFile.uri, path: 'app storage' };
            }
          }
        } catch (error) {
          console.error("All save attempts failed:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error generating or saving PDF:', error);
      toast({
        title: 'Save failed',
        description: 'Unable to save the report. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Save PDF report on web browsers (both desktop and mobile)
  const saveWebPdf = async (results: PredictionResult, imageData: string): Promise<boolean> => {
    try {
      toast({
        title: 'Generating PDF',
        description: 'Please wait...',
      });
      
      // Process image for PDF compatibility
      const compatibleImage = await convertWebPToJpeg(imageData);
      
      // Create PDF content
      const documentDefinition = createPdfDefinition(results, compatibleImage);
      
      // Create simple filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `dermohelper-report-${timestamp}.pdf`;
      
      // Create PDF with type assertion
      const pdfDoc = (pdfMake as any).createPdf(documentDefinition);
      
      // Use the simplest most reliable approach
      return new Promise<boolean>((resolve) => {
        try {
          // Download approach for mobile browsers
          if (isMobileBrowser()) {
            // Generate base64 and use a data URL download
            pdfDoc.getBase64((base64: string) => {
              try {
                const pdfDataUri = `data:application/pdf;base64,${base64}`;
                
                // Create an anchor element for download
                const downloadLink = document.createElement('a');
                downloadLink.href = pdfDataUri;
                downloadLink.download = fileName;
                downloadLink.style.display = 'none';
                
                // Append to body, click to trigger download, then remove
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Some browsers need time to process the click
                setTimeout(() => {
                  document.body.removeChild(downloadLink);
                  
                  toast({
                    title: 'Report ready',
                    description: 'PDF has been downloaded to your device',
                  });
                  
                  resolve(true);
                }, 100);
              } catch (err) {
                console.error('Error creating download link:', err);
                
                toast({
                  title: 'Save failed',
                  description: 'Unable to save PDF. Please try again.',
                  variant: 'destructive',
                });
                
                resolve(false);
              }
            });
          } else {
            // For desktop browsers use FileServer
            pdfDoc.getBuffer((buffer: Uint8Array) => {
              try {
                const blob = new Blob([buffer], { type: 'application/pdf' });
                saveAs(blob, fileName);
                
                toast({
                  title: 'Report ready',
                  description: 'PDF has been downloaded to your device',
                });
                
                resolve(true);
              } catch (err) {
                console.error('Error saving PDF with blob:', err);
                
                toast({
                  title: 'Save failed',
                  description: 'Unable to save PDF. Please try again.',
                  variant: 'destructive',
                });
                
                resolve(false);
              }
            });
          }
        } catch (err) {
          console.error('Unexpected error in PDF generation:', err);
          
          toast({
            title: 'Save failed',
            description: 'Unable to generate PDF. Please try again.',
            variant: 'destructive',
          });
          
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error in saveWebPdf:', error);
      
      toast({
        title: 'Save failed',
        description: 'Unable to generate the report. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Simplified text-only sharing for mobile web browsers
  const shareResults = async (results: PredictionResult): Promise<boolean> => {
    try {
      // Create simple text summary to share
      const shareText = `DermoHelper Analysis: ${results.prediction} (${Math.round(results.confidence * 100)}% confidence, ${results.riskLevel === 'low' ? 'Low' : results.riskLevel === 'medium' ? 'Medium' : 'High'} risk level)`;
      
      // First try Web Share API (works on most mobile browsers)
      if (navigator.share) {
        await navigator.share({
          title: 'Skin Analysis Results',
          text: shareText
        });
        
        toast({
          title: 'Shared successfully',
          description: 'Analysis results have been shared',
        });
        
        return true;
      }
      
      // Otherwise try clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        
        toast({
          title: 'Copied to clipboard',
          description: 'Results copied and ready to paste',
        });
        
        return true;
      }
      
      // Last resort fallback - show alert with text to copy manually
      alert('Copy this result:\n\n' + shareText);
      
      toast({
        title: 'Manual copy needed',
        description: 'Please copy the text from the alert box',
      });
      
      return true;
    } catch (error) {
      console.error('Error sharing results:', error);
      
      toast({
        title: 'Share failed',
        description: 'Unable to share results. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  useEffect(() => {
    const data = location.state?.imageData;
    if (data) {
      // Log the type and beginning of image data to help with debugging
      console.log('Received image data:', 
        typeof data === 'string' ? 
          `${data.substring(0, 30)}... (${data.length} characters)` : 
          'not a string'
      );
      
      setImageData(data);
      
      // Initialize model and analyze image
      initializeModelAndAnalyze(data);
    } else {
      // No image provided, redirect back to home
      navigate('/');
    }
  }, [location.state, navigate]);

  const initializeModelAndAnalyze = async (imageData: string) => {
    setIsAnalyzing(true);
    setModelError(null);
    setUsingFallback(false);
    
    try {
      console.log("Running on Capacitor native app:", isCapacitorApp());
      console.log("Device info:", 
        isCapacitorApp() ? 
          "Native Android/iOS app" : 
          (isMobileBrowser() ? "Mobile browser" : "Desktop browser")
      );
      
      // Enforce no fallback for native apps
      if (isCapacitorApp() && window.useLightVersion === true) {
        console.log("Explicitly disabling light version for native app");
        window.useLightVersion = false;
      }
      
      // Try to initialize with ONNX model first
      try {
        // For Android, we need a different model path approach
        const adjustedModelUrl = isCapacitorApp() ? 
          (MODEL_URL.startsWith('/') ? MODEL_URL.substring(1) : MODEL_URL) : 
          MODEL_URL;
          
        console.log("Attempting to initialize with ONNX model:", adjustedModelUrl);
        await modelService.initialize(adjustedModelUrl);
        console.log("Successfully initialized with ONNX model");
      } catch (onnxError) {
        console.error("Failed to initialize with ONNX model:", onnxError);
        
        // If ONNX fails, try TensorFlow.js model
        try {
          // For Android, adjust TF.js model path too
          const adjustedTfModelUrl = isCapacitorApp() ? 
            (TF_MODEL_URL.startsWith('/') ? TF_MODEL_URL.substring(1) : TF_MODEL_URL) : 
            TF_MODEL_URL;
            
          console.log("Attempting to initialize with TensorFlow.js model:", adjustedTfModelUrl);
          await modelService.initialize(adjustedTfModelUrl);
          console.log("Successfully initialized with TensorFlow.js model");
        } catch (tfError) {
          console.error("Failed to initialize with TensorFlow.js model:", tfError);
          // Both failed, but modelService should handle fallback
          console.log("Both models failed to load, using fallback");
        }
      }
      
      // Access useFallback to check if we're using fallback before analysis
      const modelServiceWithFallback = modelService as unknown as { useFallback: boolean };
      console.log("Current fallback status before analysis:", modelServiceWithFallback.useFallback);
      
      // Analyze the image
      const result = await analyzeImage(imageData);
      if (result && result.usingFallback) {
        console.log("Using fallback for analysis due to model loading issues");
        setUsingFallback(true);
      }
    } catch (error) {
      console.error('Model initialization error:', error);
      setModelError('Failed to initialize the skin analysis model. Falling back to sample data.');
      
      // Fallback to sample data if model fails
      simulateAnalysis();
    }
  };

  const analyzeImage = async (imageData: string): Promise<AnalysisResult | null> => {
    try {
      const prediction = await modelService.predict(imageData);
      setResults(prediction);
      // Access the useFallback property via a type assertion
      const modelServiceWithFallback = modelService as unknown as { useFallback: boolean };
      return { success: true, usingFallback: modelServiceWithFallback.useFallback };
    } catch (error) {
      console.error('Analysis error:', error);
      setModelError('Error analyzing the image. Falling back to sample data.');
      simulateAnalysis();
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fallback function if the model fails
  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      // Mock result - replace with actual TensorFlow Lite integration
      const mockPredictions = [
        { prediction: 'Benign', confidence: 0.92, riskLevel: 'low' as const },
        { prediction: 'Potentially malignant', confidence: 0.78, riskLevel: 'medium' as const },
        { prediction: 'Likely malignant', confidence: 0.85, riskLevel: 'high' as const }
      ];
      
      // Randomly select one result for demo purposes
      const randomResult = mockPredictions[Math.floor(Math.random() * mockPredictions.length)];
      setResults(randomResult);
      setIsAnalyzing(false);
    }, 2500);
  };

  const getRiskColor = (riskLevel: string) => {
    switch(riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <Layout>
      <div className="flex flex-col animate-fade-in">
        {/* Image preview */}
        <div className="mb-6">
          {imageData && (
            <ImagePreview 
              src={imageData} 
              className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-sm" 
            />
          )}
        </div>
        
        {/* Analysis section */}
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Analysis Results</h2>
          
          {modelError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800 text-sm">{modelError}</p>
            </div>
          )}

          {usingFallback && !modelError && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800 text-sm">
                Using simplified analysis as the full model couldn't be loaded. Results are approximated.
              </p>
            </div>
          )}
          
          {isAnalyzing ? (
            <div className="bg-secondary/50 rounded-lg p-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Analyzing your image...</p>
            </div>
          ) : results ? (
            <div className="bg-card rounded-lg border shadow-sm p-6 animate-scale-in">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getRiskColor(results.riskLevel)}`}>
                {results.riskLevel === 'low' ? 'Low Risk' : 
                 results.riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
              </div>
              
              <h3 className="text-xl font-medium mb-2">{results.prediction}</h3>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(results.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${results.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  {results.riskLevel === 'low' 
                    ? 'The image appears to show characteristics consistent with benign skin conditions.'
                    : results.riskLevel === 'medium'
                    ? 'The image shows some concerning features that may require medical attention.'
                    : 'The image shows features highly suggestive of a potential malignancy.'}
                </p>
                
                {results.riskLevel !== 'low' && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-800 text-xs">
                      Please consult with a healthcare professional as soon as possible for a proper evaluation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Action buttons */}
        {results && (
          <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <ActionButton 
              variant="outline"
              icon={<Share2 className="w-4 h-4" />}
              className="text-sm"
              onClick={async () => {
                // Share results as text (more reliable)
                if (results) {
                  try {
                    // Share directly using our simplified sharing function
                    await shareResults(results);
                  } catch (error) {
                    console.error('Error sharing results:', error);
                    toast({
                      title: 'Share failed',
                      description: 'Unable to share results. Please try again.',
                      variant: 'destructive',
                    });
                  }
                }
              }}
            >
              Share Results
            </ActionButton>
            
            <ActionButton 
              variant="outline"
              icon={<Download className="w-4 h-4" />}
              className="text-sm"
              onClick={async () => {
                // Generate and save a PDF report
                if (results && imageData) {
                  try {
                    // Check if this is a Capacitor app on a mobile device
                    const isCapacitorApp = isPlatform('android') || isPlatform('ios');
                    
                    if (isCapacitorApp) {
                      // For Capacitor app, save using Capacitor Filesystem
                      const savedFile = await saveMobilePdf(results, imageData, false);
                      
                      if (savedFile) {
                        toast({
                          title: 'Report saved',
                          description: `PDF saved to ${savedFile.path || 'device storage'}`,
                        });
                        
                        // User tip
                        setTimeout(() => {
                          toast({
                            title: 'Tip',
                            description: 'Open Files app to view the PDF in Documents or Downloads folder',
                          });
                        }, 2000);
                      }
                    } else {
                      // For all web browsers (desktop or mobile)
                      await saveWebPdf(results, imageData);
                    }
                  } catch (error) {
                    console.error('Error saving report:', error);
                    toast({
                      title: 'Save failed',
                      description: 'Unable to save the report. Please try again.',
                      variant: 'destructive',
                    });
                  }
                }
              }}
            >
              Save Report
            </ActionButton>
          </div>
        )}
        
        {/* Next actions */}
        <div className="mt-auto">
          <ActionButton
            className="w-full"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            onClick={() => navigate('/')}
          >
            Scan Another Image
          </ActionButton>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
