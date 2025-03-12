
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Share2, Download, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import ActionButton from '@/components/ActionButton';
import ImagePreview from '@/components/ImagePreview';

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Mock results - this would be replaced with TensorFlow Lite predictions
  const [results, setResults] = useState<{ 
    prediction: string;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
  } | null>(null);

  useEffect(() => {
    const data = location.state?.imageData;
    if (data) {
      setImageData(data);
      simulateAnalysis();
    } else {
      // No image provided, redirect back to home
      navigate('/');
    }
  }, [location.state, navigate]);

  // This function is a placeholder and would be replaced with actual TensorFlow Lite analysis
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
              onClick={() => {
                // Implementation for sharing would go here
                alert('Share functionality would be implemented here');
              }}
            >
              Share Results
            </ActionButton>
            
            <ActionButton 
              variant="outline"
              icon={<Download className="w-4 h-4" />}
              className="text-sm"
              onClick={() => {
                // Implementation for downloading would go here
                alert('Download functionality would be implemented here');
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
