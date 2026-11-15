import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime Web for browser and mobile WebAssembly execution
ort.env.wasm.numThreads = 1; // Single-threaded for maximum cross-device compatibility
ort.env.wasm.simd = true;

export interface PredictionResult {
  prediction: string;          // 'Benign' | 'Malignant'
  confidence: number;          // malignant probability (0 - 1)
  benignProb: number;          // benign probability (0 - 1)
  malignantProb: number;       // malignant probability (0 - 1)
  riskLevel: 'low' | 'medium' | 'high';
  riskTier: string;            // 'Low Risk (Benign)' | 'Medium Risk (Potentially Malignant)' | 'High Risk (Likely Malignant)'
  inferenceTimeMs: number;     // Execution duration in ms
}

/**
 * Image Preprocessing using HTML5 <canvas>:
 * 1. Resize & Crop: Center-crops image to a 1:1 aspect ratio, then resizes to 224x224 pixels.
 * 2. Extract Pixel Data: Uses ctx.getImageData(0, 0, 224, 224) to get the RGBA array.
 * 3. Normalize: Loops through pixels, extracts R, G, B channels (ignores Alpha), and normalizes
 *    using ImageNet statistics:
 *      Mean: R: 0.485, G: 0.456, B: 0.406
 *      Std:  R: 0.229, G: 0.224, B: 0.225
 *      Formula per channel: (value / 255.0 - mean) / std
 * 4. Transpose to CHW: Flattens normalized data into a single Float32Array of size 150,528
 *    (3 * 224 * 224), sequentially storing all Red values, then all Green values, then all Blue values.
 */
export function preprocessImageCanvas(imgElement: HTMLImageElement): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to obtain 2D rendering context from HTML5 canvas.');
  }

  // 1. Center-crop to 1:1 aspect ratio, then resize to 224x224
  const srcWidth = imgElement.naturalWidth || imgElement.width;
  const srcHeight = imgElement.naturalHeight || imgElement.height;
  const side = Math.min(srcWidth, srcHeight);
  const sx = (srcWidth - side) / 2;
  const sy = (srcHeight - side) / 2;

  ctx.drawImage(imgElement, sx, sy, side, side, 0, 0, 224, 224);

  // 2. Extract Pixel Data: RGBA array (224 * 224 * 4)
  const imageData = ctx.getImageData(0, 0, 224, 224);
  const rgba = imageData.data;

  // 3 & 4. Normalize & Transpose to CHW (size 150,528 = 3 * 224 * 224)
  const numPixels = 224 * 224; // 50,176 pixels
  const preprocessedData = new Float32Array(3 * numPixels); // 150,528 elements

  // ImageNet normalization constants
  const meanR = 0.485, meanG = 0.456, meanB = 0.406;
  const stdR = 0.229,  stdG = 0.224,  stdB = 0.225;

  for (let i = 0; i < numPixels; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    // rgba[i * 4 + 3] (Alpha) is ignored

    // Formula per channel: (value / 255.0 - mean) / std
    preprocessedData[i] = (r / 255.0 - meanR) / stdR;                       // All Red values: [0 .. 50,175]
    preprocessedData[numPixels + i] = (g / 255.0 - meanG) / stdG;           // All Green values: [50,176 .. 100,351]
    preprocessedData[2 * numPixels + i] = (b / 255.0 - meanB) / stdB;       // All Blue values: [100,352 .. 150,527]
  }

  return preprocessedData;
}

export class ModelService {
  private session: ort.InferenceSession | null = null;
  private initializing: Promise<void> | null = null;
  private labels: string[] = ['Benign', 'Malignant'];
  private readyListeners: Set<(ready: boolean) => void> = new Set();

  /**
   * Check if the quantized ONNX model is loaded in WASM memory and ready to run offline
   */
  isReady(): boolean {
    return this.session !== null;
  }

  /**
   * Subscribe to model readiness state changes
   * Immediately notifies the listener with the current state upon subscription
   */
  onReadyChange(listener: (ready: boolean) => void): () => void {
    this.readyListeners.add(listener);
    try {
      listener(this.isReady());
    } catch (err) {
      console.error('[ModelService] Listener error on initial callback:', err);
    }
    return () => {
      this.readyListeners.delete(listener);
    };
  }

  private notifyReady(ready: boolean): void {
    this.readyListeners.forEach((listener) => {
      try {
        listener(ready);
      } catch (err) {
        console.error('[ModelService] Listener notification error:', err);
      }
    });
  }

