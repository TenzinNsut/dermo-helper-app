
import * as tf from '@tensorflow/tfjs';

export interface PredictionResult {
  prediction: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class ModelService {
  private model: tf.GraphModel | null = null;
  private labels: string[] = ['Benign', 'Malignant'];
  private initialized: boolean = false;
  private initializing: boolean = false;

  constructor() {}

  async initialize(modelUrl: string): Promise<void> {
    if (this.initialized || this.initializing) return;
    
    try {
      this.initializing = true;
      console.log('Loading model from:', modelUrl);
      
      // Load the model
      this.model = await tf.loadGraphModel(modelUrl);
      
      console.log('Model loaded successfully');
      this.initialized = true;
      this.initializing = false;
    } catch (error) {
      console.error('Failed to load model:', error);
      this.initializing = false;
      throw new Error('Failed to initialize the model');
    }
  }

  async predict(imageData: string): Promise<PredictionResult> {
    if (!this.model || !this.initialized) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    try {
      // Create an HTMLImageElement from the dataURL
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      // Preprocess the image (resize to model input size and normalize)
      const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224]) // Adjust to your model's expected input size
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims();

      // Run the inference
      const predictions = await this.model.predict(tensor) as tf.Tensor;
      
      // Get the prediction results
      const predictionArray = await predictions.data();
      const confidenceScore = Math.max(...Array.from(predictionArray));
      const predictedClassIndex = Array.from(predictionArray).indexOf(confidenceScore);
      
      // Clean up tensors
      tensor.dispose();
      predictions.dispose();
      
      // Map to prediction result
      const prediction = this.labels[predictedClassIndex] || 'Unknown';
      
      // Determine risk level based on confidence and prediction
      let riskLevel: 'low' | 'medium' | 'high';
      if (prediction === 'Benign') {
        riskLevel = 'low';
      } else {
        // For malignant predictions, set risk level based on confidence
        if (confidenceScore < 0.7) {
          riskLevel = 'medium';
        } else {
          riskLevel = 'high';
        }
      }
      
      return {
        prediction,
        confidence: confidenceScore,
        riskLevel
      };
    } catch (error) {
      console.error('Prediction error:', error);
      throw new Error('Failed to process the image');
    }
  }
}

// Create a singleton instance
export const modelService = new ModelService();