  // Initialize and load the quantized ONNX model
  async initialize(customUrl?: string): Promise<void> {
    if (this.session) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      const candidatePaths = [
        customUrl,
        '/models/student_model_quantized.onnx',
        'models/student_model_quantized.onnx',
        'public/models/student_model_quantized.onnx',
      ].filter(Boolean) as string[];

      let loadedSession: ort.InferenceSession | null = null;
      let lastError: unknown = null;

      for (const path of candidatePaths) {
        try {
          console.log(`[ModelService] Attempting to load ONNX model from: ${path}`);
          const session = await ort.InferenceSession.create(path, {
            executionProviders: ['wasm'],
          });
          if (session) {
            loadedSession = session;
            console.log(`[ModelService] Successfully loaded student_model_quantized.onnx from: ${path}`);
            console.log(`[ModelService] Model inputs:`, session.inputNames);
            console.log(`[ModelService] Model outputs:`, session.outputNames);
            break;
          }
        } catch (err) {
          console.warn(`[ModelService] Could not load from ${path}:`, err);
          lastError = err;
        }
      }

      if (!loadedSession) {
        this.session = null;
        this.initializing = null;
        this.notifyReady(false);
        throw lastError || new Error('Failed to load student_model_quantized.onnx');
      }

      this.session = loadedSession;
      this.notifyReady(true);
    })().catch((err) => {
      this.session = null;
      this.initializing = null;
      this.notifyReady(false);
      throw err;
    });

    return this.initializing;
  }

  // Run actual ONNX model inference (Zero Guesswork)
  async predict(imageData: string): Promise<PredictionResult> {
    const startTime = performance.now();

    if (!this.session) {
      await this.initialize();
    }

    if (!this.session) {
      throw new Error('ONNX inference session not available.');
    }

    // Load image element
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Failed to load image for ONNX processing'));
      img.src = imageData;
    });

    // 1. Preprocess image using HTML5 <canvas> (Center-crop, 224x224, ImageNet normalized, CHW Float32Array)
    const preprocessedData = preprocessImageCanvas(img);

    // 2. Convert preprocessed Float32Array into ONNX tensor: [1, 3, 224, 224]
    const onnxTensor = new ort.Tensor('float32', preprocessedData, [1, 3, 224, 224]);

    const inputName = this.session.inputNames[0] || 'input';
    const outputName = this.session.outputNames[0] || 'output';

    // 3. Execute ONNX inference and extract output array ([Benign_Logit, Malignant_Logit])
    const feeds = { [inputName]: onnxTensor };
    const results = await this.session.run(feeds);
    const outputData = results[outputName].data as Float32Array;

    console.log('[ModelService] Evaluated with student_model_quantized.onnx. Raw logits:', Array.from(outputData));

    // 4. Numerically stable Softmax over [Benign_Logit, Malignant_Logit]
    const benLogit = outputData[0];
    const malLogit = outputData[1];
    const maxLogit = Math.max(benLogit, malLogit);
    const exp0 = Math.exp(benLogit - maxLogit);
    const exp1 = Math.exp(malLogit - maxLogit);
    const sum = exp0 + exp1;
    const benignProb = exp0 / sum;
    const malignantProb = exp1 / sum;

    // 5. Apply Calibrated Threshold: strict threshold of 0.46 (do NOT use 0.50)
    // If malignantProb >= 0.75 → "High Risk (Likely Malignant)"
    // If malignantProb >= 0.46 → "Medium Risk (Potentially Malignant)"
    // If malignantProb < 0.46  → "Low Risk (Benign)"
    const threshold = 0.46;
    const label = malignantProb >= threshold ? 'Malignant' : 'Benign';

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskTier = 'Low Risk (Benign)';

    if (malignantProb >= 0.75) {
      riskLevel = 'high';
      riskTier = 'High Risk (Likely Malignant)';
    } else if (malignantProb >= threshold) {
      riskLevel = 'medium';
      riskTier = 'Medium Risk (Potentially Malignant)';
    } else {
      riskLevel = 'low';
      riskTier = 'Low Risk (Benign)';
    }

    const inferenceTimeMs = Math.round(performance.now() - startTime);

    console.log(`[ModelService] Inference completed in ${inferenceTimeMs}ms: ${label} (${(malignantProb * 100).toFixed(1)}% Malignant, ${(benignProb * 100).toFixed(1)}% Benign)`);

    return {
      prediction: label,
      confidence: malignantProb,
      benignProb,
      malignantProb,
      riskLevel,
      riskTier,
      inferenceTimeMs,
    };
  }
}

// Create a singleton instance
export const modelService = new ModelService();
